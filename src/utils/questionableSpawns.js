export const questionableSpawnChannels = new Set();
export const activeQuestionableSpawns = new Map();
export const questionableInventories = new Map();

export const questionables = [
  {
    id: 'leo_questionable',
    name: 'Leo Questionable',
    answer: 'questionable',
    rarity: 'Common'
  },
  {
    id: 'soba_questionable',
    name: 'Soba Questionable',
    answer: 'questionable',
    rarity: 'Uncommon'
  },
  {
    id: 'star_questionable',
    name: 'Star Questionable',
    answer: 'questionable',
    rarity: 'Rare'
  },
  {
    id: 'captain_questionable',
    name: 'Captain Questionable',
    answer: 'questionable',
    rarity: 'Godly'
  }
];

export function canSpawnInChannel(channelId, allowedChannels) {
  if (questionableSpawnChannels.size > 0) {
    return questionableSpawnChannels.has(channelId);
  }

  return allowedChannels.has(channelId);
}

export function getRandomQuestionable() {
  const roll = Math.random();

  if (roll < 0.01) return questionables.find(q => q.id === 'captain_questionable');
  if (roll < 0.10) return questionables.find(q => q.id === 'star_questionable');
  if (roll < 0.30) return questionables.find(q => q.id === 'soba_questionable');

  return questionables.find(q => q.id === 'leo_questionable');
}

export function addToInventory(guildId, userId, questionable) {
  const key = `${guildId}:${userId}`;

  if (!questionableInventories.has(key)) {
    questionableInventories.set(key, []);
  }

  const inventory = questionableInventories.get(key);

  inventory.push({
    id: questionable.id,
    name: questionable.name,
    rarity: questionable.rarity,
    caughtAt: Date.now()
  });

  return inventory;
}

export function getInventory(guildId, userId) {
  const key = `${guildId}:${userId}`;
  return questionableInventories.get(key) || [];
}
