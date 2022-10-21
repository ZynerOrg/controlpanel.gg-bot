import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/v10";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import prisma from "../../../../handlers/database";
import getEmbedConfig from "../../../../helpers/getEmbedData";
import logger from "../../../../middlewares/logger";

export default {
  metadata: {
    guildOnly: true,
    ephemeral: true,
    permissions: [PermissionsBitField.Flags.ManageGuild],
  },

  builder: (command: SlashCommandSubcommandBuilder) => {
    return command
      .setName("audits")
      .setDescription("Audits")
      .addBooleanOption((option) =>
        option
          .setName("status")
          .setDescription("Should audits be enabled?")
          .setRequired(true)
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel for audit messages.")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      );
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const { guild, options } = interaction;
    const { successColor, footerText, footerIcon } = await getEmbedConfig(
      guild
    );
    const status = options.getBoolean("status");
    const channel = options.getChannel("channel");

    if (!guild) throw new Error("Guild not found.");
    if (!channel) throw new Error("Channel not found.");
    if (status === null) throw new Error("Status not found.");

    const createGuild = await prisma.guild.upsert({
      where: {
        id: guild.id,
      },
      update: {
        auditsEnabled: status,
        auditsChannelId: channel.id,
      },
      create: {
        id: guild.id,
        auditsEnabled: status,
        auditsChannelId: channel.id,
      },
    });

    logger.silly(createGuild);

    const embedSuccess = new EmbedBuilder()
      .setTitle("[:hammer:] Audits")
      .setDescription("Guild configuration updated successfully.")
      .setColor(successColor)
      .addFields(
        {
          name: "🤖 Status",
          value: `${
            createGuild.auditsEnabled
              ? ":white_check_mark: Enabled"
              : ":x: Disabled"
          }`,
          inline: true,
        },
        {
          name: "🌊 Channel",
          value: `<#${createGuild.auditsChannelId}>`,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        iconURL: footerIcon,
        text: footerText,
      });

    await interaction.editReply({
      embeds: [embedSuccess],
    });
    return;
  },
};
