import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

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

      let title = interaction.options.getString('title') || '';
      let description = interaction.options.getString('description') || '';

      let color = null;
      let thumbnail = '';
      let image = '';
      let footer = '';
      let author = '';

      const embed = new EmbedBuilder().setDescription(description);
      if (title) embed.setTitle(title);

      const buildEmbed = () => {
        const e = new EmbedBuilder();

        if (title) e.setTitle(title);
        if (description) e.setDescription(description);
        if (color) e.setColor(color);
        if (thumbnail) e.setThumbnail(thumbnail);
        if (image) e.setImage(image);
        if (footer) e.setFooter({ text: footer });
        if (author) e.setAuthor({ name: author });

        return e;
      };

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`embed_menu_${interaction.id}`)
        .setPlaceholder('What would you like to change?')
        .addOptions(
          {
            label: 'Set Content',
            description: 'Edit the title and description',
            value: 'content',
            emoji: '📝'
          },
          {
            label: 'Set Color',
            description: 'Set the embed color',
            value: 'color',
            emoji: '🎨'
          },
          {
            label: 'Set Images',
            description: 'Set thumbnail and large image URLs',
            value: 'images',
            emoji: '🖼️'
          },
          {
            label: 'Set Footer',
            description: 'Set footer text',
            value: 'footer',
            emoji: '📌'
          },
          {
            label: 'Set Author',
            description: 'Set author text',
            value: 'author',
            emoji: '👤'
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

      const menuRow = new ActionRowBuilder().addComponents(menu);
      const buttonRow = new ActionRowBuilder().addComponents(sendButton, cancelButton);

      const refreshBuilder = async (i, content = 'The preview above updates live. Closes after 5 min of inactivity.') => {
        return await i.update({
          content,
          embeds: [buildEmbed()],
          components: [menuRow, buttonRow]
        });
      };

      await InteractionHelper.safeEditReply(interaction, {
        content: 'The preview above updates live. Closes after 5 min of inactivity.',
        embeds: [buildEmbed()],
        components: [menuRow, buttonRow]
      });

      const builderMessage = await interaction.fetchReply();

      const collector = builderMessage.createMessageComponentCollector({
        time: 300_000
      });

      collector.on('collect', async i => {
        try {
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
              embeds: [buildEmbed()]
            });

            return await i.update({
              content: '✅ Embed sent!',
              embeds: [],
              components: []
            });
          }

          if (i.customId === `embed_menu_${interaction.id}`) {
            const choice = i.values[0];

            if (choice === 'content') {
              const modal = new ModalBuilder()
                .setCustomId(`embed_modal_content_${interaction.id}`)
                .setTitle('Set Embed Content');

              const titleInput = new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Title')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(title.slice(0, 256));

              const descInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(description.slice(0, 4000));

              modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput)
              );

              return await i.showModal(modal);
            }

            if (choice === 'color') {
              const modal = new ModalBuilder()
                .setCustomId(`embed_modal_color_${interaction.id}`)
                .setTitle('Set Embed Color');

              const colorInput = new TextInputBuilder()
                .setCustomId('color')
                .setLabel('Hex Color, example: #ff0000')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(color || '');

              modal.addComponents(new ActionRowBuilder().addComponents(colorInput));

              return await i.showModal(modal);
            }

            if (choice === 'images') {
              const modal = new ModalBuilder()
                .setCustomId(`embed_modal_images_${interaction.id}`)
                .setTitle('Set Images');

              const thumbInput = new TextInputBuilder()
                .setCustomId('thumbnail')
                .setLabel('Thumbnail URL')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(thumbnail.slice(0, 1000));

              const imageInput = new TextInputBuilder()
                .setCustomId('image')
                .setLabel('Large Image URL')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(image.slice(0, 1000));

              modal.addComponents(
                new ActionRowBuilder().addComponents(thumbInput),
                new ActionRowBuilder().addComponents(imageInput)
              );

              return await i.showModal(modal);
            }

            if (choice === 'footer') {
              const modal = new ModalBuilder()
                .setCustomId(`embed_modal_footer_${interaction.id}`)
                .setTitle('Set Footer');

              const footerInput = new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Footer text')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(footer.slice(0, 2048));

              modal.addComponents(new ActionRowBuilder().addComponents(footerInput));

              return await i.showModal(modal);
            }

            if (choice === 'author') {
              const modal = new ModalBuilder()
                .setCustomId(`embed_modal_author_${interaction.id}`)
                .setTitle('Set Author');

              const authorInput = new TextInputBuilder()
                .setCustomId('author')
                .setLabel('Author text')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(author.slice(0, 256));

              modal.addComponents(new ActionRowBuilder().addComponents(authorInput));

              return await i.showModal(modal);
            }
          }
        } catch (error) {
          console.error('Embed builder collect error:', error);

          if (!i.replied && !i.deferred) {
            await i.reply({
              content: '❌ Something went wrong with that builder action.',
              ephemeral: true
            }).catch(() => {});
          }
        }
      });

      client.on('interactionCreate', async modalInteraction => {
        try {
          if (!modalInteraction.isModalSubmit()) return;
          if (modalInteraction.user.id !== interaction.user.id) return;
          if (!modalInteraction.customId.endsWith(interaction.id)) return;

          if (modalInteraction.customId === `embed_modal_content_${interaction.id}`) {
            title = modalInteraction.fields.getTextInputValue('title') || '';
            description = modalInteraction.fields.getTextInputValue('description') || '';
          }

          if (modalInteraction.customId === `embed_modal_color_${interaction.id}`) {
            const newColor = modalInteraction.fields.getTextInputValue('color') || '';

            if (newColor && !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
              return await modalInteraction.reply({
                content: '❌ Color must be a hex code like `#ff0000`.',
                ephemeral: true
              });
            }

            color = newColor || null;
          }

          if (modalInteraction.customId === `embed_modal_images_${interaction.id}`) {
            const newThumbnail = modalInteraction.fields.getTextInputValue('thumbnail') || '';
            const newImage = modalInteraction.fields.getTextInputValue('image') || '';

            if (newThumbnail && !isValidUrl(newThumbnail)) {
              return await modalInteraction.reply({
                content: '❌ Thumbnail must be a valid URL.',
                ephemeral: true
              });
            }

            if (newImage && !isValidUrl(newImage)) {
              return await modalInteraction.reply({
                content: '❌ Image must be a valid URL.',
                ephemeral: true
              });
            }

            thumbnail = newThumbnail;
            image = newImage;
          }

          if (modalInteraction.customId === `embed_modal_footer_${interaction.id}`) {
            footer = modalInteraction.fields.getTextInputValue('footer') || '';
          }

          if (modalInteraction.customId === `embed_modal_author_${interaction.id}`) {
            author = modalInteraction.fields.getTextInputValue('author') || '';
          }

          await modalInteraction.update({
            content: '✅ Updated preview.',
            embeds: [buildEmbed()],
            components: [menuRow, buttonRow]
          });
        } catch (error) {
          console.error('Embed builder modal error:', error);

          if (!modalInteraction.replied && !modalInteraction.deferred) {
            await modalInteraction.reply({
              content: '❌ Something went wrong saving that edit.',
              ephemeral: true
            }).catch(() => {});
          }
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
