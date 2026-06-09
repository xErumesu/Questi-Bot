import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create an embed builder')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Embed title')
        .setRequired(true)
    ),

  category: 'Utility',

  async execute(interaction) {
    await interaction.deferReply();

    let title = interaction.options.getString('title');

    const makeEmbed = () =>
      new EmbedBuilder()
        .setTitle(title);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`embed_menu_${interaction.id}`)
      .setPlaceholder('What would you like to change?')
      .addOptions(
        {
          label: 'Set Title',
          value: 'title',
          emoji: '📝'
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

    await interaction.editReply({
      content: 'The preview above updates live. Closes after 5 min of inactivity.',
      embeds: [makeEmbed()],
      components: [menuRow, buttonRow]
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      time: 300_000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "This isn't your embed builder.",
          ephemeral: true
        });
      }

      if (i.customId === `embed_cancel_${interaction.id}`) {
        collector.stop('cancelled');

        return i.update({
          content: '❌ Embed builder cancelled.',
          embeds: [],
          components: []
        });
      }

      if (i.customId === `embed_send_${interaction.id}`) {
        collector.stop('sent');

        await interaction.channel.send({
          embeds: [makeEmbed()]
        });

        return i.update({
          content: '✅ Embed sent!',
          embeds: [],
          components: []
        });
      }

      if (i.customId === `embed_menu_${interaction.id}`) {
        const choice = i.values[0];

        if (choice === 'title') {
          title = `${title} ✨`;

          return i.update({
            content: 'The preview above updates live. Closes after 5 min of inactivity.',
            embeds: [makeEmbed()],
            components: [menuRow, buttonRow]
          });
        }

        return i.deferUpdate();
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'sent' || reason === 'cancelled') return;

      await interaction.editReply({
        content: '⌛ Embed builder timed out.',
        embeds: [],
        components: []
      }).catch(() => {});
    });
  }
};
