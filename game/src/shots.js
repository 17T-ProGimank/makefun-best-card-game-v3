// Deterministic staged states for screenshots: ?shot=title|play|win|loss&seed=7.
// Each stage builds a real game state (no fake pixels) so the screenshots are
// true renders of the game's own code.
function stageShot(game, shot) {
  if (shot === 'title') {
    game.phase = 'title';
    addLog(game, 'Welcome to the tidepools. Press Start to begin.');
    return;
  }
  if (shot === 'play') {
    stageMidGame(game);
    return;
  }
  if (shot === 'win') {
    stageEndGame(game, true);
    return;
  }
  if (shot === 'loss') {
    stageEndGame(game, false);
    return;
  }
  game.phase = 'title';
}

function stageMidGame(game) {
  game.phase = 'playing';
  game.active = 'player';
  game.turn = 4;
  game.player.maxBubbles = 4;
  game.player.bubbles = 2;
  game.player.tide = 17;
  game.enemy.maxBubbles = 4;
  game.enemy.bubbles = 1;
  game.enemy.tide = 14;
  // Trim decks so the counts read like turn 4 (36-card deck, 3 opening + 4 draws).
  game.player.deck.length = 29;
  game.enemy.deck.length = 29;
  game.player.hand = ['dolphin', 'crab', 'otter', 'penguin', 'whale'];
  game.enemy.hand = ['eel', 'turtle', 'anemone', 'seagrass'];
  game.player.board = [
    makeCreature('octopus', 101),
    makeCreature('lobster', 102),
    makeCreature('brain', 103),
  ];
  game.player.board[0].canAttack = true;
  game.player.board[0].justPlayed = false;
  game.player.board[1].canAttack = true;
  game.player.board[1].justPlayed = false;
  game.player.board[2].canAttack = false;
  game.player.board[2].justPlayed = true;
  game.enemy.board = [makeCreature('turtle', 201), makeCreature('anemone', 202)];
  game.enemy.board[0].canAttack = false;
  game.enemy.board[0].justPlayed = false;
  game.enemy.board[1].canAttack = false;
  game.enemy.board[1].justPlayed = false;
  game.player.powerUsed = false;
  game.player.power2Used = false;
  game.enemy.powerUsed = false;
  game.enemy.power2Used = false;
  // The play shot shows a real tidepool round: Calm Water, drawn on turn 4,
  // with High Tide already forecast for the next round.
  game.tidepool = { id: 'calm', name: 'Calm Water', glyph: '💧', text: 'Calm Water — every creature heals 1.', turn: 4, applied: [] };
  game.tidepoolNext = TIDE_POOLS[0];
  game.tidepoolSeen = ['high', 'calm'];
  game.stats.tidepools = 2;
  game.log = [
    'Pell plays Anemone (1/4).',
    'Your Brain Coral arrives — tough as the reef itself.',
    'You play Octopus (3/4).',
    'Turn 4 — your move. +4 bubbles.',
    'Pell ends his turn.',
  ];
  game.stats.turns = 4;
  game.stats.played = 5;
  game.stats.damageDealt = 6;
  game.stats.killed = 1;
}

function stageEndGame(game, won) {
  game.phase = won ? 'won' : 'lost';
  game.winner = won ? 'player' : 'enemy';
  game.turn = 9;
  game.player.maxBubbles = 8;
  game.player.bubbles = won ? 3 : 0;
  game.enemy.maxBubbles = 8;
  game.enemy.bubbles = won ? 0 : 5;
  game.player.tide = won ? 11 : 0;
  game.enemy.tide = won ? 0 : 9;
  game.player.deck.length = 24;
  game.enemy.deck.length = 24;
  game.player.hand = won ? ['whale', 'eel'] : ['snail'];
  game.enemy.hand = won ? ['snail'] : ['whale', 'shark'];
  game.player.board = won
    ? [makeCreature('whale', 301), makeCreature('dolphin', 302)]
    : [makeCreature('turtle', 303)];
  game.enemy.board = won
    ? []
    : [makeCreature('kraken', 304), makeCreature('firecoral', 305)];
  // Both hero powers are spent by turn 9 — the duel was decided after them.
  game.player.powerUsed = true;
  game.player.power2Used = true;
  game.enemy.powerUsed = true;
  game.enemy.power2Used = true;
  // The end shots keep the tidepool banner honest: Calm Water on turn 9,
  // with Storm Surge forecast next.
  game.tidepool = { id: 'calm', name: 'Calm Water', glyph: '💧', text: 'Calm Water — every creature heals 1.', turn: 9, applied: [] };
  game.tidepoolNext = TIDE_POOLS[3];
  game.tidepoolSeen = ['storm', 'high', 'calm'];
  game.stats.tidepools = 3;
  for (const c of game.player.board.concat(game.enemy.board)) {
    c.canAttack = false;
    c.justPlayed = false;
  }
  game.log = won
    ? [
        'Your Blue Whale hits Pell for 8.',
        'Pell\u2019s tide runs dry — you win!',
        'You play Blue Whale (8/9).',
        'Turn 9 — your move. +8 bubbles.',
        'Pell ends his turn.',
      ]
    : [
        'Pell\u2019s Kraken hits you for 7.',
        'Your tide runs dry — Pell wins.',
        'Pell plays Kraken (7/7).',
        'Turn 9 — your move. +8 bubbles.',
        'You play Sea Turtle (2/7).',
      ];
  game.stats.turns = 9;
  game.stats.played = won ? 11 : 9;
  game.stats.damageDealt = won ? 20 : 11;
  game.stats.killed = won ? 6 : 4;
}
