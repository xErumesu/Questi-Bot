// src/utils/questionableState.js

/**
 * Current active Questionable spawn per guild.
 *
 * guildId => {
 *   id,
 *   name,
 *   channelId,
 *   spawnedAt,
 *   expiresAt,
 *   timeout
 * }
 */
export const activeQuestionableSpawns = new Map();

/**
 * User inventories.
 *
 * userId => [
 *   {
 *     id,
 *     name,
 *     rarity,
 *     image,
 *     caughtAt
 *   }
 * ]
 */
export const questionableInventories = new Map();

/**
 * Adds a Questionable to a user's inventory.
 */
export function addToInventory(userId, questionable) {
  if (!questionableInventories.has(userId)) {
    questionableInventories.set(userId, []);
  }

  questionableInventories.get(userId).push({
    id: questionable.id,
    name: questionable.name,
    rarity: questionable.rarity,
    image: questionable.image,
    caughtAt: Date.now(),
  });
}

/**
 * Gets a user's inventory.
 */
export function getInventory(userId) {
  return questionableInventories.get(userId) || [];
}

/**
 * Gets the currently active spawn in a guild.
 */
export function getActiveSpawn(guildId) {
  return activeQuestionableSpawns.get(guildId);
}

/**
 * Sets a new active spawn.
 */
export function setActiveSpawn(guildId, spawnData) {
  activeQuestionableSpawns.set(guildId, spawnData);
}

/**
 * Removes an active spawn.
 */
export function removeActiveSpawn(guildId) {
  activeQuestionableSpawns.delete(guildId);
}
