import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embededit')
    .setDescription('Edit an embed sent by the bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('messageid')
        .setDescription('Message ID of the embed')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('New title')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('New description')
        .setRequired(false)
    ),

  category: 'Utility',

  async execute(interaction, config, client) {
    try {
      await InteractionHelper.safeDefer(interaction);

      const messageId = interaction.options.getString('messageid');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');

      const message = await interaction.channel.messages.fetch(messageId);

      if (!message.editable) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: "I can't edit that message."
        });
      }

      const embed = new EmbedBuilder();

      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);

      await message.edit({
        embeds: [embed]
      });

      return await InteractionHelper.safeEditReply(interaction, {
        content: 'Embed edited!'
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: 'embededit',
        source: 'embededit_command'
      });
    }
  }
};
