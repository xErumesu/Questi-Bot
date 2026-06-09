import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder
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

      const categoryMenu = new StringSelectMenuBuilder()
        .setCustomId(`embed_category_${interaction.id}`)
        .setPlaceholder('Choose an embed category')
        .addOptions(
          {
            label: 'Announcement',
            value: 'announcement',
            emoji: '📢'
          },
          {
            label: 'Rules',
            value: 'rules',
            emoji: '📜'
          },
          {
            label: 'Info',
            value: 'info',
            emoji: 'ℹ️'
          },
          {
            label: 'Event',
            value: 'event',
            emoji: '🎉'
          }
        );

      const sendButton = new ButtonBuilder()
        .setCustomId(`embed_send_${interaction.id}`)
        .setLabel('Send Embed')
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId(`embed_cancel_${interaction.id}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

      const menuRow = new ActionRowBuilder().addComponents(categoryMenu);
      const buttonRow = new ActionRowBuilder().addComponents(sendButton, cancelButton);

      await InteractionHelper.safeEditReply(interaction, {
        content: 'Preview your embed. Pick a category, then send or cancel.',
        embeds: [embed],
        components: [menuRow, buttonRow]
      });

      const builderMessage = await interaction.fetchReply();

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

        if (i.customId === `embed_category_${interaction.id}`) {
          const category = i.values[0];

          if (category === 'announcement') embed.setTitle(title || '📢 Announcement');
          if (category === 'rules') embed.setTitle(title || '📜 Rules');
          if (category === 'info') embed.setTitle(title || 'ℹ️ Information');
          if (category === 'event') embed.setTitle(title || '🎉 Event');

          return await i.update({
            content: `Category selected: **${category}**`,
            embeds: [embed],
            components: [menuRow, buttonRow]
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