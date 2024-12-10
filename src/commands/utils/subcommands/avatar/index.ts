import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder
} from "discord.js";
import deferReply from "../../../../utils/deferReply";
import sendResponse from "../../../../utils/sendResponse";

export const builder = (command: SlashCommandSubcommandBuilder) => {
  return command
    .setName("avatar")
    .setDescription("Display someones avatar")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose avatar you want to check")
    );
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const { options, user } = interaction;

  await deferReply(interaction, false);
  const userOption = options.getUser("user");
  const targetUser = userOption || user;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${targetUser.username}'s Profile Picture`,
      iconURL: targetUser.displayAvatarURL(),
    })
    .setTimestamp(new Date())
    .setFooter({
      text: `Requested by ${user.username}`,
      iconURL: user.displayAvatarURL(),
    });

  const avatarUrl = targetUser.displayAvatarURL();

  await sendResponse(interaction, {
    embeds: [
      embed
        .setDescription(
          userOption
            ? `You can also [download it here](${avatarUrl})!`
            : `Your avatar is available to [download here](${avatarUrl}).`
        )
        .setThumbnail(avatarUrl)
        .setColor(process.env.EMBED_COLOR_SUCCESS),
    ],
  });
};
