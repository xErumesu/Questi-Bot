import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError, TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
const facts = [
  "AJ came up with the name Morally Questionable and EJ just added Everyone onto it.",
  "Buttfart is Buttfart",
  "EJ was once known as Febius.",
  "Hammy's favorite snack is creatine.",
  "The original Buttfart was actually a cat.",
  "Ajimious is a made up word AJ came up with that sounded like a greek hero name.",
  "Erumesu is just Hermes in japanese.",
  "AMQ stands for 'Also Morally Questionable.'",
  "EJ used to make gifs on gfycat before it shutdown...He still mourns its death till this day.",
  "Rylan really likes volleyball.",
  "Leo REALLY likes horses.",
  "Zuri is making all these fun facts. (Hello world!)",
  "Keni used to be the thumbnail artist for EMQ before he got too busy with college.",
  "Keni is the OLDEST member in EMQ.",
  "Rylan is the YOUNGEST member in EMQ.",
  "The old EMQ mascot used to be a panda.",
  "If you DIDN'T know before...EMQ means Everyone (is) Morally Questionable.",
  "Everything started with Playstation clips and Capcut on a phone.",
  "99.9999999% of the time, my grammar is NOT my fault. It's Zuri's.",
];

export default {
    data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Shares a random, interesting fact."),
  category: 'Fun',

  async execute(interaction, config, client) {
    try {
      const randomFact = facts[Math.floor(Math.random() * facts.length)];

      const embed = successEmbed("Tch...If only YOU knew.", `Fun fact! **${randomFact}**`);

      await InteractionHelper.safeReply(interaction, { embeds: [embed] });
      logger.debug(`Fact command executed by user ${interaction.user.id} in guild ${interaction.guildId}`);
    } catch (error) {
      logger.error('Fact command error:', error);
      await handleInteractionError(interaction, error, {
        commandName: 'fact',
        source: 'fact_command'
      });
    }
  },
};




