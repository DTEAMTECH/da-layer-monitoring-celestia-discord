import "jsr:@std/dotenv/load";

export default {
  BOT_TOKEN: Deno.env.get("BOT_TOKEN") as string,
  CLIENT_ID: Deno.env.get("CLIENT_ID") as string,
  GUILD_ID: Deno.env.get("GUILD_ID") as string,
  DISCORD_PUBLIC_KEY: Deno.env.get("DISCORD_PUBLIC_KEY") as string,
  PROMETHEUS_URL: Deno.env.get("PROMETHEUS_URL") as string,
  BOT_CHANNEL_ID: Deno.env.get("BOT_CHANNEL_ID") as string,
  // don't need for Deno deploy
  KV_PATH: Deno.env.get("KV_PATH") as string,
};
