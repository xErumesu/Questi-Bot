import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getColor } from '../../config/bot.js';

const MAX_FIELDS = 25;
const IDLE_TIMEOUT = 300_000;

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidHex(str) {
  return /^#[0-9A-Fa-f]{6}$/.test(str);
}

function buildEmbed(state) {
  const embed = new EmbedBuilder();

  if (state.title) embed.setTitle(state.title);
  if (state.description) embed.setDescription(state.description);
  if (state.color) embed.setColor(state.color);
  if (state.author) embed.setAuthor({ name: state.author });
  if (state.footer) embed.setFooter({ text: state.footer });
  if (state.thumbnail) embed.setThumbnail(state.thumbnail);
  if (state.image) embed.setImage(state.image);
  if (state.timestamp) embed.setTimestamp();
  if (state.fields.length) embed.addFields(state.fields);

  if (!state.title && !state.description && !state.fields.length && !state.image && !state.thumbnail) {
    embed.setDescription('*(Empty — use the menu below to add content)*');
  }

  return embed;
}

function buildPanel(state) {
  return new EmbedBuilder()
    .setTitle('🛠️ Embed Builder — Control Panel')
    .setColor(getColor('info'))
    .setDescription([
      `**Target Channel** › ${state.targetChannel ? `${state.targetChannel}` : '`Not set`'}`,
      `**Title** › ${state.title ? `\`${state.title.slice(0, 40)}\`` : '`Not set`'}`,
      `**Description** › ${state.description ? `${state.description.length} character(s)` : '`Not set`'}`,
      `**Color** › ${state.color ? `\`${state.color}\`` : '`Default`'}`,
      `**Author** › ${state.author ? `\`${state.author}\`` : '`Not set`'}`,
      `**Footer** › ${state.footer ? `\`${state.footer}\`` : '`Not set`'}`,
      `**Thumbnail** › ${state.thumbnail ? '✅ Set' : '`Not set`'}`,
      `**Image** › ${state.image ? '✅ Set' : '`Not set`'}`,
      `**Timestamp** › ${state.timestamp ? '✅ Enabled' : '`Disabled`'}`,
      `**Fields** › ${state.fields.length} / ${MAX_FIELDS}`,
      '',
      'The preview above updates live · Closes after 5 min of inactivity',
    ].join('\n'));
}

function buildMenu(state) {
  return new StringSelectMenuBuilder()
    .setCustomId('eb_menu')
    .setPlaceholder('What would you like to change?')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Edit Content').setValue('content').setEmoji('✏️'),
      new StringSelectMenuOptionBuilder().setLabel('Set Color').setValue('color').setEmoji('🎨'),
      new StringSelectMenuOptionBuilder().setLabel('Set Images').setValue('images').setEmoji('🖼️'),
      new StringSelectMenuOptionBuilder().setLabel('Set Author').setValue('author').setEmoji('👤'),
      new StringSelectMenuOptionBuilder().setLabel('Set Footer').setValue('footer').setEmoji('📄'),
      new StringSelectMenuOptionBuilder().setLabel(`Add Field (${state.fields.length}/25)`).setValue('field').setEmoji('➕'),
      new StringSelectMenuOptionBuilder().setLabel(state.timestamp ? 'Disable Timestamp' : 'Enable Timestamp').setValue('timestamp').setEmoji('🕐'),
      new StringSelectMenuOptionBuilder().setLabel('Reset Embed').setValue('reset').setEmoji('🗑️'),
    );
}

function buildChannelSelect() {
  return new ChannelSelectMenuBuilder()
    .setCustomId('eb_target_channel')
    .setPlaceholder('Choose target channel to send embed');
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eb_send').setLabel('Send Embed').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('eb_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('embedbuilder')
    .setDescription('Build and post a custom embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  category: 'Utility',

  async execute(interaction) {
    const deferred = await InteractionHelper.safeDefer(interaction, {
      flags: MessageFlags.Ephemeral,
    });
    if (!deferred) return;

    const state = {
      targetChannel: interaction.channel,
      title: null,
      description: null,
      color: getColor('primary'),
      author: null,
      footer: null,
      thumbnail: null,
      image: null,
      timestamp: false,
      fields: [],
    };

    const refresh = async () => {
      await InteractionHelper.safeEditReply(interaction, {
        embeds: [buildEmbed(state), buildPanel(state)],
        components: [
          new ActionRowBuilder().addComponents(buildMenu(state)),
          new ActionRowBuilder().addComponents(buildChannelSelect()),
          buildButtons(),
        ],
      });
    };

    await refresh();

    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: IDLE_TIMEOUT,
    });

    collector.on('collect', async i => {
      try {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: "This isn't your embed builder.",
            ephemeral: true,
          });
        }

        if (i.isButton()) {
          if (i.customId === 'eb_cancel') {
            collector.stop('cancelled');

            return i.update({
              content: '❌ Embed builder cancelled.',
              embeds: [],
              components: [],
            });
          }

          if (i.customId === 'eb_send') {
            const hasContent =
              state.title ||
              state.description ||
              state.author ||
              state.footer ||
              state.image ||
              state.thumbnail ||
              state.fields.length;

            if (!hasContent) {
              return i.reply({
                embeds: [errorEmbed('Empty Embed', 'Add content before sending.')],
                ephemeral: true,
              });
            }

            const perms = state.targetChannel.permissionsFor(interaction.guild.members.me);

            if (!perms?.has(PermissionFlagsBits.SendMessages) || !perms?.has(PermissionFlagsBits.EmbedLinks)) {
              return i.reply({
                embeds: [
                  errorEmbed(
                    'Missing Permissions',
                    `I need **Send Messages** and **Embed Links** in ${state.targetChannel}.`,
                  ),
                ],
                ephemeral: true,
              });
            }

            collector.stop('sent');

            await state.targetChannel.send({
              embeds: [buildEmbed(state)],
            });

            return i.update({
              content: `✅ Embed sent to ${state.targetChannel}!`,
              embeds: [],
              components: [],
            });
          }
        }

        if (i.isChannelSelectMenu() && i.customId === 'eb_target_channel') {
          const channel = i.channels.first();

          if (!channel) {
            return i.reply({
              content: '❌ Could not find that channel.',
              ephemeral: true,
            });
          }

          state.targetChannel = channel;

          await i.deferUpdate();
          return refresh();
        }

        if (!i.isStringSelectMenu()) {
          return i.deferUpdate();
        }

        const choice = i.values[0];

        if (choice === 'content') {
          const modal = new ModalBuilder()
            .setCustomId('eb_content')
            .setTitle('Edit Content')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('title')
                  .setLabel('Title')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setMaxLength(256)
                  .setValue(state.title || ''),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('description')
                  .setLabel('Description')
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(false)
                  .setMaxLength(4000)
                  .setValue(state.description || ''),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            filter: m => m.customId === 'eb_content' && m.user.id === i.user.id,
            time: 120_000,
          }).catch(() => null);

          if (!submit) return;

          state.title = submit.fields.getTextInputValue('title').trim() || null;
          state.description = submit.fields.getTextInputValue('description').trim() || null;

          await submit.deferUpdate();
          return refresh();
        }

        if (choice === 'color') {
          const modal = new ModalBuilder()
            .setCustomId('eb_color')
            .setTitle('Set Color')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('color')
                  .setLabel('Hex color, example #5865F2')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMaxLength(7)
                  .setValue(state.color || '#5865F2'),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            filter: m => m.customId === 'eb_color' && m.user.id === i.user.id,
            time: 120_000,
          }).catch(() => null);

          if (!submit) return;

          const color = submit.fields.getTextInputValue('color').trim();

          if (!isValidHex(color)) {
            return submit.reply({
              embeds: [errorEmbed('Invalid Color', 'Use a hex color like `#5865F2`.')],
              ephemeral: true,
            });
          }

          state.color = color;
          await submit.deferUpdate();
          return refresh();
        }

        if (choice === 'images') {
          const modal = new ModalBuilder()
            .setCustomId('eb_images')
            .setTitle('Set Images')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('thumbnail')
                  .setLabel('Thumbnail URL')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(state.thumbnail || ''),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('image')
                  .setLabel('Large Image URL')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(state.image || ''),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            filter: m => m.customId === 'eb_images' && m.user.id === i.user.id,
            time: 120_000,
          }).catch(() => null);

          if (!submit) return;

          const thumbnail = submit.fields.getTextInputValue('thumbnail').trim();
          const image = submit.fields.getTextInputValue('image').trim();

          if (thumbnail && !isValidUrl(thumbnail)) {
            return submit.reply({
              embeds: [errorEmbed('Invalid URL', 'Thumbnail must be a valid URL.')],
              ephemeral: true,
            });
          }

          if (image && !isValidUrl(image)) {
            return submit.reply({
              embeds: [errorEmbed('Invalid URL', 'Image must be a valid URL.')],
              ephemeral: true,
            });
          }

          state.thumbnail = thumbnail || null;
          state.image = image || null;

          await submit.deferUpdate();
          return refresh();
        }

        if (choice === 'author') {
          const modal = new ModalBuilder()
            .setCustomId('eb_author')
            .setTitle('Set Author')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('author')
                  .setLabel('Author text')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setMaxLength(256)
                  .setValue(state.author || ''),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            filter: m => m.customId === 'eb_author' && m.user.id === i.user.id,
            time: 120_000,
          }).catch(() => null);

          if (!submit) return;

          state.author = submit.fields.getTextInputValue('author').trim() || null;
          await submit.deferUpdate();
          return refresh();
        }

        if (choice === 'footer') {
          const modal = new ModalBuilder()
            .setCustomId('eb_footer')
            .setTitle('Set Footer')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('footer')
                  .setLabel('Footer text')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setMaxLength(2048)
                  .setValue(state.footer || ''),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            filter: m => m.customId === 'eb_footer' && m.user.id === i.user.id,
            time: 120_000,
          }).catch(() => null);

          if (!submit) return;

          state.footer = submit.fields.getTextInputValue('footer').trim() || null;
          await submit.deferUpdate();
          return refresh();
        }

        if (choice === 'field') {
          if (state.fields.length >= MAX_FIELDS) {
            return i.reply({
              embeds: [errorEmbed('Fields Full', 'Maximum 25 fields.')],
              ephemeral: true,
            });
          }

          const modal = new ModalBuilder()
            .setCustomId('eb_field')
            .setTitle('Add Field')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('name')
                  .setLabel('Field name')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMaxLength(256),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('value')
                  .setLabel('Field value')
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(true)
                  .setMaxLength(1024),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('inline')
                  .setLabel('Inline? yes/no')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setMaxLength(3)
                  .setValue('no'),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            filter: m => m.customId === 'eb_field' && m.user.id === i.user.id,
            time: 120_000,
          }).catch(() => null);

          if (!submit) return;

          const name = submit.fields.getTextInputValue('name').trim();
          const value = submit.fields.getTextInputValue('value').trim();
          const inlineText = submit.fields.getTextInputValue('inline').trim().toLowerCase();

          state.fields.push({
            name,
            value,
            inline: inlineText === 'yes',
          });

          await submit.deferUpdate();
          return refresh();
        }

        if (choice === 'timestamp') {
          state.timestamp = !state.timestamp;
          await i.deferUpdate();
          return refresh();
        }

        if (choice === 'reset') {
          state.title = null;
          state.description = null;
          state.color = getColor('primary');
          state.author = null;
          state.footer = null;
          state.thumbnail = null;
          state.image = null;
          state.timestamp = false;
          state.fields = [];

          await i.deferUpdate();
          return refresh();
        }

        return i.deferUpdate();
      } catch (error) {
        console.error('Embed builder interaction error:', error);

        if (!i.replied && !i.deferred) {
          await i.reply({
            content: '❌ Something went wrong with that action.',
            ephemeral: true,
          }).catch(() => {});
        }
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'sent' || reason === 'cancelled') return;

      await InteractionHelper.safeEditReply(interaction, {
        content: '⌛ Embed builder timed out.',
        embeds: [],
        components: [],
      }).catch(() => {});
    });
  },
};
