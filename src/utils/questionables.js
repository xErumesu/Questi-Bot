export const questionables = [
  {
    id: 'leo',
    name: 'Leo Questionable',
    rarity: 'Common',
    image: 'PASTE_IMAGE_URL_HERE',
    catchAnswer: 'questionable',
  },
  {
    id: 'soba',
    name: 'Soba Questionable',
    rarity: 'Uncommon',
    image: 'PASTE_IMAGE_URL_HERE',
    catchAnswer: 'questionable',
  },
  {
    id: 'captain',
    name: 'Captain Questionable',
    rarity: 'Godly',
    image: 'PASTE_IMAGE_URL_HERE',
    catchAnswer: 'questionable',
  },
];

export function getQuestionableById(id) {
  return questionables.find(q => q.id === id);
}

export function getRandomQuestionable() {
  return questionables[Math.floor(Math.random() * questionables.length)];
}
