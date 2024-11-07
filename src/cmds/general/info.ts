import { SlashCommandBuilder } from "discord.js";
import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";

const command = new SlashCommandBuilder()
  .setName("info")
  .setDescription("Get information about your Bridge Node");

export const info: Command = {
  command,
  execute: async (_data, interaction) => {
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
    const bridges = kv.list({
      prefix: ["subscription", userId],
    });

    const allBridgeNodes = [];
    for await (const { key } of bridges) {
      allBridgeNodes.push(key[2]);
    }

    if (allBridgeNodes.length === 0) {
      return json({
        type: 4,
        data: {
          content: `You are not subscribed to any Bridge Node!`,
        },
      });
    }

    const allNodes = await Promise.all(
      allBridgeNodes.map((nodeId) => bridgeNodesAPI.buildInfo(String(nodeId))),
    );

    const message = allNodes
      .map((node) => {
        if (!node || !node.metric || !node.metric.labels) {
          return "**Bridge Node:** Unknown\n```\nNo data available\n```";
        }
        const labels = node.metric.labels as {
          exported_instance: string;
          semantic_version: string;
          golang_version: string;
          last_commit: string;
          build_time: string;
          system_version: string;
          instance: string;
        };
        return `**Bridge Node:** ${labels.exported_instance}\n\`\`\`
Build Version  : ${labels.semantic_version}
Go Version     : ${labels.golang_version}
Last Commit    : ${labels.last_commit}
Build Time     : ${labels.build_time}
System Version : ${labels.system_version}
Instance       : ${labels.instance}
    \`\`\``;
      })
      .join("\n\n");

    return json({
      type: 4,
      data: {
        content:
          `Hello ${username}! Here is the information on your subscribed Bridge Nodes:\n\n${message}`,
      },
    });
  },
};
