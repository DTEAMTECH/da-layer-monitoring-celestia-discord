import { REST, Routes } from "discord.js";
import config from "app/config.ts";
export class DiscodApiHelper {
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
      // Make the API call to send the message
      await this.rest.post(Routes.channelMessages(channelId), {
        body: { content: message },
      });
      console.log("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
  sendMessageBotChannel(message: string) {
    return this.sendMessage(config.BOT_CHANNEL_ID, message);
  }
}

export const disApi = new DiscodApiHelper({
  token: config.BOT_TOKEN,
  clientId: config.CLIENT_ID,
  guildId: config.GUILD_ID,
});
