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
    .setDescription('Edit an existing bot embed.')
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
        .setDescription('New embed title')
        .setRequired(false)
    )

    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('New embed description')
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

      if (!message) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: 'Message not found.'
        });
      }

      if (message.author.id !== client.user.id) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: "I can only edit messages sent by me."
        });
      }

      if (!message.embeds.length) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: 'That message has no embed.'
        });
      }

      const embed = EmbedBuilder.from(message.embeds[0].data);

      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);

      await message.edit({
        embeds: [embed]
      });

      return await InteractionHelper.safeEditReply(interaction, {
        content: '✅ Embed edited successfully.'
      });

    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: 'embededit',
        source: 'embededit_command'
      });
    }
  }
};
