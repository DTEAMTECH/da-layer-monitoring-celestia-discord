import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";

import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";
const command = new SlashCommandBuilder()
  .setName("unsubscribe")
  .setDescription("Subscribe for the updates about your bridge node")
  .addStringOption((option: SlashCommandStringOption) =>
    option.setName("id")
      .setDescription("Bridge node ID")
      .setRequired(true)
      .setAutocomplete(true)
  );
const autocomplete = async () => {
  const nodesIds = await bridgeNodesAPI.getAllBridgeNodesIds();
  const choices = nodesIds.map((nodeId) => ({
    name: nodeId,
    value: nodeId,
  }));
  return json({
    type: 8,
    data: {
      choices,
    },
  });
};

export const subscribe: Command = {
  command,
  autocomplete,
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
    const username = interaction.member.user.username;
    const globalName = interaction.data.name;
    const subscribedAt = new Date().toISOString();
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

    kv.set(["user", userId], { username, id: userId, globalName });
    // todo: check if node bridge exists
    const nodesIds = await bridgeNodesAPI.getAllBridgeNodesIds();
    if (!nodesIds.includes(param.value)) {
      return json({
        type: 4,
        data: {
          content: `Invalid node bridge id!`,
        },
      });
    }
    kv.set(["subscription", userId, param.value], {
      userId,
      nodeBridgeId: param.value,
      subscribedAt,
    });

    return json({
      type: 4,
      data: {
        content:
          `You hava been subscribed to ${param.value}! Dear <@${userId}>`,
      },
    });
  },
};
