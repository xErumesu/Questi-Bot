import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create an embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Embed title')
    )

    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Embed description')
        .setRequired(true)
    ),

  category: 'Utility',

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');

    const embed = new EmbedBuilder()
      .setDescription(description);

    if (title) embed.setTitle(title);

    await interaction.channel.send({
      embeds: [embed]
    });

    await interaction.reply({
      content: 'Embed sent!',
      ephemeral: true
    });
  }
};
