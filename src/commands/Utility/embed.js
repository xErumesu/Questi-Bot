import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create an embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Embed description')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Embed title')
        .setRequired(false)
    ),

  category: 'Utility',

  async execute(interaction, config, client) {
    try {
      const deferred = await InteractionHelper.safeDefer(interaction);
      if (!deferred) return;

      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');

      const embed = new EmbedBuilder().setDescription(description);
      if (title) embed.setTitle(title);

      const cancelButton = new ButtonBuilder()
        .setCustomId(`embed_cancel_${interaction.id}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

      const sendButton = new ButtonBuilder()
        .setCustomId(`embed_send_${interaction.id}`)
        .setLabel('Send Embed')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(sendButton, cancelButton);

      const builderMessage = await InteractionHelper.safeEditReply(interaction, {
        content: 'Preview your embed. Click **Send Embed** to post it, or **Cancel** to stop.',
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      const collector = builderMessage.createMessageComponentCollector({
        time: 60_000
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({
            content: "This isn't your embed builder.",
            ephemeral: true
          });
        }

        if (i.customId === `embed_cancel_${interaction.id}`) {
          collector.stop('cancelled');

          return await i.update({
            content: '❌ Embed builder cancelled.',
            embeds: [],
            components: []
          });
        }

        if (i.customId === `embed_send_${interaction.id}`) {
          collector.stop('sent');

          await interaction.channel.send({
            embeds: [embed]
          });

          return await i.update({
            content: '✅ Embed sent!',
            embeds: [],
            components: []
          });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'cancelled' || reason === 'sent') return;

        await InteractionHelper.safeEditReply(interaction, {
          content: '⌛ Embed builder timed out.',
          embeds: [],
          components: []
        }).catch(() => {});
      });

    } catch (error) {
      console.error('Embed command error:', error);

      await handleInteractionError(interaction, error, {
        commandName: 'embed',
        source: 'embed_command'
      });
    }
  }
};