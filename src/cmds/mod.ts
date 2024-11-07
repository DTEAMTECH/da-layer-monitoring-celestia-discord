import { unsubscribe } from "./general/unsubscribe.ts";
import { info } from "./general/info.ts";
import { subscribe } from "./general/subscribe.ts";
import {
  APIChatInputApplicationCommandInteractionData,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
} from "discord.js";
export interface Command {
  command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (
    data: APIChatInputApplicationCommandInteractionData,
    interaction: APIApplicationCommandInteraction,
  ) => Promise<Response>;
  autocomplete?: (
    data: APIApplicationCommandAutocompleteInteraction,
  ) => Promise<Response>;
}

export const commands: Record<string, Command> = {
  subscribe,
  info,
  unsubscribe,
};
