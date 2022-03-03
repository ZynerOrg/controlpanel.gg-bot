const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');

const balance = require('./addons/balance.js');
const gift = require('./addons/gift.js');
const give = require('./addons/give.js');
const redeem = require('./addons/redeem.js');
const take = require('./addons/take.js');
const top = require('./addons/top.js');

module.exports = {
  permissions: new Permissions([
    Permissions.FLAGS.MANAGE_MESSAGES,
    Permissions.FLAGS.ADMINISTRATOR,
  ]),
  guildOnly: true,
  botAdminOnly: false,
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('Manage your credits.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('give')
        .setDescription('Give credits to a user.')
        .addUserOption((option) =>
          option.setName('user').setDescription('The user you want to pay.').setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('The amount you will pay.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('take')
        .setDescription('Take credits from a user.')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user you want to take credits from.')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('The amount you will take.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('balance')
        .setDescription("Check a user's balance.")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user whose balance you want to check.')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('redeem')
        .setDescription('Redeem your credits.')
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('How much credit you want to withdraw.')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('gift')
        .setDescription('Gift someone credits from your credits.')
        .addUserOption((option) =>
          option.setName('user').setDescription('The user you want to pay.').setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('The amount you will pay.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('top').setDescription('Check the top balance.')
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'balance') {
      await balance(interaction);
    }
 else if (interaction.options.getSubcommand() === 'gift') {
      await gift(interaction);
    }
 else if (interaction.options.getSubcommand() === 'give') {
      await give(interaction);
    }
 else if (interaction.options.getSubcommand() === 'redeem') {
      await redeem(interaction);
    }
 else if (interaction.options.getSubcommand() === 'take') {
      await take(interaction);
    }
 else if (interaction.options.getSubcommand() === 'top') {
      await top(interaction);
    }
  },
};
