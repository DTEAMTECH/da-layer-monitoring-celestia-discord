import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";

const command = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get information about bridge node");

export const info: Command = {
  command,
  execute: async (_data, interaction) => {
    if (!interaction.member) {
      const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("You must be in a server to use this command!")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
      return json({
        type: 4,
        data: { embeds: [embed] },
      });
    }

    const userId = interaction.member.user.id;
    const username = interaction.member.user.username;
    const bridges = kv.list({ prefix: ["subscription", userId] });
    const allBridgeNodes = [];

    for await (const { key } of bridges) {
      allBridgeNodes.push(key[2]);
    }

    if (allBridgeNodes.length === 0) {
      const embed = new EmbedBuilder()
          .setTitle("No subscriptions")
          .setDescription("You are not subscribed to any bridge node id")
          .setColor(0xf3cd37)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())
      return json({
        type: 4,
        data: { embeds: [embed] },
      });
    }

    const allNodes = await Promise.all(
        allBridgeNodes.map((nodeId) => bridgeNodesAPI.buildInfo(String(nodeId))),
    );

    const embed = new EmbedBuilder()
        .setTitle(`Subscribed bridge node information`)
        .setColor(0x7b2bf9)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
        .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date())

    allNodes.forEach((node) => {
      const nodeInfo = node?.metric?.labels || {};
      embed.addFields([
        {
          name: `Bridge Node id`,
          value: `**\`${nodeInfo.exported_instance}\`**` || "Unknown",
          inline: false,
        },
        {
          name: "Build Version",
          value: nodeInfo.semantic_version || "N/A",
          inline: false,
        },
        {
          name: "Go Version",
          value: nodeInfo.golang_version || "N/A",
          inline: false,
        },
        {
          name: "Last Commit",
          value: nodeInfo.last_commit || "N/A",
          inline: false,
        },
        {
          name: "Build Time",
          value: nodeInfo.build_time || "N/A",
          inline: false,
        },
        {
          name: "System Version",
          value: nodeInfo.system_version || "N/A",
          inline: false,
        },
        {
          name: "Instance",
          value: `${nodeInfo.instance}` || `N/A`,
          inline: false,
        },
      ]);
    });

    return json({
      type: 4,
      data: { embeds: [embed] },
    });
  },
};
