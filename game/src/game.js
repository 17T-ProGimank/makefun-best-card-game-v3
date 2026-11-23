// Game state and rules for Tidepool Tussle.
// A side: { tide, maxTide, deck, hand, board, bubbles, maxBubbles, fatigue,
//   powerUsed, power2Used }.
// A game: { seed, rng, player, enemy, turn, phase, winner, log, stats, uidCounter }.
// phase: 'title' | 'playing' | 'won' | 'lost'. turn: 'player' | 'enemy'.
// Hero powers (round 2): the player may call Tide Surge once per game on their
// turn — +2 bubbles and +2 Tide. Pell's Royal Blessing fires once, on its own,
// the first time his Tide drops to 12 or below — +5 Tide.
// Second powers (round 3): the player's Reef Wall heals all their creatures
// to full health, once per game. Pell's Deep Current fires once, on its own,
// the first time he starts a turn (turn 2 or later) with an empty board and
// almost nothing in hand — he draws 2 extra cards.
// Tidepool terrain (round 3 fix): at the start of every round a tidepool
// effect is drawn from a deck of four and shapes that round. The effects
// are symmetric — they hit both sides alike — so they add decisions without
// handing either side the game. Calm Water and Storm Surge resolve at once;
// High Tide and Kelp Bloom last the round and are undone when the next
// effect is drawn, so no bonus ever outlives its round. The next effect is
// drawn one round ahead and shown in the banner, so both sides can plan
// around the tide that is coming.

const START_TIDE = 20;
const MAX_BOARD = 5;
const MAX_HAND = 7;
const MAX_BUBBLES = 8;
const OPENING_HAND = 3;
// Pell goes second, so he opens with one extra card — the second player's
// catch-up. Without it the first move is worth about 20 points of win rate.
const OPENING_HAND_ENEMY = 4;

function makeSide(rng) {
  return {
    tide: START_TIDE,
    maxTide: START_TIDE,
    deck: buildDeck(rng),
    hand: [],
    board: [],
    bubbles: 0,
    maxBubbles: 0,
    fatigue: 0,
    powerUsed: false,
    power2Used: false,
  };
}

function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed: seed,
    rng: rng,
    player: makeSide(rng),
    enemy: makeSide(rng),
    turn: 1,
    phase: 'title',
    active: 'player',
    winner: null,
    log: [],
    stats: { turns: 0, played: 0, damageDealt: 0, killed: 0, tidepools: 0 },
    uidCounter: 1,
    tidepool: null,
    tidepoolNext: null,
    tidepoolSeen: [],
  };
  for (let i = 0; i < OPENING_HAND; i++) drawCard(game, game.player);
  for (let i = 0; i < OPENING_HAND_ENEMY; i++) drawCard(game, game.enemy);
  return game;
}

function addLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 5) game.log.length = 5;
}

// The four tidepool effects, drawn one per round. Each carries the glyph
// and the line the banner shows, so the table and the log always agree.
const TIDE_POOLS = [
  { id: 'high', name: 'High Tide', glyph: '🌊', text: 'High Tide — all Wave creatures +1 attack this round.' },
  { id: 'calm', name: 'Calm Water', glyph: '💧', text: 'Calm Water — every creature heals 1.' },
  { id: 'kelp', name: 'Kelp Bloom', glyph: '🌿', text: 'Kelp Bloom — all Kelp creatures +1 health this round.' },
  { id: 'storm', name: 'Storm Surge', glyph: '⛈️', text: 'Storm Surge — every creature takes 1 damage.' },
];

// Draw the round's tidepool effect, undoing the previous round's turn-long
// effect first. The next effect is drawn a round ahead and kept in
// game.tidepoolNext, so the banner can forecast it honestly.
function drawTidepool(game) {
  if (game.tidepool) undoTidepool(game, game.tidepool);
  const pool = game.tidepoolNext || TIDE_POOLS[Math.floor(game.rng() * TIDE_POOLS.length)];
  game.tidepoolNext = TIDE_POOLS[Math.floor(game.rng() * TIDE_POOLS.length)];
  game.tidepool = {
    id: pool.id,
    name: pool.name,
    glyph: pool.glyph,
    text: pool.text,
    turn: game.turn,
    applied: [],
  };
  game.tidepoolSeen.push(pool.id);
  game.stats.tidepools += 1;
  applyTidepool(game, game.tidepool);
  addLog(game, pool.glyph + ' ' + pool.text);
  return game.tidepool;
}

