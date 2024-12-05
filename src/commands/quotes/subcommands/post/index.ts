import { addMinutes } from "date-fns";
import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import CooldownManager from "../../../../handlers/CooldownManager";
import prisma from "../../../../handlers/prisma";
import generateCooldownName from "../../../../helpers/generateCooldownName";
import upsertGuildMember from "../../../../helpers/upsertGuildMember";
import deferReply from "../../../../utils/deferReply";
import {
  ChannelNotFoundError,
  GuildNotFoundError,
} from "../../../../utils/errors";
import sendResponse from "../../../../utils/sendResponse";

const cooldownManager = new CooldownManager();

export const builder = (command: SlashCommandSubcommandBuilder) => {
  return command
    .setName("post")
    .setDescription("Post a quote someone said in this server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user who said this")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("What the user said")
        .setRequired(true),
    );
};

export const execute = async (
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  const { options, guild, user } = interaction;

  await deferReply(interaction, true);
  if (!guild) throw new GuildNotFoundError();

  const quoteUser = options.getUser("user", true);
  const quoteString = options.getString("message", true);

  if (quoteUser.id == user.id) throw new Error("One cannot quote oneself.");

  await upsertGuildMember(guild, user);
  await upsertGuildMember(guild, quoteUser);

  const guildQuotesSettings = await prisma.guildQuotesSettings.findUnique({
    where: { id: guild.id },
  });

  if (!guildQuotesSettings) throw new Error("No configuration available.");

  if (guildQuotesSettings.status !== true)
    throw new Error("Quotes are disabled in this server.");

  const channel = await interaction.client.channels.fetch(
    guildQuotesSettings.quoteChannelId,
  );

  if (!channel) throw new ChannelNotFoundError();

  if (channel.type !== ChannelType.GuildText)
    throw new Error("The channel is not a text channel.");

  await prisma.quotes.create({
    data: {
      guildId: guild.id,
      userId: quoteUser.id,
      posterUserId: user.id,
      message: quoteString,
    },
  });

  const quoteEmbed = new EmbedBuilder()
    .setAuthor({
      name: `Quote of ${quoteUser.username}`,
      iconURL: quoteUser.displayAvatarURL(),
    })
    .setColor(process.env.EMBED_COLOR_SUCCESS)
    .setDescription(quoteString)
    .setFooter({
      text: `Posted by ${user.username}`,
      iconURL: user.displayAvatarURL(),
    });

  const sentMessage = await channel.send({ embeds: [quoteEmbed] });

  await sentMessage.react("👍");
  await sentMessage.react("👎");

  const postEmbed = new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR_SUCCESS)
    .setDescription("Successfully posted the quote!");

  await sendResponse(interaction, { embeds: [postEmbed] });

  await cooldownManager.setCooldown(
    await generateCooldownName(interaction),
    guild,
    user,
    addMinutes(new Date(), 5),
  );
};
