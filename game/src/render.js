// DOM rendering for Tidepool Tussle: heroes, hands, boards, bubbles, log, overlays.
// The selection lives here: selectedHand (index) or selectedAttacker (creature).

let selectedHand = -1;
let selectedAttacker = null;

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function buildCardElement(card, opts) {
  const fam = FAMILIES[card.family];
  const node = el('div', 'card ' + fam.css);
  node.appendChild(el('div', 'cost', String(card.cost)));
  node.appendChild(el('div', 'family ' + fam.css, fam.glyph + ' ' + fam.name));
  node.appendChild(el('div', 'art', card.art));
  node.appendChild(el('div', 'name', card.name));
  if (card.keyword) node.appendChild(el('div', 'keyword', card.keyword));
  const stats = el('div', 'stats');
  stats.appendChild(el('span', 'atk', '⚔ ' + card.atk));
  stats.appendChild(el('span', 'hp', '♥ ' + card.hp));
  node.appendChild(stats);
  if (opts && opts.onClick) node.addEventListener('click', opts.onClick);
  node.addEventListener('mouseenter', function (event) { showCardTooltip(card, event.clientX, event.clientY); });
  node.addEventListener('mousemove', function (event) { moveCardTooltip(event.clientX, event.clientY); });
  node.addEventListener('mouseleave', hideCardTooltip);
  return node;
}

function buildBoardCardElement(game, creature, side) {
  const classes = [];
  const isPlayer = side === game.player;
  if (isPlayer && game.active === 'player' && game.phase === 'playing') {
    if (creature.canAttack) classes.push('ready');
    if (selectedAttacker === creature) classes.push('selected');
  }
  if (creature.justPlayed && !creature.canAttack) classes.push('sick');
  if (selectedAttacker && !isPlayer) classes.push('targetable');
  const node = buildCardElement(creature, {
    onClick: function () { onBoardCardClick(game, creature, side); },
  });
  for (const c of classes) node.classList.add(c);
  if (creature.justPlayed) {
    node.classList.add('just-played');
    creature.justPlayed = false;
  }
  return node;
}

// Card tooltips (round 3 fix): hovering any card — in the hand or on the
// board — shows what it does, so the keywords never need guessing. The
// tooltip follows the cursor and hides the moment it leaves the card.
const KEYWORD_RULES = {
  Swift: 'Swift — this creature can attack the turn it is played.',
  Splash: 'Splash — deals 1 damage to the enemy hero the moment it is played.',
};

const FAMILY_RULES = {
  wave: 'Wave — balanced creatures of the open water.',
  shell: 'Shell — tough creatures that hold the line.',
  coral: 'Coral — fierce creatures that hit hard.',
  kelp: 'Kelp — quick creatures that grow fast.',
};

function cardTooltipText(card) {
  if (card.keyword && KEYWORD_RULES[card.keyword]) return KEYWORD_RULES[card.keyword];
  return FAMILY_RULES[card.family] || '';
}

function showCardTooltip(card, x, y) {
  const tip = document.getElementById('tooltip');
  tip.innerHTML = '';
  tip.appendChild(el('div', 'tip-name', card.art + ' ' + card.name));
  tip.appendChild(el('div', 'tip-stats', 'Cost ' + card.cost + ' · ⚔ ' + card.atk + ' · ♥ ' + card.hp + ' · ' + FAMILIES[card.family].name));
  tip.appendChild(el('div', 'tip-rule', cardTooltipText(card)));
  tip.classList.add('show');
  moveCardTooltip(x, y);
}

