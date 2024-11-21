import { REST, Routes, EmbedBuilder } from "discord.js";
import { TIME_RECENT_ALERT_IN_MINUTES } from "app/constant.ts";
import config from "app/config.ts";

export class DiscordApiHelper {
  public rest: REST;
  public config: {
    token: string;
    clientId: string;
    guildId: string;
  };

  constructor(config: { token: string; clientId: string; guildId: string }) {
    this.rest = new REST({ version: "10" }).setToken(config.token);
    this.config = config;
  }

  async sendMessage(channelId: string, message: string) {
    try {
      await this.rest.post(Routes.channelMessages(channelId), {
        body: { content: message },
      });
      console.log("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async sendEmbedMessage(channelId: string, embed: EmbedBuilder) {
    try {
      await this.rest.post(Routes.channelMessages(channelId), {
        body: { embeds: [embed] },
      });
      console.log("Embed message sent successfully!");
    } catch (error) {
      console.error("Error sending embed message:", error);
    }
  }

  sendMessageBotChannel(message: string) {
    return this.sendMessage(config.BOT_CHANNEL_ID, message);
  }

  sendEmbedMessageBotChannel(embed: EmbedBuilder) {
    return this.sendEmbedMessage(config.BOT_CHANNEL_ID, embed);
  }
}

export const disApi = new DiscordApiHelper({
  token: config.BOT_TOKEN,
  clientId: config.CLIENT_ID,
  guildId: config.GUILD_ID,
});

export const isObject = (value: unknown) => typeof value === "object" && value !== null;

export function isRecent(referenceTimeIso: string | null, thresholdMinutes: number = TIME_RECENT_ALERT_IN_MINUTES): boolean {
  if (!referenceTimeIso) return false;

  const referenceTime = new Date(referenceTimeIso);
  const targetTime = new Date();
  const diffMilliseconds = targetTime.getTime() - referenceTime.getTime();
  const diffMinutes = Math.floor(diffMilliseconds / 60000);

  return diffMinutes < thresholdMinutes;
}