// Resolve a drawn effect against both boards alike.
function applyTidepool(game, pool) {
  const both = game.player.board.concat(game.enemy.board);
  if (pool.id === 'calm') {
    for (const creature of both) creature.hp = Math.min(creature.maxHp, creature.hp + 1);
    return;
  }
  if (pool.id === 'storm') {
    for (const creature of both) creature.hp -= 1;
    sweepDeadCreatures(game, game.player, 'The storm surge sinks ');
    sweepDeadCreatures(game, game.enemy, 'The storm surge sinks ');
    return;
  }
  if (pool.id === 'high') {
    for (const creature of both) {
      if (creature.family !== 'wave') continue;
      creature.atk += 1;
      pool.applied.push(creature.uid);
    }
    return;
  }
  // Kelp Bloom: +1 health this round, on the card and its ceiling together.
  for (const creature of both) {
    if (creature.family !== 'kelp') continue;
    creature.maxHp += 1;
    creature.hp += 1;
    pool.applied.push(creature.uid);
  }
}

// Take back a turn-long effect at the end of its round. The undo never
// sinks a creature: a buffed creature keeps at least 1 health when its
// borrowed health is handed back.
function undoTidepool(game, pool) {
  if (pool.id !== 'high' && pool.id !== 'kelp') return;
  const both = game.player.board.concat(game.enemy.board);
  for (const creature of both) {
    if (pool.applied.indexOf(creature.uid) < 0) continue;
    if (pool.id === 'high') creature.atk -= 1;
    else {
      creature.maxHp -= 1;
      creature.hp = Math.max(1, creature.hp - 1);
    }
  }
}

// Drop every creature at 0 health or below from a board, naming each one.
function sweepDeadCreatures(game, side, lead) {
  const dead = side.board.filter(function (creature) { return creature.hp <= 0; });
  for (const creature of dead) {
    removeCreature(side, creature);
    addLog(game, lead + creature.name + '.');
    if (side === game.enemy) game.stats.killed += 1;
  }
}

function drawCard(game, side) {
  if (side.deck.length === 0) {
    // Fatigue: an empty deck claims 1 Tide, then 2, then 3, and so on,
    // so no game can stall forever once both decks run dry.
    side.fatigue += 1;
    const who = side === game.player ? 'you' : 'Pell';
    dealHeroDamage(game, side, side.fatigue, 'The deep claims ' + side.fatigue + ' Tide from ' + who + ' — empty deck.');
    return null;
  }
  const id = side.deck.pop();
  if (side.hand.length >= MAX_HAND) return null;
  side.hand.push(id);
  return id;
}

function startPlayerTurn(game) {
  const side = game.player;
  drawTidepool(game);
  side.maxBubbles = Math.min(MAX_BUBBLES, game.turn);
  side.bubbles = side.maxBubbles;
  for (const creature of side.board) creature.canAttack = true;
  drawCard(game, side);
  game.active = 'player';
  game.stats.turns = game.turn;
  addLog(game, 'Turn ' + game.turn + ' — your move. +' + side.maxBubbles + ' bubbles.');
}

function canPlayCard(game, handIndex) {
  if (game.phase !== 'playing' || game.active !== 'player') return false;
  const side = game.player;
  if (handIndex < 0 || handIndex >= side.hand.length) return false;
  if (side.board.length >= MAX_BOARD) return false;
  return side.bubbles >= CARD_BY_ID[side.hand[handIndex]].cost;
}

function playCard(game, handIndex) {
  if (!canPlayCard(game, handIndex)) return false;
  const side = game.player;
  const id = side.hand.splice(handIndex, 1)[0];
  const base = CARD_BY_ID[id];
  side.bubbles -= base.cost;
  const creature = makeCreature(id, game.uidCounter++);
  creature.justPlayed = true;
  side.board.push(creature);
  game.stats.played += 1;
  addLog(game, 'You play ' + base.name + ' (' + base.atk + '/' + base.hp + ').');
  if (base.keyword === 'Splash') {
    dealHeroDamage(game, game.enemy, 1, base.name + ' splashes Pell for 1.');
  }
  return true;
}

