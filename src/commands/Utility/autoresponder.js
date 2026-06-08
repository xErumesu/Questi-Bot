import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js'
import { InteractionHelper } from '../../utils//interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

const disabledChannels = new Set();

export { disabledChannels };

export default {
  data: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Enable or disable auto responses in this channel.')
    .setDefaultMemberPermissions(PermissionflagsBits.ManageMessages)
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable auto responses in this channel.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable auto responses in this channel.')
    )
   .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check if auto responses are enabled here.')
    )
  category: 'Utility',

    async execute(interaction, config, client) {
    try {
      await InteractionHelper.safeDefer(interaction);

      const subcommand = interaction.options.getSubcommand();
      const channelId = interaction.channel.id;

      if (subcommand === 'disable') {
        disabledChannels.add(channelId);

        const embed = warningEmbed(
          '🤖 Autoresponder Disabled',
          'Auto responses are now disabled in this channel.'
        );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'enable') {
        disabledChannels.delete(channelId);

        const embed = successEmbed(
          '🤖 Autoresponder Enabled',
          'Auto responses are now enabled in this channel.'
        );

        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'status') {
        const isDisabled = disabledChannels.has(channelId);

        const embed = isDisabled
          ? warningEmbed(
              '🤖 Autoresponder Status',
              'Auto responses are currently disabled in this channel.'
            )
          : successEmbed(
              '🤖 Autoresponder Status',
              'Auto responses are currently enabled in this channel.'
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
