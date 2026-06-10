import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  MessageFlags,
} from 'discord.js';

import { warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { getColor } from '../../config/bot.js';

const MAX_CHANNELS = 25;
const IDLE_TIMEOUT = 300_000;

const allowedChannels = new Set();
export { allowedChannels };

function autoRespond(state) {
  return new EmbedBuilder()
    .setTitle('Auto Responder - Control Panel')
    .setColor(getColor('info'))
    .setDescription([
      `**Channels** › ${
        state.channels.length > 0
          ? state.channels.map(channel => `${channel}`).join(', ')
          : '`No Channels Added`'
      }`,
      `**Channel Amount** › ${state.channels.length} / ${MAX_CHANNELS}`,
      `**Action** › ${state.action ? `\`${state.action}\`` : '`No Action Selected`'}`,
      '',
      'The preview above updates live · Closes after 5 min of inactivity',
    ].join('\n'));
}

function buildMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId('ar_menu')
    .setPlaceholder('What action would you like to do?')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Enable Autoresponder')
        .setValue('enable')
        .setEmoji('✅'),

      new StringSelectMenuOptionBuilder()
        .setLabel('Disable Autoresponder')
        .setValue('disable')
        .setEmoji('🚫'),
    );
}

function buildChannelSelect(state) {
  const addChannelMenu = new ChannelSelectMenuBuilder()
    .setCustomId('ar_add_channels')
    .setPlaceholder('Choose channel(s)')
    .setMinValues(1)
    .setMaxValues(MAX_CHANNELS);

  const removeChannelMenu = new StringSelectMenuBuilder()
    .setCustomId('ar_remove_channels')
    .setPlaceholder('Remove a channel')
    .setDisabled(state.channels.length === 0);

  if (state.channels.length > 0) {
    removeChannelMenu.addOptions(
      state.channels.slice(0, MAX_CHANNELS).map(channel =>
        new StringSelectMenuOptionBuilder()
          .setLabel(channel.name.substring(0, 100))
          .setDescription(`Remove ${channel.name}`.substring(0, 100))
          .setValue(channel.id)
          .setEmoji('➖')
      )
    );
  } else {
    removeChannelMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('No channels added')
        .setDescription('Add a channel first')
        .setValue('none')
    );
  }

  return [
    new ActionRowBuilder().addComponents(addChannelMenu),
    new ActionRowBuilder().addComponents(removeChannelMenu),
  ];
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ar_save')
      .setLabel('Save')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('ar_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Enable/disable autoresponding in channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  category: 'Utility',

  async execute(interaction) {
    try {
      const deferred = await InteractionHelper.safeDefer(interaction, {
        flags: MessageFlags.Ephemeral,
      });
      if (!deferred) return;

      const state = {
        channels: [],
        action: null,
      };

      const refresh = async () => {
        await InteractionHelper.safeEditReply(interaction, {
          embeds: [autoRespond(state)],
          components: [
            new ActionRowBuilder().addComponents(buildMenu()),
            ...buildChannelSelect(state),
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
            return await i.reply({
              content: "This ain't your panel.",
              ephemeral: true,
            });
          }

          if (i.isStringSelectMenu() && i.customId === 'ar_menu') {
            state.action = i.values[0];

            await i.deferUpdate();
            return refresh();
          }

          if (i.isChannelSelectMenu() && i.customId === 'ar_add_channels') {
            for (const channel of i.channels.values()) {
              const alreadyAdded = state.channels.some(saved => saved.id === channel.id);

              if (!alreadyAdded && state.channels.length < MAX_CHANNELS) {
                state.channels.push(channel);
              }
            }

            await i.deferUpdate();
            return refresh();
          }

          if (i.isStringSelectMenu() && i.customId === 'ar_remove_channels') {
            const channelId = i.values[0];

            if (channelId !== 'none') {
              state.channels = state.channels.filter(channel => channel.id !== channelId);
            }

            await i.deferUpdate();
            return refresh();
          }

          if (i.isButton()) {
            if (i.customId === 'ar_cancel') {
              collector.stop('cancelled');

              return await i.update({
                content: 'Autoresponder command cancelled.',
                embeds: [],
                components: [],
              });
            }

            if (i.customId === 'ar_save') {
              const hasContent = state.channels.length > 0 && state.action;

              if (!hasContent) {
                return await i.reply({
                  embeds: [warningEmbed('No changes made', 'Pick channels and an action first.')],
                  ephemeral: true,
                });
              }

              for (const channel of state.channels) {
                const perms = channel.permissionsFor(interaction.guild.members.me);

                if (!perms?.has(PermissionFlagsBits.SendMessages)) {
                  return await i.reply({
                    embeds: [
                      warningEmbed(
                        'Missing Permissions',
                        `I need **Send Messages** in ${channel}!`
                      ),
                    ],
                    ephemeral: true,
                  });
                }

                if (state.action === 'enable') {
                  allowedChannels.add(channel.id);
                }

                if (state.action === 'disable') {
                  allowedChannels.delete(channel.id);
                }
              }

              collector.stop('save');

              return await i.update({
                content: `✅ Saved autoresponder settings for ${state.channels.map(channel => `${channel}`).join(', ')}.`,
                embeds: [],
                components: [],
              });
            }
          }

          return await i.deferUpdate();
        } catch (error) {
          console.error('Autoresponder panel error:', error);

          if (!i.replied && !i.deferred) {
            await i.reply({
              embeds: [
                warningEmbed(
                  'Error',
                  'Something went wrong with that panel action.'
                ),
              ],
              ephemeral: true,
            }).catch(() => {});
          }
        }
      });

      collector.on('end', async (_, reason) => {
        if (reason === 'save' || reason === 'cancelled') return;

        await InteractionHelper.safeEditReply(interaction, {
          content: '⌛ Autoresponder panel timed out.',
          embeds: [],
          components: [],
        }).catch(() => {});
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: 'autoresponder',
        source: 'autoresponder_command',
      });
    }
  },
};
