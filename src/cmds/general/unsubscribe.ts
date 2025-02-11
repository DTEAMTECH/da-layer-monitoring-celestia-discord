import { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { kv } from "app/services/storage.ts";
import { nodesAPI } from "app/services/api.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";

const command = new SlashCommandBuilder()
    .setName("unsubscribe")
    .setDescription("Unsubscribe from updates about your node")
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName("id")
            .setDescription("Node id (e.g. 12D3Koo... (Bridge))")
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
      return json({ type: 4, data: { embeds: [embed] } });
    }
    const userId = interaction.member.user.id;
    const subscribedNodesIterator = kv.list({ prefix: ["subscription", userId] });
    const subscribedNodes: string[] = [];
    for await (const { key } of subscribedNodesIterator) {
      subscribedNodes.push(key[2]);
    }
    if (!subscribedNodes.length) {
      const embed = new EmbedBuilder()
          .setTitle("No Subscriptions")
          .setDescription("You have no subscriptions to unsubscribe from")
          .setColor(0xf3cd37)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed] } });
    }
    const choicesPromises = subscribedNodes.map(async (nodeId) => {
      const nodeType = await nodesAPI.getNodeType(nodeId);
      return { value: String(nodeId), name: `${nodeId} (${nodeType ?? "Unknown"})` };
    });
    const choices = await Promise.all(choicesPromises);
    return json({ type: 8, data: { choices } });
  },
  execute: async (data, interaction) => {
    if (!interaction.member) {
      const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("You must be in a server to use this command!")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" });
      return json({ type: 4, data: { embeds: [embed] } });
    }
    const userId = interaction.member.user.id;
    const param = data.options?.find((opt) => opt.name === "id");
    if (!param || param.type !== 3) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid Parameters")
          .setDescription("You must provide a valid bridge node id")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed] } });
    }
    const bridgeNode = await kv.get(["subscription", userId, param.value]);
    if (!bridgeNode.value) {
      const embed = new EmbedBuilder()
          .setTitle("Not Subscribed")
          .setDescription("You are not subscribed to this bridge node id")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed] } });
    }

    const nodeType = await nodesAPI.getNodeType(param.value);
    await kv.delete(["subscription", userId, param.value]);

    const embed = new EmbedBuilder()
        .setTitle("Unsubscribed Successfully")
        .setDescription(`You have successfully unsubscribed from **\`${nodeType ?? "Unknown"}\`** node **\`${param.value}\`**`)
        .setColor(0x7b2bf9)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
        .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date());
    return json({ type: 4, data: { embeds: [embed] } });
  },
};