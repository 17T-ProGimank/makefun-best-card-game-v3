// Pell's turn: play the best affordable cards, then attack with every ready creature.
// Heuristic: kill the enemy hero when possible; otherwise trade into the weakest
// enemy creature it can sink; otherwise hit the hero when the board is empty,
// or chip the weakest enemy creature.
// Deep Current (round 3): the first time Pell starts a turn (turn 2 or later)
// with an empty board and almost nothing in hand, he draws 2 extra cards,
// once per game — a catch-up when he is genuinely out of gas.
function takeAiTurn(game) {
  const side = game.enemy;
  if (game.turn >= 2 && !side.power2Used && side.board.length === 0 && side.hand.length <= 2) {
    side.power2Used = true;
    drawCard(game, side);
    drawCard(game, side);
    addLog(game, '🌊 Deep Current! Pell draws 2 cards. (Once per game.)');
  }
  // Play cards: biggest affordable first, while the board has room.
  let guard = 0;
  while (side.board.length < MAX_BOARD && guard++ < 12) {
    let best = -1;
    let bestCost = -1;
    for (let i = 0; i < side.hand.length; i++) {
      const card = CARD_BY_ID[side.hand[i]];
      if (card.cost <= side.bubbles && card.cost > bestCost) {
        best = i;
        bestCost = card.cost;
      }
    }
    if (best < 0) break;
    enemyPlayCard(game, best);
    if (game.phase !== 'playing') return;
  }
  // Attack with each ready creature.
  const attackers = side.board.filter(function (c) { return c.canAttack; });
  for (const attacker of attackers) {
    if (game.phase !== 'playing') return;
    if (side.board.indexOf(attacker) < 0) continue;
    if (attacker.atk >= game.player.tide) {
      attackHero(game, side, attacker, game.player);
      continue;
    }
    let prey = null;
    for (const target of game.player.board) {
      if (target.hp <= attacker.atk && (!prey || target.hp < prey.hp)) prey = target;
    }
    if (prey) {
      attackCreature(game, side, attacker, game.player, prey);
    } else if (game.player.board.length === 0) {
      attackHero(game, side, attacker, game.player);
    } else {
      let weakest = game.player.board[0];
      for (const target of game.player.board) {
        if (target.hp < weakest.hp) weakest = target;
      }
      attackCreature(game, side, attacker, game.player, weakest);
    }
  }
  addLog(game, 'Pell ends his turn.');
}
