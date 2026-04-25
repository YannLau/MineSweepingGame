const NUMBER_COLORS = [
  '',           // 0 (unused)
  '#4fc3f7',    // 1 - blue
  '#81c784',    // 2 - green
  '#ffb74d',    // 3 - orange
  '#ce93d8',    // 4 - purple
  '#f48fb1',    // 5 - pink
  '#4dd0e1',    // 6 - cyan
  '#fff176',    // 7 - yellow
  '#b0bec5'     // 8 - gray
];

function renderBoard(game, container) {
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${game.rows}, 1fr)`;

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.board[r][c];
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;

      if (cell.isRevealed) {
        cellEl.classList.add('revealed');
        if (cell.isMine) {
          cellEl.classList.add('mine');
          cellEl.textContent = '\uD83D\uDCA3';
        } else if (cell.adjacentMines > 0) {
          cellEl.textContent = cell.adjacentMines;
          cellEl.style.color = NUMBER_COLORS[cell.adjacentMines];
        }
      } else if (cell.isFlagged) {
        cellEl.classList.add('flagged');
        cellEl.textContent = '\uD83D\uDEA9';
      }

      if (game.cheatMode && !cell.isRevealed && cell.isMine) {
        cellEl.classList.add('cheat-mine');
      }

      container.appendChild(cellEl);
    }
  }
}

function updateMineCounter(game, element) {
  const remaining = game.numMines - game.flagCount;
  element.textContent = `\uD83D\uDCA3 ${remaining}`;
}

function updateTimer(game, element) {
  const elapsed = Math.floor(game.getElapsedTime());
  element.textContent = `\u23F1 ${elapsed}`;
}

function showMessage(container, text, type) {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.textContent = text;
  container.appendChild(msg);
  setTimeout(function () { msg.remove(); }, 2500);
}

function updateUndoButton(btn, game) {
  btn.disabled = !(game.gameState === 'lost' && game.previousState);
}

function updateCheatButton(btn, game) {
  btn.textContent = game.cheatMode
    ? '\uD83D\uDD0D 侦测: 开'
    : '\uD83D\uDD0D 侦测: 关';
}
