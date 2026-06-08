import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create an embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Embed title')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Embed description')
        .setRequired(true)
    ),

  category: 'Utility',

  async execute(interaction, config, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');

      const embed = new EmbedBuilder()
        .setDescription(description);

      if (title) embed.setTitle(title);

      await interaction.channel.send({ embeds: [embed] });

      return await interaction.editReply({
        content: '✅ Embed sent!'
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: 'embed',
        source: 'embed_command'
      });
    }
  }
};