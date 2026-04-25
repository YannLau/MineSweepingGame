class MinesweeperGame {
  constructor(rows, cols, numMines) {
    this.rows = rows;
    this.cols = cols;
    const maxMines = rows * cols - 9;
    this.numMines = Math.max(1, Math.min(numMines, maxMines));
    this.board = [];
    this.gameState = 'waiting'; // 'waiting' | 'playing' | 'won' | 'lost'
    this.firstClickDone = false;
    this.previousState = null;
    this.cheatMode = false;
    this.flagCount = 0;
    this.revealedCount = 0;
    this.startTime = null;
    this.elapsedTime = 0;
    this.initBoard();
  }

  initBoard() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      this.board[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.board[r][c] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        };
      }
    }
    this.gameState = 'waiting';
    this.firstClickDone = false;
    this.previousState = null;
    this.flagCount = 0;
    this.revealedCount = 0;
    this.startTime = null;
    this.elapsedTime = 0;
  }

  isValidCell(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  getNeighbors(r, c) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (this.isValidCell(nr, nc)) {
          neighbors.push([nr, nc]);
        }
      }
    }
    return neighbors;
  }

  getSafeZone(r, c) {
    const zone = new Set();
    zone.add(`${r},${c}`);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (this.isValidCell(nr, nc)) {
          zone.add(`${nr},${nc}`);
        }
      }
    }
    return zone;
  }

  placeMines(safeRow, safeCol) {
    const safeZone = this.getSafeZone(safeRow, safeCol);

    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!safeZone.has(`${r},${c}`)) {
          candidates.push([r, c]);
        }
      }
    }

    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const mineCount = Math.min(this.numMines, candidates.length);
    for (let i = 0; i < mineCount; i++) {
      const [r, c] = candidates[i];
      this.board[r][c].isMine = true;
    }

    // Calculate adjacent mine counts
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c].isMine) continue;
        let count = 0;
        for (const [nr, nc] of this.getNeighbors(r, c)) {
          if (this.board[nr][nc].isMine) count++;
        }
        this.board[r][c].adjacentMines = count;
      }
    }

    this.firstClickDone = true;
    this.gameState = 'playing';
    this.startTime = Date.now();
  }

  saveState() {
    this.previousState = {
      board: this.board.map(row => row.map(cell => ({ ...cell }))),
      gameState: this.gameState,
      flagCount: this.flagCount,
      revealedCount: this.revealedCount,
      firstClickDone: this.firstClickDone,
      startTime: this.startTime,
      elapsedTime: this.elapsedTime
    };
  }

  reveal(r, c) {
    if (!this.isValidCell(r, c)) return this.gameState;
    const cell = this.board[r][c];

    if (cell.isRevealed || cell.isFlagged) return this.gameState;
    if (this.gameState === 'won' || this.gameState === 'lost') return this.gameState;

    if (!this.firstClickDone) {
      this.placeMines(r, c);
    }

    if (this.gameState === 'playing') {
      this.saveState();
    }

    if (cell.isMine) {
      cell.isRevealed = true;
      this.gameState = 'lost';
      this.elapsedTime = (Date.now() - this.startTime) / 1000;
      return 'lost';
    }

    this._floodFill(r, c);

    if (this.checkWin()) {
      this.gameState = 'won';
      this.elapsedTime = (Date.now() - this.startTime) / 1000;
      return 'won';
    }

    return 'playing';
  }

  _floodFill(r, c) {
    if (!this.isValidCell(r, c)) return;
    const cell = this.board[r][c];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

    cell.isRevealed = true;
    this.revealedCount++;

    if (cell.adjacentMines === 0) {
      for (const [nr, nc] of this.getNeighbors(r, c)) {
        this._floodFill(nr, nc);
      }
    }
  }

  toggleFlag(r, c) {
    const cell = this.board[r][c];
    if (cell.isRevealed) return;
    if (this.gameState !== 'waiting' && this.gameState !== 'playing') return;

    cell.isFlagged = !cell.isFlagged;
    this.flagCount += cell.isFlagged ? 1 : -1;
  }

  undo() {
    if (!this.previousState) return false;
    if (this.gameState !== 'lost') return false;

    this.board = this.previousState.board;
    this.gameState = 'playing';
    this.flagCount = this.previousState.flagCount;
    this.revealedCount = this.previousState.revealedCount;
    this.firstClickDone = this.previousState.firstClickDone;
    this.startTime = this.previousState.startTime;
    this.elapsedTime = this.previousState.elapsedTime;
    this.previousState = null;

    return true;
  }

  checkWin() {
    const totalCells = this.rows * this.cols;
    return this.revealedCount === totalCells - this.numMines;
  }

  getElapsedTime() {
    if (this.gameState === 'waiting') return 0;
    if (this.gameState === 'won' || this.gameState === 'lost') return this.elapsedTime;
    return (Date.now() - this.startTime) / 1000;
  }

  revealAllMines() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c].isMine) {
          this.board[r][c].isRevealed = true;
        }
      }
    }
  }
}
