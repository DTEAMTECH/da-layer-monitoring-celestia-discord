import { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, ApplicationCommandOptionType } from "discord.js";
import { kv } from "app/services/storage.ts";
import { nodesAPI } from "app/services/api.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";
import type { APIApplicationCommandAutocompleteInteraction } from "discord.js";

const command = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get information about your subscribed node")
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName("id")
            .setDescription("Subscribed node id (e.g. 12D3Koo... (Bridge))")
            .setRequired(true)
            .setAutocomplete(true)
    );

const autocomplete = async (interaction: APIApplicationCommandAutocompleteInteraction) => {
  if (!interaction.member) return json({ type: 4, data: {} });
  const userId = interaction.member.user.id;
  const subs: string[] = [];
  for await (const { key } of kv.list({ prefix: ["subscription", userId] })) {
    subs.push(key[2]);
  }
  const choicesPromises = subs.map(async (nodeId) => {
    const nodeType = await nodesAPI.getNodeType(nodeId);
    return { name: `${nodeId} (${nodeType ?? "Unknown"})`, value: nodeId };
  });
  const choices = await Promise.all(choicesPromises);
  const findData = interaction.data.options.find((opt) => opt.name === "id");
  if (findData && findData.type === ApplicationCommandOptionType.String && findData.value.length) {
    const filteredChoices = choices.filter((choice) => choice.name.includes(findData.value));
    return json({ type: 8, data: { choices: filteredChoices.slice(0, 5) } });
  }
  return json({ type: 8, data: { choices: choices.slice(0, 5) } });
};

export const info: Command = {
  command,
  autocomplete,
  execute: async (_data, interaction) => {
    if (!interaction.member) {
      const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("You must be in a server to use this command!")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/da_layer_metrics.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" });
      return json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
    const userId = interaction.member.user.id;
    const param = _data.options?.find((opt) => opt.name === "id");
    if (!param) {
      const embed = new EmbedBuilder()
          .setTitle("Missing Parameters")
          .setDescription("You must provide a node id")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/da_layer_metrics.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
    const nodeId = param.value;
    let subscribed = false;
    for await (const { key } of kv.list({ prefix: ["subscription", userId] })) {
      if (key[2] === nodeId) { subscribed = true; break; }
    }
    if (!subscribed) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid Node Id")
          .setDescription("You are not subscribed to that node id")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/da_layer_metrics.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
    const nodeInfo = await nodesAPI.buildInfo(nodeId);
    if (!nodeInfo) {
      const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Failed to retrieve node information")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/da_layer_metrics.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
    const labels = nodeInfo.metric.labels;
    const nodeType = await nodesAPI.getNodeType(nodeId);
    const subscriptionEntry = await kv.get(["subscription", userId, nodeId]);
    let alertMessage = "";
    if (subscriptionEntry.value && typeof subscriptionEntry.value === "object" && "alerted" in subscriptionEntry.value) {
      const alerted = subscriptionEntry.value.alerted as Record<string, string>;
      const activeAlertsCount = Object.keys(alerted).length;
      if (activeAlertsCount > 0) {
        const alertNames = Object.keys(alerted).join(", ");
        alertMessage = `\u{1F534} You have ${activeAlertsCount}/4 active alerts: ${alertNames}`;
      } else {
        alertMessage = "\u{1F7E2} Your node is synced and have no active alerts.";
      }
    } else {
      alertMessage = "\u{1F7E2} Your node is synced and have no active alerts.";
    }
    const details = `**Build Version:** ${labels.semantic_version ?? "N/A"}\n` +
        `**Go Version:** ${labels.golang_version ?? "N/A"}\n` +
        `**Last Commit:** ${labels.last_commit ?? "N/A"}\n` +
        `**Build Time:** ${labels.build_time ?? "N/A"}\n` +
        `**System Version:** ${labels.system_version ?? "N/A"}`;
    const embed = new EmbedBuilder()
        .setTitle("Subscribed Node Information")
        .setColor(0x7b2bf9)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/da_layer_metrics.png")
        .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date())
        .addFields([
          { name: "Node Id", value: `**\`${labels.exported_instance ?? "Unknown"}\`**`, inline: false},
          { name: "Node Type", value: `**\`${nodeType ?? "Unknown"}\`**`, inline: false },
          { name: "Alerts", value: `**\`${alertMessage}\`**`, inline: false },
          { name: "", value: "", inline: false },
          { name: "Node Details", value: details, inline: false }
        ]);
    return json({ type: 4, data: { embeds: [embed], flags: 64 } });
  },
};

export { command, autocomplete, info as infoCommand };