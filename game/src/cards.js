// Card database for Tidepool Tussle. Four families, told apart by colour AND glyph:
// wave (blue, droplet), shell (amber, shell), coral (rose, coral), kelp (green, leaf).
// Keywords: Swift — may attack the turn it is played. Splash — deals 1 to the enemy
// hero when the card is played.
// Round 2: 24 cards. New: Minnow, Dolphin (wave); Lobster, Shrimp (shell);
// Anemone, Fire Coral (coral); Glow Algae, Sea Otter (kelp).
// Round 3: 32 cards. New: Blue Whale, Penguin (wave); Pearl Oyster, Conch
// (shell); Brain Coral, Sea Fan (coral); Sea Lettuce, Sea Grass (kelp).
const FAMILIES = {
  wave: { name: 'Wave', glyph: '🌊', css: 'fam-wave' },
  shell: { name: 'Shell', glyph: '🐚', css: 'fam-shell' },
  coral: { name: 'Coral', glyph: '🪸', css: 'fam-coral' },
  kelp: { name: 'Kelp', glyph: '🌿', css: 'fam-kelp' },
};

// id, name, family, art, cost (bubbles), attack, health, keyword ('' | 'Swift' | 'Splash')
const CARD_LIST = [
  { id: 'crab', name: 'Hermit Crab', family: 'shell', art: '🦀', cost: 1, atk: 1, hp: 3, keyword: '' },
  { id: 'plankton', name: 'Plankton Swarm', family: 'kelp', art: '✨', cost: 1, atk: 2, hp: 1, keyword: '' },
  { id: 'snail', name: 'Tide Snail', family: 'shell', art: '🐌', cost: 1, atk: 1, hp: 4, keyword: '' },
  { id: 'starfish', name: 'Starfish', family: 'wave', art: '⭐', cost: 2, atk: 2, hp: 3, keyword: '' },
  { id: 'clownfish', name: 'Clownfish', family: 'wave', art: '🐠', cost: 2, atk: 3, hp: 2, keyword: '' },
  { id: 'urchin', name: 'Sea Urchin', family: 'coral', art: '🔱', cost: 2, atk: 1, hp: 4, keyword: 'Splash' },
  { id: 'jelly', name: 'Jellyfish', family: 'coral', art: '🪼', cost: 3, atk: 3, hp: 3, keyword: 'Splash' },
  { id: 'octopus', name: 'Octopus', family: 'wave', art: '🐙', cost: 3, atk: 3, hp: 4, keyword: '' },
  { id: 'eel', name: 'Moray Eel', family: 'coral', art: '🐍', cost: 3, atk: 4, hp: 2, keyword: 'Swift' },
  { id: 'turtle', name: 'Sea Turtle', family: 'shell', art: '🐢', cost: 4, atk: 2, hp: 7, keyword: '' },
  { id: 'manta', name: 'Manta Ray', family: 'wave', art: '🦋', cost: 4, atk: 4, hp: 4, keyword: 'Swift' },
  { id: 'puffer', name: 'Pufferfish', family: 'coral', art: '🐡', cost: 4, atk: 3, hp: 5, keyword: 'Splash' },
  { id: 'clam', name: 'Giant Clam', family: 'shell', art: '🦪', cost: 5, atk: 3, hp: 8, keyword: '' },
  { id: 'shark', name: 'Shark', family: 'coral', art: '🦈', cost: 5, atk: 6, hp: 4, keyword: '' },
  { id: 'kraken', name: 'Kraken', family: 'wave', art: '🦑', cost: 6, atk: 7, hp: 7, keyword: '' },
  { id: 'golem', name: 'Coral Golem', family: 'coral', art: '🗿', cost: 6, atk: 5, hp: 8, keyword: '' },
  { id: 'minnow', name: 'Minnow', family: 'wave', art: '🐟', cost: 1, atk: 1, hp: 1, keyword: 'Swift' },
  { id: 'shrimp', name: 'Pepper Shrimp', family: 'shell', art: '🦐', cost: 2, atk: 3, hp: 1, keyword: 'Swift' },
  { id: 'anemone', name: 'Anemone', family: 'coral', art: '🌺', cost: 2, atk: 1, hp: 4, keyword: 'Splash' },
  { id: 'glow', name: 'Glow Algae', family: 'kelp', art: '🌟', cost: 2, atk: 2, hp: 2, keyword: 'Splash' },
  { id: 'otter', name: 'Sea Otter', family: 'kelp', art: '🦦', cost: 3, atk: 3, hp: 3, keyword: 'Swift' },
  { id: 'lobster', name: 'Lobster', family: 'shell', art: '🦞', cost: 4, atk: 4, hp: 3, keyword: '' },
  { id: 'dolphin', name: 'Dolphin', family: 'wave', art: '🐬', cost: 5, atk: 5, hp: 5, keyword: 'Swift' },
  { id: 'firecoral', name: 'Fire Coral', family: 'coral', art: '🔥', cost: 5, atk: 4, hp: 5, keyword: 'Splash' },
  { id: 'penguin', name: 'Penguin', family: 'wave', art: '🐧', cost: 3, atk: 2, hp: 4, keyword: 'Swift' },
  { id: 'seagrass', name: 'Sea Grass', family: 'kelp', art: '🌱', cost: 1, atk: 2, hp: 2, keyword: 'Swift' },
  { id: 'pearl', name: 'Pearl Oyster', family: 'shell', art: '💎', cost: 2, atk: 1, hp: 5, keyword: '' },
  { id: 'conch', name: 'Conch', family: 'shell', art: '🐚', cost: 3, atk: 2, hp: 5, keyword: 'Splash' },
  { id: 'brain', name: 'Brain Coral', family: 'coral', art: '🧠', cost: 3, atk: 2, hp: 6, keyword: '' },
  { id: 'seafan', name: 'Sea Fan', family: 'coral', art: '🪭', cost: 4, atk: 3, hp: 4, keyword: 'Splash' },
  { id: 'lettuce', name: 'Sea Lettuce', family: 'kelp', art: '🥬', cost: 2, atk: 2, hp: 3, keyword: '' },
  { id: 'whale', name: 'Blue Whale', family: 'wave', art: '🐳', cost: 7, atk: 8, hp: 9, keyword: '' },
];

const CARD_BY_ID = {};
for (const card of CARD_LIST) CARD_BY_ID[card.id] = card;

// The 36-card deck every side plays: one copy of each of the 32 creatures,
// plus a second copy of the four cheapest, so early turns stay lively.
const DECK_RECIPE = [
  'crab', 'crab', 'plankton', 'plankton', 'snail', 'snail', 'minnow', 'minnow',
  'seagrass', 'starfish', 'clownfish', 'urchin', 'jelly', 'pearl', 'lettuce',
  'octopus', 'eel', 'shrimp', 'anemone', 'glow', 'otter', 'penguin', 'brain',
  'conch', 'turtle', 'manta', 'puffer', 'lobster', 'seafan', 'clam', 'shark',
  'dolphin', 'firecoral', 'kraken', 'golem', 'whale',
];

function buildDeck(rng) {
  return shuffleDeck(DECK_RECIPE, rng);
}

function makeCreature(cardId, uid) {
  const base = CARD_BY_ID[cardId];
  return {
    uid: uid,
    id: base.id,
    name: base.name,
    family: base.family,
    art: base.art,
    cost: base.cost,
    atk: base.atk,
    hp: base.hp,
    maxHp: base.hp,
    keyword: base.keyword,
    canAttack: base.keyword === 'Swift',
    justPlayed: true,
  };
}
