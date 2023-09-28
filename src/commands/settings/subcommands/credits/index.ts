import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import prisma from "../../../../handlers/prisma";
import checkPermission from "../../../../utils/checkPermission";
import deferReply from "../../../../utils/deferReply";
import sendResponse from "../../../../utils/sendResponse";

export const builder = (command: SlashCommandSubcommandBuilder) => {
  return command
    .setName("credits")
    .setDescription(`Configure credits module`)
    .addNumberOption((option) =>
      option
        .setName("work-bonus-chance")
        .setDescription("work-bonus-chance")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100),
    )
    .addNumberOption((option) =>
      option
        .setName("work-penalty-chance")
        .setDescription("work-penalty-chance")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100),
    );
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
  await deferReply(interaction, true);

  checkPermission(interaction, PermissionsBitField.Flags.ManageGuild);

  const { guild, options, user } = interaction;

  const workBonusChance = options.getNumber("work-bonus-chance");
  const workPenaltyChance = options.getNumber("work-penalty-chance");

  if (!guild) {
    throw new Error("Guild not found.");
  }

  if (typeof workBonusChance !== "number") {
    throw new Error("Work Bonus Chance must be a number.");
  }

  if (typeof workPenaltyChance !== "number") {
    throw new Error("Work Penalty Chance must be a number.");
  }

  const upsertGuildCreditsSettings = await prisma.guildCreditsSettings.upsert({
    where: {
      id: guild.id,
    },
    update: {
      workBonusChance,
      workPenaltyChance,
    },
    create: {
      id: guild.id,
      workBonusChance,
      workPenaltyChance,
      guildSettings: {
        connectOrCreate: {
          where: {
            id: guild.id,
          },
          create: {
            id: guild.id,
          },
        },
      },
    },
  });

  const embedSuccess = new EmbedBuilder()
    .setAuthor({
      name: "Configuration of Credits",
    })
    .setColor(process.env.EMBED_COLOR_SUCCESS)
    .setFooter({
      text: `Successfully configured by ${user.username}`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();

  await sendResponse(interaction, {
    embeds: [
      embedSuccess
        .setDescription("Configuration updated successfully!")
        .addFields(
          {
            name: "Work Bonus Chance",
            value: `${upsertGuildCreditsSettings.workBonusChance}`,
            inline: true,
          },
          {
            name: "Work Penalty Chance",
            value: `${upsertGuildCreditsSettings.workPenaltyChance}`,
            inline: true,
          },
        ),
    ],
  });
};
