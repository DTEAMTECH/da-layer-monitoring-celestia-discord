import { SlashCommandBuilder, SlashCommandStringOption, EmbedBuilder } from "discord.js";
import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";

import type { Command } from "app/cmds/mod.ts";
import { json } from "sift/mod.ts";
import {
  APIApplicationCommandAutocompleteInteraction,
  ApplicationCommandOptionType
} from "discord.js";


const command = new SlashCommandBuilder()
    .setName("unsubscribe")
    .setDescription("Subscribe for the updates about your bridge node")
    .addStringOption((option: SlashCommandStringOption) =>
        option.setName("id")
            .setDescription("Bridge node id")
            .setRequired(true)
            .setAutocomplete(true)
    );

const autocomplete = async (interaction: APIApplicationCommandAutocompleteInteraction) => {


  const nodesIds = await bridgeNodesAPI.getAllBridgeNodesIds();
  const choices = nodesIds.map((nodeId) => ({
    name: nodeId,
    value: nodeId,
  }));

  const findData = interaction.data.options.find((opt) => opt.name === "id");
  

  if(findData && findData?.type === ApplicationCommandOptionType.String && findData.value.length) {
    const filtredChoices = choices.filter((choice) => choice.name.includes(findData.value));
    return json({
      type: 8,
      data: {
        choices: filtredChoices.slice(0, 5),
      },
    });
  }
    
  return json({
    type: 8,
    data: {
      choices: choices.slice(0, 5)
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
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
      return json({
        type: 4,
        data: {
          embeds: [embed],
        },
      });
    }
    const userId = interaction.member.user.id;
    const username = interaction.member.user.username;
    const globalName = interaction.data.name;
    const subscribedAt = new Date().toISOString();
    const param = data.options?.find((opt) => opt.name === "id");
    if (!param) {
      const embed = new EmbedBuilder()
          .setTitle("Missing parameters")
          .setDescription("You must provide parameters")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())
      return json({
        type: 4,
        data: {
          embeds: [embed],
        },
      });
    }
    if (param.type !== 3) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid parameters")
          .setDescription("Invalid type of parameters")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())
      return json({
        type: 4,
        data: {
          embeds: [embed],
        },
      });
    }

    kv.set(["user", userId], { username, id: userId, globalName });

    // Check if bridge node ID exists
    const nodesIds = await bridgeNodesAPI.getAllBridgeNodesIds();
    if (!nodesIds.includes(param.value)) {
      const embed = new EmbedBuilder()
          .setTitle("Invalid node bridge id")
          .setDescription("Please check that your bridge id is correct and try again")
          .setColor(0xaf3838)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())

      return json({
        type: 4,
        data: {
          embeds: [embed],
        },
      });
    }

    kv.set(["subscription", userId, param.value], {
      userId,
      nodeBridgeId: param.value,
      subscribedAt,
    });

    const embed = new EmbedBuilder()
        .setTitle("Subscription success")
        .setDescription(`You have been subscribed to **\`${param.value}\`**`)
        .setColor(0x7b2bf9)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
        .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date())

    return json({
      type: 4,
      data: {
        embeds: [embed],
      },
    });
  },
};