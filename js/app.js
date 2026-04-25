document.addEventListener('DOMContentLoaded', function () {
  var boardEl = document.getElementById('board');
  var rowsInput = document.getElementById('rows');
  var colsInput = document.getElementById('cols');
  var minesInput = document.getElementById('mines');
  var newGameBtn = document.getElementById('newGame');
  var undoBtn = document.getElementById('undoBtn');
  var cheatToggle = document.getElementById('cheatToggle');
  var mineCounterEl = document.getElementById('mineCounter');
  var timerEl = document.getElementById('timer');
  var messageContainer = document.getElementById('messageContainer');

  var game;
  var timerInterval;

  function getDifficulty() {
    var rows = parseInt(rowsInput.value, 10) || 9;
    var cols = parseInt(colsInput.value, 10) || 9;
    var mines = parseInt(minesInput.value, 10) || 10;
    return { rows: rows, cols: cols, mines: mines };
  }

  function refreshUI() {
    renderBoard(game, boardEl);
    resizeBoard();
    updateMineCounter(game, mineCounterEl);
    updateTimer(game, timerEl);
    updateUndoButton(undoBtn, game);
  }

  function startNewGame() {
    var d = getDifficulty();
    game = new MinesweeperGame(d.rows, d.cols, d.mines);

    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      updateTimer(game, timerEl);
    }, 200);

    refreshUI();
    resizeBoard();
    updateCheatButton(cheatToggle, game);
    messageContainer.innerHTML = '';
  }

  function resizeBoard() {
    if (!game || !boardEl) return;
    var boardArea = boardEl.parentElement;
    if (!boardArea) return;
    var cellW = Math.floor(boardArea.clientWidth / game.cols);
    var cellH = Math.floor(boardArea.clientHeight / game.rows);
    var size = Math.max(Math.min(cellW, cellH), 16);
    boardEl.style.gridTemplateColumns = 'repeat(' + game.cols + ', ' + size + 'px)';
    boardEl.style.gridTemplateRows = 'repeat(' + game.rows + ', ' + size + 'px)';
    boardEl.style.fontSize = Math.max(10, Math.floor(size * 0.55)) + 'px';
  }

  function handleCellReveal(row, col) {
    var result = game.reveal(row, col);
    refreshUI();

    if (result === 'lost') {
      game.revealAllMines();
      clearInterval(timerInterval);
      renderBoard(game, boardEl);
      updateUndoButton(undoBtn, game);
      showMessage(messageContainer, '\uD83D\uDCA5 踩到雷了！点击"撤销"可回退上一步', 'error');
    } else if (result === 'won') {
      clearInterval(timerInterval);
      showMessage(messageContainer, '\uD83C\uDF89 恭喜你赢了！', 'success');
    }
  }

  function handleCellFlag(row, col) {
    game.cycleMark(row, col);
    refreshUI();
  }

  // --- Mouse events ---
  boardEl.addEventListener('click', function (e) {
    var cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    handleCellReveal(parseInt(cellEl.dataset.row, 10), parseInt(cellEl.dataset.col, 10));
  });

  boardEl.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    handleCellFlag(parseInt(cellEl.dataset.row, 10), parseInt(cellEl.dataset.col, 10));
  });


  // --- Control buttons ---
  newGameBtn.addEventListener('click', startNewGame);

  undoBtn.addEventListener('click', function () {
    if (game.undo()) {
      refreshUI();
      clearInterval(timerInterval);
      timerInterval = setInterval(function () {
        updateTimer(game, timerEl);
      }, 200);
      updateCheatButton(cheatToggle, game);
      showMessage(messageContainer, '\u21A9 已撤销，继续游戏', 'info');
    }
  });

  cheatToggle.addEventListener('click', function () {
    game.cheatMode = !game.cheatMode;
    renderBoard(game, boardEl);
    updateCheatButton(cheatToggle, game);
  });

  window.addEventListener('resize', function () {
    resizeBoard();
  });

  // --- Difficulty input validation ---
  function clampMines() {
    var rows = parseInt(rowsInput.value, 10) || 9;
    var cols = parseInt(colsInput.value, 10) || 9;
    var mines = parseInt(minesInput.value, 10) || 10;
    var maxMines = rows * cols - 9;
    if (mines > maxMines) {
      minesInput.value = Math.max(1, maxMines);
    } else if (mines < 1) {
      minesInput.value = 1;
    }
  }

  rowsInput.addEventListener('change', clampMines);
  colsInput.addEventListener('change', clampMines);
  minesInput.addEventListener('change', clampMines);

  // --- Initial game ---
  startNewGame();
});
