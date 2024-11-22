import { EmbedBuilder, REST, Routes } from "discord.js";
import { TIME_RECENT_ALERT_IN_MINUTES } from "app/constant.ts";
import pRetry from "p-retry";
import config from "app/config.ts";

type RetryOptions = {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
};


function withRetry<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options?: RetryOptions
): (...args: Args) => Promise<Result> {
  return async function (...args: Args): Promise<Result> {
    return await pRetry(
      async () => {
        try {
          return await fn(...args); // Call the original function
        } catch (error) {
          console.warn(`Retry failed: ${(error as Error).message}`);
          throw error; // Retry on error
        }
      },
      {
        retries: options?.retries ?? 5,
        factor: options?.factor ?? 2,
        minTimeout: options?.minTimeout ?? 1000,
        maxTimeout: options?.maxTimeout ?? 5000,
        randomize: options?.randomize ?? true,
      }
    );
  };
}


// todo: move to services 
export class DiscordApiHelper {
  public rest: REST;
  public config: {
    token: string;
    clientId: string;
    guildId: string;
  };
  sendMessage: (channelId: string, option: { message?: string; embed?: EmbedBuilder; }) => Promise<void>;

  constructor(config: { token: string; clientId: string; guildId: string }) {
    this.rest = new REST({ version: "10" }).setToken(config.token);
    this.config = config;
    this.sendMessage = withRetry(this.sendMessageRaw.bind(this));
  }
  

  async sendMessageRaw(
    channelId: string,
    { message, embed }: { message?: string; embed?: EmbedBuilder },
  ) {
    if (!message && !embed) {
      throw new Error("Either message or embed must be provided.");
    }

    const mainMessage = message ? { content: message } : { embeds: [embed] };
    await this.rest.post(Routes.channelMessages(channelId), {
      body: mainMessage,
    });
  }

  async sendEmbedMessage(channelId: string, embed: EmbedBuilder) {
    try {
      await this.sendMessage(channelId, { embed });
    } catch (error) {
      console.error("Error sending embed message:", error);
    }
  }

  sendMessageBotChannel(message: string) {
    return this.sendMessage(config.BOT_CHANNEL_ID, { message });
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

export const isObject = (value: unknown) =>
  typeof value === "object" && value !== null;

export function isRecent(
  referenceTimeIso: string | null,
  thresholdMinutes: number = TIME_RECENT_ALERT_IN_MINUTES,
): boolean {
  if (!referenceTimeIso) return false;

  const referenceTime = new Date(referenceTimeIso);
  const targetTime = new Date();
  const diffMilliseconds = targetTime.getTime() - referenceTime.getTime();
  const diffMinutes = Math.floor(diffMilliseconds / 60000);

  return diffMinutes < thresholdMinutes;
}
