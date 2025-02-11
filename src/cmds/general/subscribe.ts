import {
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
  ApplicationCommandOptionType,
} from "discord.js";
import { kv } from "app/services/storage.ts";
import { nodesAPI } from "app/services/api.ts";
import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";
import type {
  APIApplicationCommandAutocompleteInteraction,
} from "discord.js";

const command = new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("Subscribe for the updates about your node")
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName("id")
            .setDescription("Node id (e.g. 12D3Koo... (Bridge))")
            .setRequired(true)
            .setAutocomplete(true)
    );

const autocomplete = async (
    interaction: APIApplicationCommandAutocompleteInteraction,
) => {
  const nodesIds = await nodesAPI.getAllNodesIds();
  const choicesPromises = nodesIds.map(async (nodeId) => {
    const nodeType = await nodesAPI.getNodeType(nodeId);
    return {
      name: `${nodeId} (${nodeType ?? "Unknown"})`,
      value: nodeId,
    };
  });
  const choices = await Promise.all(choicesPromises);
  const findData = interaction.data.options.find((opt) => opt.name === "id");
  if (
      findData &&
      findData.type === ApplicationCommandOptionType.String &&
      findData.value.length
  ) {
    const filteredChoices = choices.filter((choice) =>
        choice.name.includes(findData.value)
    );
    return json({
      type: 8,
      data: {
        choices: filteredChoices.slice(0, 5),
      },
    });
  }
  return json({
    type: 8,
    data: {
      choices: choices.slice(0, 5),
    },
  });
};

export const subscribe: Command = {
  command,
  autocomplete,
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
    const username = interaction.member.user.username;
    const globalName = interaction.data.name;
    const subscribedAt = new Date().toISOString();
    const param = data.options?.find((opt) => opt.name === "id");
    if (!param) {
      const embed = new EmbedBuilder()
          .setTitle("Missing Parameters")
          .setDescription("You must provide parameters")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed] } });
    }
    if (param.type !== 3) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid Parameters")
          .setDescription("Invalid type of parameters")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed] } });
    }
    kv.set(["user", userId], { username, id: userId, globalName });
    const nodesIds = await nodesAPI.getAllNodesIds();
    if (!nodesIds.includes(param.value)) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid Node Id")
          .setDescription("Please check that your node id is correct and try again")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date());
      return json({ type: 4, data: { embeds: [embed] } });
    }
    const nodeType = await nodesAPI.getNodeType(param.value);
    kv.set(["subscription", userId, param.value], {
      userId,
      nodeId: param.value,
      subscribedAt,
    });
    const embed = new EmbedBuilder()
        .setTitle("Subscription Success")
        .setDescription(`You have been subscribed to **\`${nodeType ?? "Unknown"}\`** node **\`${param.value}\`**`)
        .setColor(0x7b2bf9)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
        .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date());
    return json({ type: 4, data: { embeds: [embed] } });
  },
};