import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError, TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';
import { sanitizeInput } from '../../utils/sanitization.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
function stringToHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
function isBotMentioned(name, client) {
  const botId = client.user.id;
  const cleaned = name.toLowerCase();

  return (
    cleaned === botId ||
    cleaned === client.user.username.toLowerCase() ||
    cleaned === `<@${botId}>` ||
    cleaned === `<@!${botId}>`
  );
}
export default {
    data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Calculate the compatibility score between two people.")
    .addStringOption((option) =>
      option
        .setName("name1")
        .setDescription("The first name or user.")
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option
        .setName("name2")
        .setDescription("The second name or user.")
        .setRequired(true)
        .setMaxLength(100),
    ),
  category: 'Fun',

  async execute(interaction, config, client) {
    try {
      await InteractionHelper.safeDefer(interaction);
      const name1Raw = interaction.options.getString("name1");
const name2Raw = interaction.options.getString("name2");
      
      if (!name1Raw || name1Raw.trim().length === 0 || !name2Raw || name2Raw.trim().length === 0) {
        throw new TitanBotError(
          'Empty names provided to ship command',
          ErrorTypes.USER_INPUT,
          'Please provide valid names for both people!'
        );
      }

      
      const name1 = sanitizeInput(name1Raw.trim(), 100);
      const name2 = sanitizeInput(name2Raw.trim(), 100);

      
      if (name1.toLowerCase() === name2.toLowerCase()) {
        const embed = warningEmbed(
          "💖 Ship Score",
          `**${name1}** can't be shipped with themselves! Please choose two different people.`
        );
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      const sortedNames = [name1, name2].sort();
      const combination = sortedNames.join("-").toLowerCase();
      const score = stringToHash(combination) % 101;

     if (isBotMentioned(name1, client) || isBotMentioned(name2, client)) {
  const ewReplies = [
    "ME??? Ewwwwwwwuuhhhh!",
    "EWW. Don’t put me in your shipping business.",
    "Absolutely not. I’m literally a bot.",
    "Nope. I reject this ship.",
    "I was summoned for THIS??"
  ];

  const reply = ewReplies[Math.floor(Math.random() * ewReplies.length)];

  const embed = warningEmbed(
    "💖 Ship Rejected",
    `${reply}\n\nI am below nobody’s standards. Everyone is below **mine**.`
  );

  return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}
      
if (
  name1 === "577137487181512704" ||
  name2 === "577137487181512704" ||
  name1 === "<@577137487181512704>" ||
  name2 === "<@577137487181512704>"
) {
  const embed = warningEmbed(
    "💖 Ship Rejected",
    "Of course you want to be with THE Captain Questionable. DENIED! Haha!"
  );

  return await InteractionHelper.safeEditReply(interaction, {
    embeds: [embed],
  });
}
      
      
    const blacklistedShips = [
  "<@856416079970566184>", // Zuri
  "<@465257883894939669>", // StarStatus
  "<@551648843008049153>", // EvilxWithin
  "<@593248234282024961>", // Ajimious
  "<@742072458743382037>", // Dope
  "<@666020603790360602>", // Sobaba
  "<@842897184348438559>", // Leo
  "<@684587374294073417>", // Dizzy
  "<@360843317270806549>", // Woozy
  "<@1272394178785050659>", // Buttfart
  "<@955202828249497620>", // Valor
  "<@693478819222388847>", // Zulqoz
  "<@1056714103957229718>", // Rylan
  "<@537767012227743775>", // Keni
];

if (
  blacklistedShips.includes(name1) ||
  blacklistedShips.includes(name2)
) {
    const noReplies = [
    "Hah. As if.",
    "Is it even **allowed**??",
    "Absolutely not.",
    "Nope. I reject this ship.",
    "***BWAAHHHCAAHCAAHHCAHHAHAHA!!!!!***",
  ];

  const reply = noReplies[Math.floor(Math.random() * noReplies.length)];

  const embed = warningEmbed(
    "💖 Ship Rejected",
    `${reply}\n\nThey're above your standards.`
  );
 return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}
        
      let description;
      if (score === 100) {
        description = "Soulmates! It's destiny, they belong together!";
      } else if (score >= 80) {
        description = "A perfect match! Get the wedding bells ready!";
      } else if (score >= 60) {
        description = "Solid chemistry. Definitely worth exploring!";
      } else if (score >= 40) {
        description = "Just friends status. Maybe with time?";
      } else if (score >= 20) {
        description = "It's a struggle. They might need space.";
      } else {
        description = "Zero compatibility. Run for the hills!";
      }

      const progressBar =
        "█".repeat(Math.floor(score / 10)) +
        "░".repeat(10 - Math.floor(score / 10));

      const embed = successEmbed(
        `💖 Ship Score: ${name1} vs ${name2}`,
        `Compatibility: **${score}%**\n\n\`${progressBar}\`\n\n*${description}*`,
      );

      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      logger.debug(`Ship command executed by user ${interaction.user.id} in guild ${interaction.guildId}`);
    } catch (error) {
      logger.error('Ship command error:', error);
      await handleInteractionError(interaction, error, {
        commandName: 'ship',
        source: 'ship_command'
      });
    }
  },
};




