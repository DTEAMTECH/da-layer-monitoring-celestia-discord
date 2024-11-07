import { Routes } from "discord.js";
import { disApi } from "app/utils.ts";
import { commands } from "app/cmds/mod.ts";

// todo: add token protection
export async function cmdsRegisterHandler(_request: Request) {
  console.log("Started refreshing application (/) commands.");
  const commandToRegister = Object.entries(commands).map(([_, command]) => ({
    ...command.command.toJSON(),
  }));

  const rest = disApi.rest;
  const config = disApi.config;
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commandToRegister },
  );

  return new Response("Redeployed!");
}
