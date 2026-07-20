export interface WordPair {
  word: string
  echo: string
  difficulty: 'easy' | 'normal' | 'hard'
  pack: 'mixed' | 'animals' | 'food' | 'nature' | 'objects' | 'fantasy'
}

const WORD_PAIRS: WordPair[] = [
  // ── ANIMALS ──
  { word: 'Dog', echo: 'Wolf', difficulty: 'easy', pack: 'animals' },
  { word: 'Cat', echo: 'Lion', difficulty: 'easy', pack: 'animals' },
  { word: 'Dolphin', echo: 'Whale', difficulty: 'easy', pack: 'animals' },
  { word: 'Rabbit', echo: 'Hare', difficulty: 'normal', pack: 'animals' },
  { word: 'Fox', echo: 'Coyote', difficulty: 'normal', pack: 'animals' },
  { word: 'Bear', echo: 'Boar', difficulty: 'normal', pack: 'animals' },
  { word: 'Penguin', echo: 'Puffin', difficulty: 'normal', pack: 'animals' },
  { word: 'Swan', echo: 'Goose', difficulty: 'normal', pack: 'animals' },
  { word: 'Eagle', echo: 'Hawk', difficulty: 'hard', pack: 'animals' },
  { word: 'Owl', echo: 'Raven', difficulty: 'hard', pack: 'animals' },
  { word: 'Shark', echo: 'Barracuda', difficulty: 'hard', pack: 'animals' },
  { word: 'Octopus', echo: 'Squid', difficulty: 'hard', pack: 'animals' },
  { word: 'Dragon', echo: 'Phoenix', difficulty: 'hard', pack: 'fantasy' },

  // ── FOOD ──
  { word: 'Apple', echo: 'Pear', difficulty: 'easy', pack: 'food' },
  { word: 'Coffee', echo: 'Tea', difficulty: 'easy', pack: 'food' },
  { word: 'Pizza', echo: 'Calzone', difficulty: 'easy', pack: 'food' },
  { word: 'Bread', echo: 'Cake', difficulty: 'normal', pack: 'food' },
  { word: 'Cheese', echo: 'Butter', difficulty: 'normal', pack: 'food' },
  { word: 'Wine', echo: 'Juice', difficulty: 'normal', pack: 'food' },
  { word: 'Chocolate', echo: 'Caramel', difficulty: 'normal', pack: 'food' },
  { word: 'Burger', echo: 'Sandwich', difficulty: 'normal', pack: 'food' },
  { word: 'Salad', echo: 'Soup', difficulty: 'normal', pack: 'food' },
  { word: 'Sushi', echo: 'Ramen', difficulty: 'normal', pack: 'food' },

  // ── NATURE ──
  { word: 'Sun', echo: 'Star', difficulty: 'easy', pack: 'nature' },
  { word: 'Fire', echo: 'Lava', difficulty: 'easy', pack: 'nature' },
  { word: 'Ice', echo: 'Frost', difficulty: 'easy', pack: 'nature' },
  { word: 'Rain', echo: 'Snow', difficulty: 'easy', pack: 'nature' },
  { word: 'River', echo: 'Lake', difficulty: 'easy', pack: 'nature' },
  { word: 'Ocean', echo: 'Sea', difficulty: 'easy', pack: 'nature' },
  { word: 'Desert', echo: 'Tundra', difficulty: 'easy', pack: 'nature' },
  { word: 'Mountain', echo: 'Hill', difficulty: 'normal', pack: 'nature' },
  { word: 'Forest', echo: 'Jungle', difficulty: 'normal', pack: 'nature' },
  { word: 'Storm', echo: 'Hurricane', difficulty: 'hard', pack: 'nature' },
  { word: 'Fog', echo: 'Mist', difficulty: 'hard', pack: 'nature' },
  { word: 'Dawn', echo: 'Dusk', difficulty: 'hard', pack: 'nature' },
  { word: 'Volcano', echo: 'Geyser', difficulty: 'hard', pack: 'nature' },
  { word: 'Earthquake', echo: 'Avalanche', difficulty: 'hard', pack: 'nature' },
  { word: 'Tornado', echo: 'Cyclone', difficulty: 'hard', pack: 'nature' },
  { word: 'Rainbow', echo: 'Aurora', difficulty: 'hard', pack: 'nature' },
  { word: 'Comet', echo: 'Meteor', difficulty: 'hard', pack: 'nature' },
  { word: 'Coral', echo: 'Anemone', difficulty: 'hard', pack: 'nature' },
  { word: 'Rose', echo: 'Tulip', difficulty: 'hard', pack: 'nature' },
  { word: 'Oak', echo: 'Maple', difficulty: 'hard', pack: 'nature' },
  { word: 'Bamboo', echo: 'Sugar Cane', difficulty: 'hard', pack: 'nature' },

  // ── OBJECTS ──
  { word: 'Car', echo: 'Truck', difficulty: 'easy', pack: 'objects' },
  { word: 'Chair', echo: 'Stool', difficulty: 'normal', pack: 'objects' },
  { word: 'House', echo: 'Cabin', difficulty: 'normal', pack: 'objects' },
  { word: 'City', echo: 'Town', difficulty: 'normal', pack: 'objects' },
  { word: 'Clock', echo: 'Watch', difficulty: 'hard', pack: 'objects' },
  { word: 'Map', echo: 'Compass', difficulty: 'hard', pack: 'objects' },
  { word: 'Book', echo: 'Scroll', difficulty: 'hard', pack: 'objects' },
  { word: 'Pen', echo: 'Pencil', difficulty: 'hard', pack: 'objects' },
  { word: 'Camera', echo: 'Telescope', difficulty: 'hard', pack: 'objects' },
  { word: 'Phone', echo: 'Radio', difficulty: 'hard', pack: 'objects' },
  { word: 'Computer', echo: 'Calculator', difficulty: 'hard', pack: 'objects' },
  { word: 'Lamp', echo: 'Candle', difficulty: 'hard', pack: 'objects' },
  { word: 'Mirror', echo: 'Glass', difficulty: 'hard', pack: 'objects' },
  { word: 'Key', echo: 'Lock', difficulty: 'normal', pack: 'objects' },
  { word: 'Door', echo: 'Window', difficulty: 'normal', pack: 'objects' },
  { word: 'Bridge', echo: 'Tunnel', difficulty: 'normal', pack: 'objects' },
  { word: 'Tower', echo: 'Castle', difficulty: 'normal', pack: 'objects' },
  { word: 'Pen', echo: 'Pencil', difficulty: 'hard', pack: 'objects' },
  { word: 'Blanket', echo: 'Towel', difficulty: 'hard', pack: 'objects' },
  { word: 'Pillow', echo: 'Cushion', difficulty: 'hard', pack: 'objects' },
  { word: 'Stone', echo: 'Pebble', difficulty: 'hard', pack: 'objects' },
  { word: 'Sand', echo: 'Dust', difficulty: 'hard', pack: 'objects' },
  { word: 'Ash', echo: 'Soot', difficulty: 'hard', pack: 'objects' },
  { word: 'Bubble', echo: 'Foam', difficulty: 'hard', pack: 'objects' },

  // ── FANTASY ──
  { word: 'Gold', echo: 'Silver', difficulty: 'easy', pack: 'fantasy' },
  { word: 'Crown', echo: 'Tiara', difficulty: 'normal', pack: 'fantasy' },
  { word: 'Dragon', echo: 'Phoenix', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Knight', echo: 'Samurai', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Wizard', echo: 'Alchemist', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Ghost', echo: 'Spirit', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Shadow', echo: 'Silhouette', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Crystal', echo: 'Gem', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Arrow', echo: 'Spear', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Shield', echo: 'Armor', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Wand', echo: 'Staff', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Spell', echo: 'Curse', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Treasure', echo: 'Artifact', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Maze', echo: 'Labyrinth', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Puzzle', echo: 'Riddle', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Whisper', echo: 'Murmur', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Laughter', echo: 'Smile', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Dream', echo: 'Nightmare', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Memory', echo: 'Diary', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Echo', echo: 'Reverb', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Prism', echo: 'Kaleidoscope', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Feather', echo: 'Wing', difficulty: 'hard', pack: 'fantasy' },
  { word: 'Nest', echo: 'Cave', difficulty: 'normal', pack: 'fantasy' },
]

export function getRandomWordPair(difficulty?: 'easy' | 'normal' | 'hard', pack?: string): WordPair {
  let pool = WORD_PAIRS
  if (difficulty) pool = pool.filter(p => p.difficulty === difficulty)
  if (pack && pack !== 'mixed') pool = pool.filter(p => p.pack === pack)
  if (pool.length === 0) pool = WORD_PAIRS
  return pool[Math.floor(Math.random() * pool.length)]
}