function enemyPlayCard(game, handIndex) {
  const side = game.enemy;
  const id = side.hand.splice(handIndex, 1)[0];
  const base = CARD_BY_ID[id];
  side.bubbles -= base.cost;
  const creature = makeCreature(id, game.uidCounter++);
  creature.justPlayed = true;
  side.board.push(creature);
  addLog(game, 'Pell plays ' + base.name + ' (' + base.atk + '/' + base.hp + ').');
  if (base.keyword === 'Splash') {
    dealHeroDamage(game, game.player, 1, base.name + ' splashes you for 1.');
  }
}

function usePlayerPower(game) {
  if (game.phase !== 'playing' || game.active !== 'player') return false;
  const side = game.player;
  if (side.powerUsed) return false;
  side.powerUsed = true;
  side.bubbles = Math.min(side.bubbles + 2, 10);
  side.tide = Math.min(side.maxTide, side.tide + 2);
  addLog(game, '🌊 Tide Surge! +2 bubbles, +2 Tide. (Once per game.)');
  return true;
}

// Reef Wall (round 3): heal every creature on your board to full health.
function usePlayerPower2(game) {
  if (game.phase !== 'playing' || game.active !== 'player') return false;
  const side = game.player;
  if (side.power2Used) return false;
  side.power2Used = true;
  for (const creature of side.board) creature.hp = creature.maxHp;
  addLog(game, '🪸 Reef Wall! All your creatures are healed to full. (Once per game.)');
  return true;
}

function maybeTriggerPellPower(game) {
  const side = game.enemy;
  if (game.phase !== 'playing' || side.powerUsed) return;
  if (side.tide > 12) return;
  side.powerUsed = true;
  side.tide = Math.min(side.maxTide, side.tide + 5);
  addLog(game, '👑 Royal Blessing! Pell restores 5 Tide. (Once per game.)');
}

function dealHeroDamage(game, side, amount, logText) {
  side.tide = Math.max(0, side.tide - amount);
  if (logText) addLog(game, logText);
  if (side === game.player) game.stats.damageTaken = (game.stats.damageTaken || 0) + amount;
  else game.stats.damageDealt += amount;
  if (side === game.enemy) maybeTriggerPellPower(game);
  checkEnd(game);
}

function attackCreature(game, attackerSide, attacker, targetSide, target) {
  target.hp -= attacker.atk;
  attacker.hp -= target.atk;
  attacker.canAttack = false;
  addLog(game, attacker.name + ' hits ' + target.name + ' for ' + attacker.atk + '.');
  if (target.hp <= 0) {
    removeCreature(targetSide, target);
    addLog(game, target.name + ' sinks to the deep.');
    if (attackerSide === game.player) game.stats.killed += 1;
  }
  if (attacker.hp <= 0) {
    removeCreature(attackerSide, attacker);
    addLog(game, attacker.name + ' sinks to the deep.');
  }
  checkEnd(game);
}

function attackHero(game, attackerSide, attacker, targetSide) {
  targetSide.tide = Math.max(0, targetSide.tide - attacker.atk);
  attacker.canAttack = false;
  const who = attackerSide === game.player ? 'You hit Pell' : 'Pell hits you';
  addLog(game, who + ' for ' + attacker.atk + ' with ' + attacker.name + '.');
  if (attackerSide === game.player) game.stats.damageDealt += attacker.atk;
  if (targetSide === game.enemy) maybeTriggerPellPower(game);
  checkEnd(game);
}

function removeCreature(side, creature) {
  const i = side.board.indexOf(creature);
  if (i >= 0) side.board.splice(i, 1);
}

function checkEnd(game) {
  if (game.phase !== 'playing') return;
  if (game.enemy.tide <= 0) {
    game.phase = 'won';
    game.winner = 'player';
    addLog(game, 'Pell\u2019s tide runs dry — you win!');
  } else if (game.player.tide <= 0) {
    game.phase = 'lost';
    game.winner = 'enemy';
    addLog(game, 'Your tide runs dry — Pell wins.');
  }
}

function endPlayerTurn(game) {
  if (game.phase !== 'playing' || game.active !== 'player') return;
  game.active = 'enemy';
  const side = game.enemy;
  side.maxBubbles = Math.min(MAX_BUBBLES, game.turn);
  side.bubbles = side.maxBubbles;
  for (const creature of side.board) creature.canAttack = true;
  drawCard(game, side);
  takeAiTurn(game);
  if (game.phase !== 'playing') return;
  game.turn += 1;
  startPlayerTurn(game);
}
