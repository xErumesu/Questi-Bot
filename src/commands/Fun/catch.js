import { SlashCommandBuilder } from 'discord.js';
import {
  activeQuestionableSpawns,
  addToInventory
} from '../../utils/questionableSpawns.js';

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
    const guess = interaction.options.getString('name').toLowerCase();
    const spawn = activeQuestionableSpawns.get(interaction.guildId);

    if (!spawn) {
      return interaction.reply('There is nothing to catch right now.');
    }

    if (spawn.channelId !== interaction.channel.id) {
      return interaction.reply('The Questionable is not in this channel.');
    }

    if (guess !== spawn.answer) {
      return interaction.reply('Wrong name.');
    }

    activeQuestionableSpawns.delete(interaction.guildId);

    addToInventory(interaction.guildId, interaction.user.id, spawn);

    return interaction.reply(
      `🎉 ${interaction.user} caught **${spawn.name}**!\nRarity: **${spawn.rarity}**`
    );
  }
};
