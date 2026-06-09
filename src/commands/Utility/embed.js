import { SlashCommandBuilder, 
        PermissionFlagsBits,
        EmbedBuilder,
 } from 'discord.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
  data new SlashCommandBuilder(
  .setName('embed')
  .setDescription('Create an embed')
  .setDefaultMemberPermissions(PermissionFlagBits.ManageMessages)
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('Embed title')
      .setRequired(true)
  ),
category, 'Utility',
async execute(interaction, config, client) {
  try {
    const deferred = await InteractionHelper.safeDefer(interation);
    if(!deferred)return;

    const title = interaction.options.getString('title');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription('Placeholder for Descriptions');

    await interaction.channel.send({ embeds: [embed] });

    return await InteractionHelper.safeEditReply(interaction, {
      content: '✅ Embed sent with title!'
    });
  } catch (error) {
    console.error('Embed command error:',error);

    await handleInteractionError(interaction, error, {
      commandName: 'embed',
      source: 'embed_command'
    });
  }
}
};
