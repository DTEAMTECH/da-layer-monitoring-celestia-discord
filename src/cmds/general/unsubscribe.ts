import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { kv } from "app/services/storage.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";

const command = new SlashCommandBuilder()
  .setName("subscribe")
  .setDescription("Unsubscribe from updates about bridge node")
  .addStringOption((option: SlashCommandStringOption) =>
    option.setName("id")
      .setDescription("Bridge node ID")
      .setRequired(true)
      .setAutocomplete(true)
  );

export const unsubscribe: Command = {
  command,
  autocomplete: async (interaction): Promise<Response> => {
    if (!interaction.member) {
      return json({
        type: 8,
        data: {
          choices: [],
        },
      });
    }
    const userId = interaction.member.user.id;

    const subscribedNodesIterator = kv.list({
      prefix: ["subscription", userId],
    });
    const subscribedNodes = [];
    for await (const { key } of subscribedNodesIterator) {
      subscribedNodes.push(key[2]);
    }
    if (!subscribedNodes.length) {
      return json({
        type: 8,
        data: {
          choices: [],
        },
      });
    }
    const choices: { value: string; name: string }[] = subscribedNodes.map((
      nodeId,
    ) => ({
      value: String(nodeId),
      name: String(nodeId),
    }));

    return json({
      type: 8,
      data: {
        choices,
      },
    });
  },
  execute: async (data, interaction) => {
    if (!interaction.member) {
      return json({
        type: 4,
        data: {
          content: `You must be in a server to use this command!`,
        },
      });
    }
    const userId = interaction.member.user.id;
    const param = data.options?.find((opt) => opt.name === "id");
    if (!param) {
      return json({
        type: 4,
        data: {
          content: `You must provide parameters!`,
        },
      });
    }
    if (param.type !== 3) {
      return json({
        type: 4,
        data: {
          content: `Invalid type of parameters!`,
        },
      });
    }
    const bridgeNode = await kv.get(["subscription", userId, param.value]);
    if (!bridgeNode.value) {
      return json({
        type: 4,
        data: {
          content: `You are not subscribed to this bridge node!`,
        },
      });
    }

    await kv.delete(["subscription", userId, param.value]);

    return json({
      type: 4,
      data: {
        content:
          `You have succefully unsubscribed from bridge node: ${param.value}! Dear <@${userId}>`,
      },
    });
  },
};
