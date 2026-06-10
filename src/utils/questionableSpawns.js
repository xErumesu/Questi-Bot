import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

import {
  questionables,
  getQuestionableById,
  getRandomQuestionable
} from '../../data/questionables.js';

import { activeQuestionableSpawns } from '../../utils/questionableState.js';

function buildSpawnEmbed(questionable) {
  const catchAnswer = questionable.catchAnswer || 'questionable';
  const catchTime = questionable.catchTime || 60_000;

  const embed = new EmbedBuilder()
    .setTitle('🌟 A wild Questionable appeared!')
    .setDescription(
      [
        `A wild **${questionable.name}** appeared!`,
        `Rarity: **${questionable.rarity}**`,
        '',
        `Use \`/catch ${catchAnswer}\` to catch it!`,
        `⏳ Escapes in **${Math.floor(catchTime / 1000)} seconds**.`
      ].join('\n')
    );

  if (questionable.image) {
    embed.setImage(questionable.image);
  }

  return embed;
}

export default {
  data: new SlashCommandBuilder()
    .setName('spawnquestionable')
    .setDescription('Force spawn a Questionable.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Which Questionable to spawn')
        .setRequired(true)
        .addChoices(
          { name: 'Random', value: 'random' },
          ...questionables.slice(0, 24).map(q => ({
            name: `${q.name} (${q.rarity})`.substring(0, 100),
            value: q.id
          }))
        )
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Where to spawn it')
        .setRequired(false)
    ),

  category: 'Utility',

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const questionable =
      type === 'random'
        ? getRandomQuestionable()
        : getQuestionableById(type);

    if (!questionable) {
      return interaction.reply({
        content: 'That Questionable does not exist.',
        ephemeral: true
      });
    }

    const oldSpawn = activeQuestionableSpawns.get(interaction.guildId);

    if (oldSpawn?.timeout) {
      clearTimeout(oldSpawn.timeout);
    }

    const catchTime = questionable.catchTime || 60_000;

    const spawnData = {
      ...questionable,
      channelId: channel.id,
      spawnedAt: Date.now(),
      expiresAt: Date.now() + catchTime,
      forced: true,
      timeout: null
    };

    spawnData.timeout = setTimeout(() => {
      const current = activeQuestionableSpawns.get(interaction.guildId);

      if (!current) return;
      if (current.spawnedAt !== spawnData.spawnedAt) return;

      activeQuestionableSpawns.delete(interaction.guildId);

      channel.send(`💨 **${questionable.name}** escaped!`).catch(() => {});
    }, catchTime);

    activeQuestionableSpawns.set(interaction.guildId, spawnData);

    await channel.send({
      embeds: [buildSpawnEmbed(questionable)]
    });

    return interaction.reply({
      content: `✅ Spawned **${questionable.name}** in ${channel}.`,
      ephemeral: true
    });
  }
};
