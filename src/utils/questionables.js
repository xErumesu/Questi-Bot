export const questionables = [
  {
    id: 'leo',
    name: 'Leo Questionable',
    type: 'regular',
    rarity: 'Common',
    image: '',
    catchAnswer: 'questionable',
    catchTime: 60000,
  },
  {
    id: 'soba',
    name: 'Soba Questionable',
    type: 'regular',
    rarity: 'Uncommon',
    image: '',
    catchAnswer: 'questionable',
    catchTime: 60000,
  },
  {
    id: 'rylan',
    name: 'Rylan Questionable',
    type: 'regular',
    rarity: 'Rare',
    image: '',
    catchAnswer: 'questionable',
    catchTime: 60000,
  },
  {
    id: 'star',
    name: 'Star Questionable',
    type: 'regular',
    rarity: 'Epic',
    image: '',
    catchAnswer: 'questionable',
    catchTime: 60000,
  },
  {
    id: 'captain',
    name: 'Captain Questionable',
    type: 'custom',
    rarity: 'Custom',
    image: '',
    catchAnswer: 'captain questionable',
    catchTime: 15000,
    spawnTitle: '👑 Captain Questionable appeared!',
    spawnText: '👑 Captain Questionable has arrived.\n\nUse `/catch captain questionable` before he leaves!',
    escapeText: '💨 Captain Questionable escaped before anyone could recruit him.',
    catchText: '⚓ {user} caught **Captain Questionable** before he escaped!'
  },
];

export function getQuestionableById(id) {
  return questionables.find(q => q.id === id);
}

export function getRandomQuestionable() {
  const regulars = questionables.filter(q => q.type === 'regular');
  return regulars[Math.floor(Math.random() * regulars.length)];
}
