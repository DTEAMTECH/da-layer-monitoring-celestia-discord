import { json, serve, validateRequest } from "sift/mod.ts";
import { cmdsRegisterHandler } from "app/handlers/cmds_register.ts";
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
} from "discord.js";
import { commands } from "app/cmds/mod.ts";
import config from "app/config.ts";
import nacl from "https://esm.sh/tweetnacl@v1.0.3?dts";
// start cron
import "app/cron.ts";

serve({
  "/api/interactions": main,
  "/cmds_register": cmdsRegisterHandler,
});

// The main logic of the Discord Slash Command is defined in this function.
async function main(request: Request) {
  // validateRequest() ensures that a request is of POST method and
  // has the following headers.
  console.log("Request headers", request.headers);
  const { error } = await validateRequest(request, {
    POST: {
      headers: ["x-signature-ed25519", "x-signature-timestamp"],
    },
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  const { valid, body } = await verifySignature(request);
  if (!valid) {
    return json(
      { error: "Invalid request" },
      {
        status: 401,
      },
    );
  }
  const parsedBody = JSON.parse(body);
  const { type = 0, data = { options: [] } } = parsedBody;
  console.log("type", type);

  // Discord performs Ping interactions to test our application.
  // Type 1 in a request implies a Ping interaction.
  if (type === 1) {
    console.log("Pinged!");

    return json({
      type: 1, // Type 1 in a response is a Pong interaction response type.
    });
  }

  // Type 2 in a request is an ApplicationCommand interaction.
  // It implies that a user has issued a command.
  if (type === 2) {
    const { name } = data;
    const interaction = parsedBody as APIApplicationCommandInteraction;
    const currentCommand = commands[name];
    // empty response if out of bot channel
    if (interaction?.channel_id !== config.BOT_CHANNEL_ID) {
      console.log("out of bot channel");
      return json({
        type: 4, // Channel message with source
        data: {
          content:
            `You must be in <#${config.BOT_CHANNEL_ID}> to use this command!`,
          flags: 64, // Ephemeral flag
        },
      });
    }
    if (!currentCommand) {
      return json({ error: "bad request" }, { status: 400 });
    }
    return await currentCommand.execute(data, interaction);
  }
  if (type === 4) { // AUTOCOMPLETE
    const { name } = data;
    const interaction =
      parsedBody as APIApplicationCommandAutocompleteInteraction;

    const currentCommand = commands[name];
    if (!currentCommand) {
      return json({ error: "bad request" }, { status: 400 });
    }
    if (!currentCommand.autocomplete) {
      return json({ error: "bad request" }, { status: 400 });
    }
    return currentCommand.autocomplete(interaction);
  }

  // We will return a bad request error as a valid Discord request
  // shouldn't reach here.
  return json({ error: "bad request" }, { status: 400 });
}

async function verifySignature(
  request: Request,
): Promise<{ valid: boolean; body: string }> {
  // Discord sends these headers with every request.
  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  const body = await request.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(config.DISCORD_PUBLIC_KEY),
  );

  return { valid, body };
}

/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)),
  );
}
