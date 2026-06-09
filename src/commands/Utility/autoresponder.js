import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

const disabledChannels = new Set();
let autoresponderDisabledGlobally = false;

export { disabledChannels, autoresponderDisabledGlobally };

export default {
  data: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Enable or disable auto responses.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable auto responses in a channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to enable autoresponses in')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable auto responses in a channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to disable autoresponses in')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check if auto responses are enabled in a channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to check')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('disableall')
        .setDescription('Disable autoresponses in all channels.')
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('enableall')
        .setDescription('Enable autoresponses in all channels.')
    ),

  category: 'Utility',

  async execute(interaction, config, client) {
    try {
      const deferred = await InteractionHelper.safeDefer(interaction);
      if (!deferred) return;

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'disableall') {
        autoresponderDisabledGlobally = true;

        const embed = warningEmbed(
          '🤖 Autoresponder Disabled',
          'Auto responses are now disabled server-wide.'
        );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'enableall') {
        autoresponderDisabledGlobally = false;

        const embed = successEmbed(
          '🤖 Autoresponder Enabled',
          'Auto responses are now enabled server-wide.'
        );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const channelId = channel.id;

      if (subcommand === 'disable') {
        disabledChannels.add(channelId);

        const embed = warningEmbed(
          '🤖 Autoresponder Disabled',
          `Auto responses are now disabled in ${channel}.`
        );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'enable') {
        disabledChannels.delete(channelId);

        const embed = successEmbed(
          '🤖 Autoresponder Enabled',
          `Auto responses are now enabled in ${channel}.`
        );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'status') {
        const isDisabled = autoresponderDisabledGlobally || disabledChannels.has(channelId);

        const embed = isDisabled
          ? warningEmbed(
              '🤖 Autoresponder Status',
              autoresponderDisabledGlobally
                ? 'Auto responses are currently disabled server-wide.'
                : `Auto responses are currently disabled in ${channel}.`
            )
          : successEmbed(
              '🤖 Autoresponder Status',
              `Auto responses are currently enabled in ${channel}.`
            );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }
    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: 'autoresponder',
        source: 'autoresponder_command'
      });
    }
  },
};