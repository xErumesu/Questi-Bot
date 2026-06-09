import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  RoleSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
  EmbedBuilder
} from 'discord.js';

import { getColor } from '../../config/bot.js';
import { errorEmbed, successEmbed, warningEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError, createError, TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import {
  createReactionRoleMessage,
  hasDangerousPermissions,
  getAllReactionRoleMessages,
  deleteReactionRoleMessage
} from '../../services/reactionRoleService.js';

const MAX_ROLES = 25;

export default {
  data: new SlashCommandBuilder()
    .setName('reactroles')
    .setDescription('Manage reaction role assignments')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Set up a new reaction role panel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send the reaction role message to')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Title for the reaction role panel')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Description for the reaction role panel')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('dashboard')
        .setDescription('Manage and configure your reaction role panels')
        .addStringOption(option =>
          option
            .setName('panel')
            .setDescription('Select a reaction role panel to manage')
            .setRequired(false)
            .setAutocomplete(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'setup') {
        await handleSetup(interaction);
      }

      if (subcommand === 'dashboard') {
        const selectedPanelId = interaction.options.getString('panel');
        await handleDashboard(interaction, selectedPanelId);
      }
    } catch (error) {
      await handleInteractionError(interaction, error, {
        type: 'command',
        commandName: 'reactroles',
        subcommand
      });
    }
  },

  async autocomplete(interaction) {
    if (interaction.commandName !== 'reactroles') return;
    if (interaction.options.getSubcommand() !== 'dashboard') return;

    try {
      const guildId = interaction.guild.id;
      const client = interaction.client;

      const panels = await getAllReactionRoleMessages(client, guildId).catch(() => []);

      if (!panels || panels.length === 0) {
        return await interaction.respond([]).catch(() => {});
      }

      const choices = [];

      for (const panel of panels.slice(0, 25)) {
        const channel = interaction.guild.channels.cache.get(panel.channelId);
        if (!channel) continue;

        const msg = await channel.messages.fetch(panel.messageId).catch(() => null);
        if (!msg) continue;

        const title = msg.embeds?.[0]?.title || 'Untitled Panel';
        choices.push({
          name: `${title} (${channel.name})`.substring(0, 100),
          value: panel.messageId
        });
      }

      await interaction.respond(choices).catch(() => {});
    } catch {
      await interaction.respond([]).catch(() => {});
    }
  }
};

