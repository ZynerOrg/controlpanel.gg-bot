import { addSeconds } from "date-fns";
import { Channel, ChannelType, Guild, Message, User } from "discord.js";
import CooldownManager from "../../../handlers/CooldownManager";
import CreditsManager from "../../../handlers/CreditsManager";
import logger from "../../../utils/logger";

const cooldownManager = new CooldownManager();
const creditsManager = new CreditsManager();

const MINIMUM_LENGTH = 5;

const cooldownName = "earnCredits";

export default async (message: Message) => {
  const { guild, author, channel, content } = message;

  if (!guild || !isMessageValid(guild, author, channel, content)) {
    return;
  }

  if (await isUserOnCooldown(guild, author)) {
    logger.verbose(
      `User "${author.username}" is on cooldown for "${cooldownName}" in guild "${guild.name}"`
    );
    return;
  }

  try {
    const filter = (msg: Message) => {
      return msg.author == message.author;
    };

    if (message.author.bot) return;
    if (message.channel.type != ChannelType.GuildText) return;

    const checkTime = 5 * 1000; // Milliseconds
    const maxMessageAmount = 3; // Anti Spam Rule, remove 1 credit per message above this value during "checkTime" variable
    const amount = 1; //Amount to give if valid

    const penaltyAmount = 2; //Amount to take if invalid

    await message.channel
      .awaitMessages({ filter, time: checkTime })
      .then(async (messages) => {
        // Sounds logic with <= but since it goes down to 0 it should be < since we do not want to add at 3 too since then we add 4
        // If user is below "maxMessageAmount"
        if (messages.size < maxMessageAmount) {
          await creditsManager.give(guild, author, amount);
        }

        // Sounds logic with > but since it goes down to 0 it should be >= since we want to remove at 0 too
        // If user exceeds "maxMessageAmount"
        if (messages.size >= maxMessageAmount) {
          await creditsManager.take(guild, author, penaltyAmount);
        }

        // When it finished calculating results
        if (messages.size === 0) {
          await setCooldown(guild, author);
        }
      });
  } catch (error: unknown) {
    logger.error(
      `Failed to give credits to user ${author.username} in guild ${
        guild.name
      } when sending a message: ${String(error)}`
    );
  }
};

function isMessageValid(
  guild: Guild,
  author: User,
  channel: Channel,
  content: string
): boolean {
  return (
    guild &&
    author &&
    !author.bot &&
    channel.type === ChannelType.GuildText &&
    content.length >= MINIMUM_LENGTH
  );
}

async function isUserOnCooldown(guild: Guild, author: User): Promise<boolean> {
  const cooldownActive = await cooldownManager.checkCooldown(
    cooldownName,
    guild,
    author
  );

  if (!cooldownActive) return false;

  return cooldownActive.expiresAt > new Date();
}

async function setCooldown(guild: Guild, user: User) {
  await cooldownManager.setCooldown(
    cooldownName,
    guild,
    user,
    addSeconds(new Date(), 5)
  );
}
