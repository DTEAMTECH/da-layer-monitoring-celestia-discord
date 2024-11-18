import { SlashCommandBuilder, SlashCommandStringOption, EmbedBuilder } from "discord.js";
import { kv } from "app/services/storage.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";

const command = new SlashCommandBuilder()
    .setName("unsubscribe")
    .setDescription("Unsubscribe from updates about bridge node")
    .addStringOption((option: SlashCommandStringOption) =>
        option.setName("id")
            .setDescription("Bridge node id")
            .setRequired(true)
            .setAutocomplete(true)
    );

export const unsubscribe: Command = {
  command,
  autocomplete: async (interaction): Promise<Response> => {
    if (!interaction.member) {
      const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("You must be in a server to use this command!")
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setColor(0xaf3838);
      return json({
        type: 4,
        data: { embeds: [embed] },
      });
    }
    const userId = interaction.member.user.id;
    const subscribedNodesIterator = kv.list({ prefix: ["subscription", userId] });
    const subscribedNodes = [];
    for await (const { key } of subscribedNodesIterator) {
      subscribedNodes.push(key[2]);
    }

    if (!subscribedNodes.length) {
      const embed = new EmbedBuilder()
          .setTitle("No subscriptions")
          .setDescription("You have no subscriptions to unsubscribe from")
          .setColor(0xf3cd37)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())
      return json({
        type: 4,
        data: { embeds: [embed] },
      });
    }

    const choices = subscribedNodes.map((nodeId) => ({
      value: String(nodeId),
      name: String(nodeId),
    }));

    return json({
      type: 8,
      data: { choices },
    });
  },
  execute: async (data, interaction) => {
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
    const param = data.options?.find((opt) => opt.name === "id");
    if (!param || param.type !== 3) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid parameters")
          .setDescription("You must provide a valid bridge node id")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())
      return json({
        type: 4,
        data: { embeds: [embed] },
      });
    }

    const bridgeNode = await kv.get(["subscription", userId, param.value]);
    if (!bridgeNode.value) {
      const embed = new EmbedBuilder()
          .setTitle("Not subscribed")
          .setDescription("You are not subscribed to this bridge node id")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())
      return json({
        type: 4,
        data: { embeds: [embed] },
      });
    }

    await kv.delete(["subscription", userId, param.value]);
    const embed = new EmbedBuilder()
        .setTitle("Unsubscribed successfully")
        .setDescription(`You have successfully unsubscribed from **${param.value}**`)
        .setColor(0x7b2bf9)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
        .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date())
    return json({
      type: 4,
      data: { embeds: [embed] },
    });
  },
};