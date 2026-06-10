export const activeQuestionableSpawns = new Map();
export const questionableInventories = new Map();

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

export function getInventory(userId) {
  return questionableInventories.get(userId) || [];
}

export function getActiveSpawn(guildId) {
  return activeQuestionableSpawns.get(guildId);
}

export function setActiveSpawn(guildId, spawnData) {
  activeQuestionableSpawns.set(guildId, spawnData);
}

export function removeActiveSpawn(guildId) {
  activeQuestionableSpawns.delete(guildId);
}
