import { SlashCommandBuilder } from 'discord.js';

import {
  activeQuestionableSpawns,
  addToInventory
} from '../../utils/questionableState.js';

export default {
  data: new SlashCommandBuilder()
    .setName('catch')
    .setDescription('Catch a spawned Questionable.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('What are you catching?')
        .setRequired(true)
    ),

  category: 'Fun',

  async execute(interaction) {
    const guess = interaction.options.getString('name').toLowerCase().trim();
    const spawn = activeQuestionableSpawns.get(interaction.guildId);

    if (!spawn) {
      return interaction.reply('There is nothing to catch right now.');
    }

    if (spawn.channelId !== interaction.channel.id) {
      return interaction.reply('The Questionable is not in this channel.');
    }

    const answer = (spawn.catchAnswer || 'questionable').toLowerCase();

    if (guess !== answer) {
      return interaction.reply('Wrong name.');
    }

    if (spawn.timeout) clearTimeout(spawn.timeout);

    activeQuestionableSpawns.delete(interaction.guildId);
    addToInventory(interaction.user.id, spawn);

    const defaultCatchText =
      `🎉 ${interaction.user} caught **${spawn.name}**!\nRarity: **${spawn.rarity || 'Unknown'}**`;

    const catchText = spawn.catchText
      ? spawn.catchText.replace('{user}', `${interaction.user}`)
      : defaultCatchText;

    return interaction.reply(catchText);
  }
};
