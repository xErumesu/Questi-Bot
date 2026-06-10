import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

import { questionables, getQuestionableById, getRandomQuestionable } from '../../data/questionables.js';
import { activeQuestionableSpawns } from '../../utils/questionableState.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spawnquestionable')
    .setDescription('Force spawn a Questionable.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Which Questionable to spawn')
        .setRequired(true)
        .addChoices(
          { name: 'Random', value: 'random' },
          ...questionables.map(q => ({
            name: `${q.name} (${q.rarity})`,
            value: q.id
          }))
        )
    ),

  category: 'Utility',

  async execute(interaction) {
    const type = interaction.options.getString('type');

    const questionable =
      type === 'random'
        ? getRandomQuestionable()
        : getQuestionableById(type);

    if (!questionable) {
      return interaction.reply({
        content: 'That Questionable does not exist.',
        ephemeral: true
      });
    }

    activeQuestionableSpawns.set(interaction.guildId, {
      ...questionable,
      channelId: interaction.channel.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🌟 A wild Questionable appeared!')
      .setDescription(
        `A wild **${questionable.name}** appeared!\nRarity: **${questionable.rarity}**\n\nUse \`/catch questionable\` to catch it!`
      );

    if (questionable.image) {
      embed.setImage(questionable.image);
    }

    await interaction.channel.send({ embeds: [embed] });

    return interaction.reply({
      content: `✅ Spawned **${questionable.name}**.`,
      ephemeral: true
    });
  }
};
