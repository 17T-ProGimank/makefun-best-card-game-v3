// Boot, buttons and keyboard for Tidepool Tussle.
let currentGame = null;

function readQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get('shot') || '',
    seed: Number(params.get('seed') || '7') || 7,
  };
}

function startDuel(game) {
  game.phase = 'playing';
  game.log = [];
  startPlayerTurn(game);
  selectedHand = -1;
  selectedAttacker = null;
  renderAll(game);
}

function restartGame(game) {
  const fresh = createGame((Math.random() * 1000000) | 0);
  const keepLog = game.log;
  Object.assign(game, fresh);
  game.log = keepLog;
  game.phase = 'playing';
  startPlayerTurn(game);
  selectedHand = -1;
  selectedAttacker = null;
  renderAll(game);
}

function bootGame() {
  const query = readQuery();
  currentGame = createGame(query.seed);
  document.getElementById('btn-end-turn').addEventListener('click', function () {
    if (currentGame.phase !== 'playing' || currentGame.active !== 'player') return;
    selectedHand = -1;
    selectedAttacker = null;
    endPlayerTurn(currentGame);
    renderAll(currentGame);
  });
  document.getElementById('btn-power').addEventListener('click', function () {
    if (usePlayerPower(currentGame)) renderAll(currentGame);
  });
  document.getElementById('btn-power2').addEventListener('click', function () {
    if (usePlayerPower2(currentGame)) renderAll(currentGame);
  });
  document.getElementById('btn-restart').addEventListener('click', function () {
    restartGame(currentGame);
  });
  document.getElementById('btn-rules').addEventListener('click', function () {
    showRulesOverlay(currentGame);
  });
  document.addEventListener('keydown', function (event) {
    const game = currentGame;
    if (event.key === 'Escape') {
      if (game.phase === 'playing') showRulesOverlay(game);
      return;
    }
    if (game.phase !== 'playing' || game.active !== 'player') {
      if (event.key === 'Enter' && game.phase === 'title') startDuel(game);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectedHand = -1;
      selectedAttacker = null;
      endPlayerTurn(game);
      renderAll(game);
      return;
    }
    if (event.key === 'p' || event.key === 'P') {
      if (usePlayerPower(game)) renderAll(game);
      return;
    }
    if (event.key === 'w' || event.key === 'W') {
      if (usePlayerPower2(game)) renderAll(game);
      return;
    }
    const num = Number(event.key);
    if (num >= 1 && num <= MAX_HAND) {
      const index = num - 1;
      if (index < game.player.hand.length) onHandCardClick(game, index);
    }
  });
  if (query.shot) stageShot(currentGame, query.shot);
  renderAll(currentGame);
}

document.addEventListener('DOMContentLoaded', bootGame);