function moveCardTooltip(x, y) {
  const tip = document.getElementById('tooltip');
  if (!tip.classList.contains('show')) return;
  const left = Math.max(8, Math.min(x + 14, window.innerWidth - 248));
  const top = Math.max(8, Math.min(y + 16, window.innerHeight - 110));
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

function hideCardTooltip() {
  document.getElementById('tooltip').classList.remove('show');
}

function renderHero(game, side, isPlayer) {
  const tideEl = document.getElementById(isPlayer ? 'player-tide' : 'enemy-tide');
  const fillEl = document.getElementById(isPlayer ? 'player-tide-fill' : 'enemy-tide-fill');
  const deckEl = document.getElementById(isPlayer ? 'player-deck' : 'enemy-deck');
  tideEl.textContent = String(side.tide);
  fillEl.style.width = Math.max(0, (side.tide / side.maxTide) * 100) + '%';
  deckEl.textContent = String(side.deck.length);
  const heroEl = document.getElementById(isPlayer ? 'player-hero' : 'enemy-hero');
  heroEl.classList.toggle(
    'targetable',
    !isPlayer && !!selectedAttacker && game.phase === 'playing' && game.active === 'player',
  );
  if (!isPlayer) {
    heroEl.onclick = function () {
      if (selectedAttacker) attackHero(game, game.player, selectedAttacker, game.enemy);
    };
  }
}

function renderHand(game, side, isPlayer) {
  const handEl = document.getElementById(isPlayer ? 'player-hand' : 'enemy-hand');
  handEl.innerHTML = '';
  if (!isPlayer) {
    for (let i = 0; i < side.hand.length; i++) handEl.appendChild(el('div', 'card-back'));
    return;
  }
  side.hand.forEach(function (cardId, index) {
    const base = CARD_BY_ID[cardId];
    const node = buildCardElement(base, {
      onClick: function () { onHandCardClick(game, index); },
    });
    if (index === selectedHand) node.classList.add('selected');
    if (!canPlayCard(game, index)) node.classList.add('unaffordable');
    handEl.appendChild(node);
  });
}

function renderBoard(game, side, isPlayer) {
  const boardEl = document.getElementById(isPlayer ? 'player-board' : 'enemy-board');
  boardEl.innerHTML = '';
  if (side.board.length === 0) {
    boardEl.appendChild(el('div', 'empty-note', isPlayer ? 'Your creatures gather here' : 'No enemy creatures yet'));
    return;
  }
  for (const creature of side.board) {
    boardEl.appendChild(buildBoardCardElement(game, creature, side));
  }
}

function renderBubbles(game) {
  const wrap = document.getElementById('bubbles');
  wrap.innerHTML = '';
  const side = game.player;
  for (let i = 0; i < side.maxBubbles; i++) {
    const bubble = el('span', i < side.bubbles ? '' : 'spent', '🫧');
    wrap.appendChild(bubble);
  }
  wrap.appendChild(el('span', '', ' ' + side.bubbles + '/' + side.maxBubbles + ' bubbles'));
}

function renderLog(game) {
  const logEl = document.getElementById('log');
  logEl.innerHTML = '';
  for (const line of game.log) {
    logEl.appendChild(el('div', '', line));
  }
}

// The tidepool banner (round 3 fix): the round's effect, in plain words,
// plus the next effect already drawn, so both sides can plan around the
// tide that is coming. Before the first round it says what is coming.
function renderTidepool(game) {
  const banner = document.getElementById('tidepool-banner');
  const pool = game.tidepool;
  if (!pool) {
    banner.textContent = '🌊 The tidepools shift every round — a new tidepool effect at the start of each turn.';
    banner.classList.add('idle');
    return;
  }
  banner.classList.remove('idle');
  const next = game.tidepoolNext;
  const forecast = next ? ' · Next: ' + next.glyph + ' ' + next.name : '';
  banner.textContent = pool.glyph + ' Tidepool, round ' + pool.turn + ': ' + pool.text + forecast;
}

function renderPower(game) {
  const btn = document.getElementById('btn-power');
  const used = game.player.powerUsed;
  btn.disabled = used || game.phase !== 'playing' || game.active !== 'player';
  btn.textContent = used ? '🌊 Tide Surge (spent)' : '🌊 Tide Surge (once) · +2 bubbles, +2 Tide';
  const btn2 = document.getElementById('btn-power2');
  const used2 = game.player.power2Used;
  btn2.disabled = used2 || game.phase !== 'playing' || game.active !== 'player';
  btn2.textContent = used2 ? '🪸 Reef Wall (spent)' : '🪸 Reef Wall (once) · heal all your creatures';
  const status = document.getElementById('enemy-power');
  const blessing = game.enemy.powerUsed ? '👑 Royal Blessing: spent' : '👑 Royal Blessing: ready (fires at 12 Tide)';
  const current = game.enemy.power2Used ? '🌊 Deep Current: spent' : '🌊 Deep Current: ready (fires when his board is empty)';
  status.textContent = blessing + ' · ' + current;
  status.classList.toggle('spent', game.enemy.powerUsed && game.enemy.power2Used);
}

function renderTurn(game) {
  const banner = document.getElementById('turn-banner');
  const endBtn = document.getElementById('btn-end-turn');
  if (game.phase === 'won') banner.textContent = 'You win! 🏆';
  else if (game.phase === 'lost') banner.textContent = 'Pell wins this tide.';
  else if (game.active === 'player') banner.textContent = 'Your turn — turn ' + game.turn;
  else banner.textContent = 'Pell is thinking…';
  endBtn.disabled = !(game.phase === 'playing' && game.active === 'player');
  endBtn.textContent = game.phase === 'playing' ? 'End turn ⏎' : '—';
}

function renderAll(game) {
  renderHero(game, game.enemy, false);
  renderHero(game, game.player, true);
  renderHand(game, game.enemy, false);
  renderHand(game, game.player, true);
  renderBoard(game, game.enemy, false);
  renderBoard(game, game.player, true);
  renderBubbles(game);
  renderPower(game);
  renderLog(game);
  renderTidepool(game);
  renderTurn(game);
  if (game.phase === 'title') showTitleOverlay(game);
  else if (game.phase === 'won') showEndOverlay(game, true);
  else if (game.phase === 'lost') showEndOverlay(game, false);
  else hideOverlay();
}

function onHandCardClick(game, index) {
  if (game.phase !== 'playing' || game.active !== 'player') return;
  if (canPlayCard(game, index)) {
    selectedHand = -1;
    selectedAttacker = null;
    playCard(game, index);
  } else {
    selectedHand = index;
  }
  renderAll(game);
}

function onBoardCardClick(game, creature, side) {
  if (game.phase !== 'playing' || game.active !== 'player') return;
  if (side === game.player) {
    if (creature.canAttack) {
      selectedAttacker = selectedAttacker === creature ? null : creature;
      selectedHand = -1;
    }
  } else if (selectedAttacker) {
    const attacker = selectedAttacker;
    selectedAttacker = null;
    attackCreature(game, game.player, attacker, game.enemy, creature);
  }
  renderAll(game);
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function showOverlay(html) {
  const card = document.getElementById('overlay-card');
  card.innerHTML = '';
  card.appendChild(html);
  document.getElementById('overlay').classList.add('show');
}

function showTitleOverlay(game) {
  const wrap = el('div');
  wrap.appendChild(el('h1', '', '🌊 TIDEPOOL TUSSLE'));
  wrap.appendChild(el('h2', '', 'A duel of the tidepools — you vs Pell, King of the Tidepools · 32 creatures · two hero powers each'));
  const rules = el('ul', 'rules');
  const lines = [
    'Both guardians start with 20 Tide. Reduce Pell\u2019s Tide to 0 and you win. Pell goes second, so he opens with 4 cards to your 3.',
    'Each turn you gain bubbles: turn 1 gives 1, turn 2 gives 2, up to 8. Bubbles refill every turn.',
    'Click a card in your hand to play it if you can afford its cost. Creatures wait a turn before they can attack — unless they are Swift.',
    'Click one of your ready creatures, then click an enemy creature or Pell himself to attack. Creatures strike back when attacked.',
    'Splash cards deal 1 damage to the enemy hero the moment they are played.',
    'Every round a tidepool effect is drawn — High Tide, Calm Water, Kelp Bloom or Storm Surge — and hits both sides alike. The banner above the table shows this round\u2019s effect and the next one, drawn a round ahead.',
    'Hero powers, once per game each: your Tide Surge (button, or P) gives +2 bubbles and +2 Tide. Your Reef Wall (button, or W) heals all your creatures to full health. Pell\u2019s Royal Blessing fires on its own the first time his Tide drops to 12 — he restores 5. Pell\u2019s Deep Current fires on its own the first time he starts a turn with an empty board and almost nothing in hand — he draws 2 cards.',
    'Empty deck? The deep claims 1 Tide, then 2, then 3, and so on — no duel drags forever.',
    'Keys: 1–7 play a hand card · P uses Tide Surge · W uses Reef Wall · Enter ends your turn · Esc returns here.',
  ];
  for (const line of lines) rules.appendChild(el('li', '', line));
  wrap.appendChild(rules);
  const btn = el('button', 'big-btn', '▶ Start the duel');
  btn.addEventListener('click', function () { startDuel(game); });
  wrap.appendChild(btn);
  showOverlay(wrap);
}

function showEndOverlay(game, won) {
  const wrap = el('div');
  const title = el('h1', won ? 'win-title' : 'lose-title', won ? '🏆 YOU WIN!' : '🌊 PELL WINS');
  wrap.appendChild(title);
  wrap.appendChild(el('h2', '', won
    ? 'The tidepools are yours. Pell bows out with a grumble.'
    : 'Pell keeps the pools this time. The tide will turn.'));
  wrap.appendChild(el('div', 'stat-line', 'Turns played: ' + game.stats.turns));
  wrap.appendChild(el('div', 'stat-line', 'Creatures summoned: ' + game.stats.played));
  wrap.appendChild(el('div', 'stat-line', 'Damage dealt: ' + game.stats.damageDealt + ' · Enemy creatures sunk: ' + game.stats.killed));
  wrap.appendChild(el('div', 'stat-line', 'Tidepool effects this game: ' + (game.stats.tidepools || 0)));
  const btn = el('button', 'big-btn', '↻ Play again');
  btn.addEventListener('click', function () { restartGame(game); });
  wrap.appendChild(btn);
  showOverlay(wrap);
}

function showRulesOverlay(game) {
  const wrap = el('div');
  wrap.appendChild(el('h1', '', 'HOW TO PLAY'));
  const rules = el('ul', 'rules');
  const lines = [
    'Goal: reduce Pell\u2019s Tide from 20 to 0 before he does the same to you.',
    'Bubbles are your energy. Turn N gives N bubbles (max 8); they refill each turn.',
    'Play a card by clicking it. A creature cannot attack the turn it arrives, unless it is Swift.',
    'Attack: click your ready creature, then click an enemy creature or Pell.',
    'Splash: the card deals 1 damage to the enemy hero as soon as it is played.',
    'Tidepool: one of four effects is drawn every round — High Tide (+1 attack to all Wave), Calm Water (every creature heals 1), Kelp Bloom (+1 health to all Kelp), Storm Surge (every creature takes 1 damage) — and the banner forecasts the next one a round ahead.',
    'Hero powers, once per game each: Tide Surge (+2 bubbles, +2 Tide) and Reef Wall (heal all your creatures to full). Pell has Royal Blessing (restores 5 Tide at 12) and Deep Current (draws 2 cards when his board is empty and his hand is nearly empty).',
    'Empty deck: the deep claims 1 Tide, then 2, then 3, and so on.',
    'Families: 🌊 Wave (balanced) · 🐚 Shell (tough) · 🪸 Coral (fierce) · 🌿 Kelp (quick).',
    'Keys: 1–7 play a hand card · P Tide Surge · W Reef Wall · Enter ends your turn · Esc shows this help.',
  ];
  for (const line of lines) rules.appendChild(el('li', '', line));
  wrap.appendChild(rules);
  const btn = el('button', 'big-btn', 'Back to the table');
  btn.addEventListener('click', function () { renderAll(game); });
  wrap.appendChild(btn);
  showOverlay(wrap);
}
