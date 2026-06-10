import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../utils/questionableSpawns.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your caught Questionables.'),

  category: 'Fun',

  async execute(interaction) {
    const inventory = getInventory(interaction.guildId, interaction.user.id);

    if (inventory.length === 0) {
      return interaction.reply('Your inventory is empty.');
    }

    const list = inventory
      .map((q, index) => `${index + 1}. **${q.name}** — ${q.rarity}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Questionables`)
      .setDescription(list)
      .setFooter({ text: `Total caught: ${inventory.length}` });

    return interaction.reply({ embeds: [embed] });
  }
};
