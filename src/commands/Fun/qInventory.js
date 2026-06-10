import {
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';

import { getInventory } from '../../utils/questionableState.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your caught Questionables.'),

  category: 'Fun',

  async execute(interaction) {
    const inventory = getInventory(interaction.user.id);

    if (inventory.length === 0) {
      return interaction.reply({
        content: 'Your Questionable inventory is empty.',
        ephemeral: true
      });
    }

    const counts = new Map();

    for (const questionable of inventory) {
      if (!counts.has(questionable.id)) {
        counts.set(questionable.id, {
          name: questionable.name,
          rarity: questionable.rarity || 'Unknown',
          image: questionable.image,
          count: 0
        });
      }

      counts.get(questionable.id).count++;
    }

    const list = [...counts.values()]
      .map(q => `• **${q.name}** — ${q.rarity} x${q.count}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Questionables`)
      .setDescription(list)
      .setFooter({ text: `Total caught: ${inventory.length}` });

    return interaction.reply({
      embeds: [embed]
    });
  }
};
