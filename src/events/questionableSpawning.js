import { Events } from 'discord.js';
import { allowedChannels } from '../commands/Utility/autoresponder.js';
import {
  activeQuestionableSpawns,
  canSpawnInChannel,
  getRandomQuestionable
} from '../utils/questionableSpawns.js';

const SPAWN_CHANCE = 0.03;

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (message.author.bot || !message.guild) return;

    if (!canSpawnInChannel(message.channel.id, allowedChannels)) return;

    if (activeQuestionableSpawns.has(message.guild.id)) return;

    if (Math.random() < SPAWN_CHANCE) {
      const questionable = getRandomQuestionable();

      activeQuestionableSpawns.set(message.guild.id, {
        ...questionable,
        channelId: message.channel.id
      });

      return message.channel.send(
        `🌟 A wild **${questionable.rarity} Questionable** appeared!\nType \`/catch questionable\` to catch it!`
      );
    }
  }
};