async function handleSetup(interaction) {
  const deferSuccess = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral
  });
  if (!deferSuccess) return;

  const channel = interaction.options.getChannel('channel');
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');

  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    throw createError(
      `Invalid channel type: ${channel.type}`,
      ErrorTypes.VALIDATION,
      'Please select a text or announcement channel.',
      { channelType: channel.type }
    );
  }

  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw createError(
      'Bot missing ManageRoles permission',
      ErrorTypes.PERMISSION,
      'I need the "Manage Roles" permission to set up reaction roles.',
      { permission: 'ManageRoles' }
    );
  }

  if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
    throw createError(
      `Bot cannot send messages in ${channel.name}`,
      ErrorTypes.PERMISSION,
      `I don't have permission to send messages in ${channel}.`,
      { channelId: channel.id }
    );
  }

  const existingPanels = await getAllReactionRoleMessages(interaction.client, interaction.guildId);

  if (existingPanels && existingPanels.length >= 5) {
    throw createError(
      'Panel limit reached',
      ErrorTypes.VALIDATION,
      'Your guild has reached the maximum of 5 reaction role panels. Delete an existing panel to create a new one.',
      { maxPanels: 5, currentPanels: existingPanels.length }
    );
  }

  const selectedRoles = [];

  const validateRole = role => {
    if (!role) return 'No role selected.';
    if (role.id === interaction.guild.id) return 'You cannot use @everyone.';
    if (role.managed) return `${role.name} is a managed/bot role.`;
    if (hasDangerousPermissions(role)) return `${role.name} has dangerous permissions.`;
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return `${role.name} is above my highest role. Move my bot role higher first.`;
    }

    return null;
  };

  const buildPreview = () => {
    return new EmbedBuilder()
      .setTitle('🎭 Reaction Role Builder')
      .setColor(getColor('info'))
      .setDescription(
        [
          `**Panel Title:** ${title}`,
          `**Channel:** ${channel}`,
          `**Roles:** \`${selectedRoles.length}/${MAX_ROLES}\``,
          '',
          selectedRoles.length
            ? selectedRoles.map((role, index) => `${index + 1}. ${role}`).join('\n')
            : '`No roles added yet.`'
        ].join('\n')
      )
      .setFooter({ text: 'Add roles, remove roles, then create the panel.' });
  };

  const buildControls = () => {
    const addRoleMenu = new RoleSelectMenuBuilder()
      .setCustomId('rr_setup_add_roles')
      .setPlaceholder('Add roles to this panel')
      .setMinValues(1)
      .setMaxValues(MAX_ROLES);

    const removeRoleMenu = new StringSelectMenuBuilder()
      .setCustomId('rr_setup_remove_roles')
      .setPlaceholder('Remove a role from this panel')
      .setDisabled(selectedRoles.length === 0);

    if (selectedRoles.length > 0) {
      removeRoleMenu.addOptions(
        selectedRoles.slice(0, MAX_ROLES).map(role =>
          new StringSelectMenuOptionBuilder()
            .setLabel(role.name.substring(0, 100))
            .setDescription(`Remove ${role.name}`.substring(0, 100))
            .setValue(role.id)
            .setEmoji('➖')
        )
      );
    } else {
      removeRoleMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('No roles added')
          .setDescription('Add a role first')
          .setValue('none')
      );
    }

    const createButton = new ButtonBuilder()
      .setCustomId('rr_setup_create')
      .setLabel('Create Panel')
      .setStyle(ButtonStyle.Success)
      .setDisabled(selectedRoles.length === 0);

    const cancelButton = new ButtonBuilder()
      .setCustomId('rr_setup_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);

    return [
      new ActionRowBuilder().addComponents(addRoleMenu),
      new ActionRowBuilder().addComponents(removeRoleMenu),
      new ActionRowBuilder().addComponents(createButton, cancelButton)
    ];
  };

  await InteractionHelper.safeEditReply(interaction, {
    embeds: [buildPreview()],
    components: buildControls()
  });

  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    time: 600_000
  });

  collector.on('collect', async i => {
    try {
      if (i.user.id !== interaction.user.id) {
        return await i.reply({
          content: "This isn't your reaction role builder.",
          ephemeral: true
        });
      }

      if (i.isRoleSelectMenu() && i.customId === 'rr_setup_add_roles') {
        const errors = [];

        for (const role of i.roles.values()) {
          if (selectedRoles.some(r => r.id === role.id)) continue;
          if (selectedRoles.length >= MAX_ROLES) break;

          const invalidReason = validateRole(role);

          if (invalidReason) {
            errors.push(`• ${invalidReason}`);
            continue;
          }

          selectedRoles.push(role);
        }

        await i.update({
          embeds: [buildPreview()],
          components: buildControls()
        });

        if (errors.length > 0) {
          await i.followUp({
            embeds: [
              warningEmbed(
                'Some Roles Were Skipped',
                errors.join('\n')
              )
            ],
            flags: MessageFlags.Ephemeral
          }).catch(() => {});
        }

        return;
      }

      if (i.isStringSelectMenu() && i.customId === 'rr_setup_remove_roles') {
        const roleId = i.values[0];

        if (roleId !== 'none') {
          const index = selectedRoles.findIndex(role => role.id === roleId);
          if (index !== -1) selectedRoles.splice(index, 1);
        }

        return await i.update({
          embeds: [buildPreview()],
          components: buildControls()
        });
      }

      if (i.isButton() && i.customId === 'rr_setup_cancel') {
        collector.stop('cancelled');

        return await i.update({
          embeds: [warningEmbed('Cancelled', 'Reaction role setup cancelled.')],
          components: []
        });
      }

      if (i.isButton() && i.customId === 'rr_setup_create') {
        if (selectedRoles.length === 0) {
          return await i.reply({
            embeds: [errorEmbed('No Roles', 'Add at least one role before creating the panel.')],
            ephemeral: true
          });
        }

        collector.stop('created');

        const roleMenu = new StringSelectMenuBuilder()
          .setCustomId('reaction_roles')
          .setPlaceholder('Select your roles')
          .setMinValues(0)
          .setMaxValues(selectedRoles.length)
          .addOptions(
            selectedRoles.map(role => ({
              label: role.name.substring(0, 100),
              description: `Add/remove the ${role.name} role`.substring(0, 100),
              value: role.id,
              emoji: '🎭'
            }))
          );

        const row = new ActionRowBuilder().addComponents(roleMenu);

        const panelEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(getColor('info'))
          .addFields({
            name: 'Available Roles',
            value: selectedRoles.map(role => `• ${role}`).join('\n')
          })
          .setFooter({ text: 'Select roles from the dropdown menu below' });

        const panelMessage = await channel.send({
          embeds: [panelEmbed],
          components: [row]
        });

        await createReactionRoleMessage(
          interaction.client,
          interaction.guildId,
          channel.id,
          panelMessage.id,
          selectedRoles.map(role => role.id)
        );

        return await i.update({
          embeds: [
            successEmbed(
              'Success',
              `✅ Reaction role panel created in ${channel}!\n\n${panelMessage.url}`
            )
          ],
          components: []
        });
      }
    } catch (error) {
      logger.error('Reaction role setup builder error:', error);

      if (!i.replied && !i.deferred) {
        await i.reply({
          embeds: [errorEmbed('Error', 'Something went wrong with that action.')],
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'created' || reason === 'cancelled') return;

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [warningEmbed('Timed Out', 'Reaction role setup timed out.')],
      components: []
    }).catch(() => {});
  });
}

