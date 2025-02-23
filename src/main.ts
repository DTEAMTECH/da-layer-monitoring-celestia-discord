import { json, serve, validateRequest } from "sift/mod.ts";
import { cmdsRegisterHandler } from "app/handlers/cmds_register.ts";
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
} from "discord.js";
import { commands } from "app/cmds/mod.ts";
import config from "app/config.ts";
import nacl from "https://esm.sh/tweetnacl@v1.0.3?dts";

serve({
  "/api/interactions": main,
  "/cmds_register": cmdsRegisterHandler,
});

async function main(request: Request) {
  console.log("Request headers", request.headers);
  const { error } = await validateRequest(request, {
    POST: {
      headers: ["x-signature-ed25519", "x-signature-timestamp"],
    },
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  const { valid, body } = await verifySignature(request);
  if (!valid) {
    return json({ error: "Invalid request" }, { status: 401 });
  }
  const parsedBody = JSON.parse(body);
  const { type = 0, data = { options: [] } } = parsedBody;
  console.log("type", type);

  if (type === 1) {
    console.log("Pinged!");
    return json({ type: 1 });
  }

  if (type === 2) {
    const { name } = data;
    const interaction = parsedBody as APIApplicationCommandInteraction;
    const currentCommand = commands[name];
    if (interaction?.channel_id !== config.BOT_CHANNEL_ID) {
      console.log("out of bot channel");
      return json({
        type: 4,
        data: {
          content: `You must be in <#${config.BOT_CHANNEL_ID}> to use this command!`,
          flags: 64,
        },
      });
    }
    if (!currentCommand) {
      return json({ error: "bad request" }, { status: 400 });
    }
    return await currentCommand.execute(data, interaction);
  }
  if (type === 4) {
    const { name } = data;
    const interaction = parsedBody as APIApplicationCommandAutocompleteInteraction;
    const currentCommand = commands[name];
    if (!currentCommand) {
      return json({ error: "bad request" }, { status: 400 });
    }
    if (!currentCommand.autocomplete) {
      return json({ error: "bad request" }, { status: 400 });
    }
    return currentCommand.autocomplete(interaction);
  }

  return json({ error: "bad request" }, { status: 400 });
}

async function verifySignature(request: Request): Promise<{ valid: boolean; body: string }> {
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

function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}