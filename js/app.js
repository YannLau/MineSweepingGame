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
    updateCheatButton(cheatToggle, game);
    messageContainer.innerHTML = '';
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
    game.toggleFlag(row, col);
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
    // Skip if this cell was just flagged via touch long-press (Android double-fire)
    if (lastTouchFlagCell === cellEl && Date.now() - lastTouchFlagTime < 600) {
      return;
    }
    handleCellFlag(parseInt(cellEl.dataset.row, 10), parseInt(cellEl.dataset.col, 10));
  });

  // --- Touch events (mobile long-press for flag) ---
  var longPressTimer = null;
  var touchStartTarget = null;
  var touchMoved = false;
  var lastTouchFlagTime = 0;
  var lastTouchFlagCell = null;

  boardEl.addEventListener('touchstart', function (e) {
    var cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    touchStartTarget = cellEl;
    touchMoved = false;

    longPressTimer = setTimeout(function () {
      if (!touchMoved && touchStartTarget) {
        handleCellFlag(
          parseInt(touchStartTarget.dataset.row, 10),
          parseInt(touchStartTarget.dataset.col, 10)
        );
        lastTouchFlagTime = Date.now();
        lastTouchFlagCell = touchStartTarget;
        if (navigator.vibrate) { navigator.vibrate(15); }
        longPressTimer = null;
        touchStartTarget = null;
      }
    }, 500);
  }, { passive: true });

  boardEl.addEventListener('touchmove', function () {
    if (longPressTimer) {
      touchMoved = true;
    }
  }, { passive: true });

  boardEl.addEventListener('touchend', function (e) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      if (!touchMoved && touchStartTarget) {
        // Short tap = reveal
        handleCellReveal(
          parseInt(touchStartTarget.dataset.row, 10),
          parseInt(touchStartTarget.dataset.col, 10)
        );
      }
    }
    touchStartTarget = null;
    touchMoved = false;
  });

  boardEl.addEventListener('touchcancel', function () {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    touchStartTarget = null;
    touchMoved = false;
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
