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
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel containing the embed')
        .setRequired(true)
    )
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

      const channel = interaction.options.getChannel('channel');
      const messageId = interaction.options.getString('messageid');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');

      if (!title && !description) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: 'Give me a title or description to change.'
        });
      }

      const message = await channel.messages.fetch(messageId).catch(() => null);

      if (!message) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: 'Message not found. Check the channel and message ID.'
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

      const embed = new EmbedBuilder(message.embeds[0].toJSON());

      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);

      await message.edit({ embeds: [embed] });

      return await InteractionHelper.safeEditReply(interaction, {
        content: `✅ Embed edited in ${channel}.`
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: 'embededit',
        source: 'embededit_command'
      });
    }
  }
};
