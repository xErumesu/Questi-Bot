import { Events } from 'discord.js';
import { allowedChannels } from '../commands/Utility/autoresponder.js';

const QUESTIONABLE_COOLDOWN = 120_000; // 120 seconds
const questionableCooldowns = new Map();

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (message.author.bot || !message.guild) return;

    if (!allowedChannels.has(message.channel.id)) return;

    const content = message.content.toLowerCase();

    if (content.includes('questionable')) {
      const now = Date.now();
      const lastUsed = questionableCooldowns.get(message.channel.id) || 0;

      if (now - lastUsed < QUESTIONABLE_COOLDOWN) return;

      questionableCooldowns.set(message.channel.id, now);

      return message.reply('Did somebody say questionable?');
    }

    if (content.includes('hate questi')) {
      const responses = [
        'Vice frickin versa.',
        'Who is this???',
        'A **ROBOT** cannot be your rival, gang 🥀',
        'WHO ARE YOU??',
        'Nobody knows you.',
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];

      return message.channel.send(response);
    }
  },
};
