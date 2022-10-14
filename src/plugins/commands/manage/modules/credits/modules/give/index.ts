// Dependencies
import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
// Configurations
import getEmbedConfig from "../../../../../../../helpers/getEmbedData";
// Helpers../../../../../../../helpers/userData
import pluralize from "../../../../../../../helpers/pluralize";
// Models
import fetchUser from "../../../../../../../helpers/userData";
// Handlers
import logger from "../../../../../../../middlewares/logger";

// Function
export default {
  metadata: {
    guildOnly: true,
    ephemeral: true,
    permissions: [PermissionsBitField.Flags.ManageGuild],
  },

  builder: (command: SlashCommandSubcommandBuilder) => {
    return command
      .setName("give")
      .setDescription("Give credits to a user.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to give credits to.")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription(`The amount of credits to give.`)
          .setRequired(true)
      );
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const { errorColor, successColor, footerText, footerIcon } =
      await getEmbedConfig(interaction.guild); // Destructure
    const { guild, options } = interaction;

    const discordReceiver = options?.getUser("user");
    const creditAmount = options?.getInteger("amount");

    // If amount option is null
    if (creditAmount === null) {
      logger?.silly(`Amount is null`);

      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(`You must provide an amount.`)
            .setTimestamp(new Date())
            .setColor(errorColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    }

    // If amount is zero or below
    if (creditAmount <= 0) {
      logger?.silly(`Amount is zero or below`);

      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(`You must provide an amount greater than zero.`)
            .setTimestamp(new Date())
            .setColor(errorColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    }

    if (discordReceiver === null) {
      logger?.silly(`Discord receiver is null`);

      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(`You must provide a user.`)
            .setTimestamp(new Date())
            .setColor(errorColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    }
    if (guild === null) {
      logger?.silly(`Guild is null`);

      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(`You must be in a guild.`)
            .setTimestamp(new Date())
            .setColor(errorColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    }

    const toUser = await fetchUser(discordReceiver, guild);

    if (toUser === null) {
      logger?.silly(`To user is null`);

      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(`The user you provided could not be found.`)
            .setTimestamp(new Date())
            .setColor(errorColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    }

    if (toUser?.credits === null) {
      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(`The user you provided does not have any credits.`)
            .setTimestamp(new Date())
            .setColor(errorColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    }

    // Deposit amount to toUser
    toUser.credits += creditAmount;

    // Save toUser
    await toUser?.save()?.then(async () => {
      logger?.silly(`Saved toUser`);

      return interaction?.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("[:toolbox:] Manage - Credits (Give)")
            .setDescription(
              `Successfully gave ${pluralize(creditAmount, "credit")}`
            )
            .setTimestamp(new Date())
            .setColor(successColor)
            .setFooter({ text: footerText, iconURL: footerIcon }),
        ],
      });
    });
  },
};