async function handleDashboard(interaction, selectedPanelId) {
  const deferSuccess = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral
  });
  if (!deferSuccess) return;

  const guildId = interaction.guild.id;
  const guild = interaction.guild;
  const client = interaction.client;

  const panels = await getAllReactionRoleMessages(client, guildId);

  if (!panels || panels.length === 0) {
    return await InteractionHelper.safeEditReply(interaction, {
      embeds: [
        errorEmbed(
          'No Panels Found',
          'No reaction role panels exist yet. Use `/reactroles setup` to create one.'
        )
      ]
    });
  }

  const validPanels = [];

  for (const panel of panels) {
    const channel = guild.channels.cache.get(panel.channelId);
    if (!channel) {
      await deleteReactionRoleMessage(client, guildId, panel.messageId).catch(() => {});
      continue;
    }

    const msg = await channel.messages.fetch(panel.messageId).catch(() => null);
    if (!msg) {
      await deleteReactionRoleMessage(client, guildId, panel.messageId).catch(() => {});
      continue;
    }

    validPanels.push(panel);
  }

  if (validPanels.length === 0) {
    return await InteractionHelper.safeEditReply(interaction, {
      embeds: [
        errorEmbed(
          'No Valid Panels Found',
          'No reaction role panels exist yet. Use `/reactroles setup` to create one.'
        )
      ]
    });
  }

  const activePanelData = selectedPanelId
    ? validPanels.find(panel => panel.messageId === selectedPanelId)
    : validPanels[0];

  if (!activePanelData) {
    return await InteractionHelper.safeEditReply(interaction, {
      embeds: [errorEmbed('Panel Not Found', 'That panel no longer exists or has been deleted.')]
    });
  }

  const discordMsg = await fetchPanelDiscordMessage(guild, activePanelData);

  return await InteractionHelper.safeEditReply(interaction, {
    embeds: [
      new EmbedBuilder()
        .setTitle('🎭 Reaction Roles Dashboard')
        .setColor(getColor('info'))
        .setDescription(
          [
            `**Panel:** ${discordMsg?.embeds?.[0]?.title || 'Untitled Panel'}`,
            `**Channel:** <#${activePanelData.channelId}>`,
            `**Roles:** \`${activePanelData.roles.length}/25\``,
            discordMsg ? `[Click Here to View Panel](${discordMsg.url})` : ''
          ].join('\n')
        )
        .addFields({
          name: 'Role List',
          value: activePanelData.roles.length
            ? activePanelData.roles.map(id => `<@&${id}>`).join(', ')
            : '`None`'
        })
    ]
  });
}

async function fetchPanelDiscordMessage(guild, panelData) {
  try {
    const channel = guild.channels.cache.get(panelData.channelId);
    if (!channel) return null;

    return await channel.messages.fetch(panelData.messageId).catch(() => null);
  } catch {
    return null;
  }
}
