# PC-Only Layout + Cycle Mark Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove mobile support, make board fill viewport without scrollbars, add right-click cycle mark (flag / question mark) to minesweeper cells.

**Architecture:** Modify all 5 existing files. game.js gets `isQuestion` cell property and 3-state `cycleMark()`. CSS is rewritten for `100vh` flex layout with JS-calculated cell sizes. app.js strips ~55 lines of touch code, adds dynamic cell sizing with resize listener. HTML adds controls wrapper div.

**Tech Stack:** Vanilla HTML/CSS/JS (no framework, no build step)

---

### Task 1: Game Logic — Cycle Mark Mode

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add `isQuestion` property to initBoard()**

Edit `js/game.js` — in `initBoard()`, add `isQuestion: false` after `isFlagged: false`:

Old:
```javascript
        this.board[r][c] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        };
```

New:
```javascript
        this.board[r][c] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          isQuestion: false,
          adjacentMines: 0
        };
```

- [ ] **Step 2: Replace toggleFlag with cycleMark**

Replace the entire `toggleFlag(r, c)` method with `cycleMark(r, c)`:

Old:
```javascript
  toggleFlag(r, c) {
    const cell = this.board[r][c];
    if (cell.isRevealed) return;
    if (this.gameState !== 'waiting' && this.gameState !== 'playing') return;

    cell.isFlagged = !cell.isFlagged;
    this.flagCount += cell.isFlagged ? 1 : -1;
  }
```

New:
```javascript
  cycleMark(r, c) {
    const cell = this.board[r][c];
    if (cell.isRevealed) return;
    if (this.gameState !== 'waiting' && this.gameState !== 'playing') return;

    if (!cell.isFlagged && !cell.isQuestion) {
      cell.isFlagged = true;
      this.flagCount++;
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      this.flagCount--;
      cell.isQuestion = true;
    } else {
      cell.isQuestion = false;
    }
  }
```

- [ ] **Step 3: Update reveal() guard to also block question-marked cells**

In the `reveal()` method, change:

Old:
```javascript
    if (cell.isRevealed || cell.isFlagged) return this.gameState;
```

New:
```javascript
    if (cell.isRevealed || cell.isFlagged || cell.isQuestion) return this.gameState;
```

- [ ] **Step 4: Update _floodFill() guard to also skip question-marked cells**

In the `_floodFill()` method, change:

Old:
```javascript
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;
```

New:
```javascript
    if (cell.isRevealed || cell.isFlagged || cell.isQuestion || cell.isMine) return;
```

- [ ] **Step 5: Verify syntax and commit**

Run: `node --check /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/js/game.js`
Expected: No output (no errors).

```bash
git add js/game.js
git commit -m "feat: add cycle mark mode with flag and question states"
```

---

### Task 2: UI Rendering — Question Mark Display

**Files:**
- Modify: `js/ui.js`

- [ ] **Step 1: Add question mark rendering in renderBoard()**

After the `} else if (cell.isFlagged) {` block (which ends with `}` at approximately current line 38), insert a new `else if` block for question marks:

Old:
```javascript
      } else if (cell.isFlagged) {
        cellEl.classList.add('flagged');
        cellEl.textContent = '\uD83D\uDEA9';
      }
```

New:
```javascript
      } else if (cell.isFlagged) {
        cellEl.classList.add('flagged');
        cellEl.textContent = '\uD83D\uDEA9';
      } else if (cell.isQuestion) {
        cellEl.classList.add('question');
        cellEl.textContent = '\u2753';
      }
```

- [ ] **Step 2: Verify syntax and commit**

Run: `node --check /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/js/ui.js`
Expected: No output (no errors).

```bash
git add js/ui.js
git commit -m "feat: render question mark for cells in question state"
```

---

### Task 3: CSS — Full-Height Layout + Cleanup + Question Style

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Rewrite style.css with full-height flex layout**

Write the complete new `css/style.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
  display: flex;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
}

.container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

/* Controls area (fixed height) */
.controls {
  flex-shrink: 0;
}

header {
  text-align: center;
  margin-bottom: 8px;
}

header h1 {
  font-size: 24px;
  color: #ffd54f;
}

/* Difficulty Controls */
.difficulty {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.difficulty label {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.difficulty input[type="number"] {
  width: 52px;
  padding: 4px 4px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #2a2a4a;
  color: #fff;
  font-size: 14px;
  text-align: center;
  -moz-appearance: textfield;
}

.difficulty input[type="number"]::-webkit-outer-spin-button,
.difficulty input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.difficulty input[type="number"]:focus {
  outline: none;
  border-color: #ffd54f;
}

/* Status Bar */
.status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

/* Action Buttons */
.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s, transform 0.1s;
  user-select: none;
  -webkit-user-select: none;
}

button:active {
  transform: scale(0.96);
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

#newGame {
  background: #ffd54f;
  color: #1a1a2e;
}

#newGame:hover {
  background: #ffca28;
}

#undoBtn {
  background: #ef5350;
  color: #fff;
  flex: 1;
}

#undoBtn:hover:not(:disabled) {
  background: #e53935;
}

#cheatToggle {
  background: #7e57c2;
  color: #fff;
  flex: 1;
}

#cheatToggle:hover {
  background: #6a1b9a;
}

/* Messages */
.message-container {
  min-height: 24px;
  margin-bottom: 4px;
}

.message {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.message.error {
  background: rgba(239, 83, 80, 0.3);
  color: #ef9a9a;
}

.message.success {
  background: rgba(102, 187, 106, 0.3);
  color: #a5d6a7;
}

.message.info {
  background: rgba(66, 165, 245, 0.3);
  color: #90caf9;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Board area (fills remaining space) */
.board-area {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.board {
  display: grid;
  gap: 1px;
  background: #333;
  border: 2px solid #555;
  user-select: none;
  -webkit-user-select: none;
}

.cell {
  background: #4a4a6a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: background 0.08s;
  position: relative;
}

.cell:hover:not(.revealed):not(.flagged):not(.question) {
  background: #5a5a7a;
}

.cell:active:not(.revealed):not(.flagged):not(.question) {
  background: #3a3a5a;
}

.cell.revealed {
  background: #2a2a4a;
  cursor: default;
}

.cell.mine {
  background: #cc3333;
}

.cell.flagged {
  background: #4a6a4a;
  cursor: default;
}

.cell.question {
  background: #4a5a6a;
  cursor: default;
}

.cell.cheat-mine {
  background: rgba(204, 51, 51, 0.25);
  box-shadow: inset 0 0 8px rgba(255, 0, 0, 0.5);
}
```

**Key changes vs old CSS:**
- `body`: `height: 100vh; overflow: hidden` instead of `min-height: 100vh`
- Removed `touch-action`, `-webkit-tap-highlight-color`
- `.container`: flex column, `height: 100vh`, removed `max-width: 660px`
- Added `.controls { flex-shrink: 0; }` wrapper
- Reduced padding/margins throughout to maximize board space
- Changed `.board-container` to `.board-area` with `flex: 1; min-height: 0; overflow: hidden;` centering
- `.cell`: removed `aspect-ratio: 1; min-width; min-height; clamp()` — sizes now set by JS
- Added `.cell.question` style
- Updated `.cell:hover` / `.cell:active` to also exclude `.question`
- Removed both `@media` blocks entirely

- [ ] **Step 2: Verify CSS file exists and is not empty**

Run: `wc -l /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/css/style.css`
Expected: ~230 lines.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: full-height flex layout with JS cell sizing, remove mobile CSS, add question style"
```

---

### Task 4: HTML — Meta + Controls Wrapper

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Edit index.html**

Make two changes:

**Change A:** Remove `user-scalable=no` from viewport meta (line 5):

Old:
```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```

New:
```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Change B:** Wrap controls (header + difficulty + status + actions + message) in a `<div class="controls">`, and change `board-container` to `board-area`:

Old:
```html
  <div class="container">
    <header>
      <h1>💣 扫雷</h1>
    </header>

    <div class="difficulty">
      <label>行 <input type="number" id="rows" min="5" max="30" value="9"></label>
      <label>列 <input type="number" id="cols" min="5" max="30" value="9"></label>
      <label>雷 <input type="number" id="mines" min="1" max="99" value="10"></label>
      <button id="newGame">新游戏</button>
    </div>

    <div class="status">
      <span id="mineCounter">💣 10</span>
      <span id="timer">⏱ 0</span>
    </div>

    <div class="actions">
      <button id="undoBtn" disabled>↩ 撤销</button>
      <button id="cheatToggle">🔍 侦测: 关</button>
    </div>

    <div id="messageContainer" class="message-container"></div>

    <div class="board-container">
      <div id="board" class="board"></div>
    </div>
  </div>
```

New:
```html
  <div class="container">
    <div class="controls">
      <header>
        <h1>💣 扫雷</h1>
      </header>

      <div class="difficulty">
        <label>行 <input type="number" id="rows" min="5" max="30" value="9"></label>
        <label>列 <input type="number" id="cols" min="5" max="30" value="9"></label>
        <label>雷 <input type="number" id="mines" min="1" max="99" value="10"></label>
        <button id="newGame">新游戏</button>
      </div>

      <div class="status">
        <span id="mineCounter">💣 10</span>
        <span id="timer">⏱ 0</span>
      </div>

      <div class="actions">
        <button id="undoBtn" disabled>↩ 撤销</button>
        <button id="cheatToggle">🔍 侦测: 关</button>
      </div>

      <div id="messageContainer" class="message-container"></div>
    </div>

    <div class="board-area">
      <div id="board" class="board"></div>
    </div>
  </div>
```

- [ ] **Step 2: Verify HTML structure**

Run: `grep -c 'class="controls"' /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/index.html`
Expected: `1`

Run: `grep -c 'class="board-area"' /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/index.html`
Expected: `1`

Run: `grep 'user-scalable' /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/index.html`
Expected: No output (removed).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add controls wrapper, rename board-container to board-area, remove user-scalable=no"
```

---

### Task 5: App.js — Remove Touch Events + Dynamic Cell Sizing + cycleMark

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Update handleCellFlag to use cycleMark**

In `handleCellFlag` (lines 60-63), change `game.toggleFlag` to `game.cycleMark`:

Old:
```javascript
  function handleCellFlag(row, col) {
    game.toggleFlag(row, col);
    refreshUI();
  }
```

New:
```javascript
  function handleCellFlag(row, col) {
    game.cycleMark(row, col);
    refreshUI();
  }
```

- [ ] **Step 2: Simplify contextmenu handler — remove Android guard**

Replace the entire contextmenu handler (lines 72-81):

Old:
```javascript
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
```

New:
```javascript
  boardEl.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    handleCellFlag(parseInt(cellEl.dataset.row, 10), parseInt(cellEl.dataset.col, 10));
  });
```

- [ ] **Step 3: Remove all touch event handlers and variables**

Delete the entire touch events block (lines 83-140) — everything from `// --- Touch events (mobile long-press for flag) ---` through the `touchcancel` listener's closing `});`:

Remove:
```javascript
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
```

- [ ] **Step 4: Add resizeBoard() function**

Add the function after `startNewGame()` (after line ~42), before `handleCellReveal()`:

```javascript
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
```

- [ ] **Step 5: Add resizeBoard() call in startNewGame() and refreshUI()**

In `startNewGame()`, after `refreshUI();` (line 39), add:

```javascript
    resizeBoard();
```

So:

Old:
```javascript
    refreshUI();
    updateCheatButton(cheatToggle, game);
```

New:
```javascript
    refreshUI();
    resizeBoard();
    updateCheatButton(cheatToggle, game);
```

In `refreshUI()`, after `renderBoard(game, boardEl);` call (line 24):

Old:
```javascript
  function refreshUI() {
    renderBoard(game, boardEl);
    updateMineCounter(game, mineCounterEl);
    updateTimer(game, timerEl);
    updateUndoButton(undoBtn, game);
  }
```

New:
```javascript
  function refreshUI() {
    renderBoard(game, boardEl);
    resizeBoard();
    updateMineCounter(game, mineCounterEl);
    updateTimer(game, timerEl);
    updateUndoButton(undoBtn, game);
  }
```

- [ ] **Step 6: Add window resize listener**

Add after the control button handlers (after the `cheatToggle` listener closes, before the difficulty validation section):

```javascript
  window.addEventListener('resize', function () {
    resizeBoard();
  });
```

- [ ] **Step 7: Verify syntax**

Run: `node --check /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/js/app.js`
Expected: No output (no errors).

- [ ] **Step 8: Commit**

```bash
git add js/app.js
git commit -m "feat: remove touch events, add dynamic cell sizing with resize listener, use cycleMark"
```

---

### Task 6: Verification & Polish

**Files:**
- Verify: all 5 files

- [ ] **Step 1: Verify all JS files have clean syntax**

Run:
```bash
for f in /Users/yannlau/Documents/020VibeCoding/MineSweepingGame/js/*.js; do echo "Checking $f"; node --check "$f" && echo "  OK" || echo "  FAIL"; done
```
Expected: All 3 files pass (app.js, game.js, ui.js).

- [ ] **Step 2: Verify git log shows all commits**

Run: `git -C /Users/yannlau/Documents/020VibeCoding/MineSweepingGame log --oneline -6`
Expected: 5 new commits on top of previous work.

- [ ] **Step 3: Manual test checklist**

Open `index.html` in a PC browser and verify:

1. **No scrollbars**: Page fills viewport. No vertical or horizontal scrollbars appear. Resize the window — board adjusts.
2. **Controls visible**: Difficulty inputs, mine counter, timer, undo/cheat buttons all visible at top.
3. **Right-click cycle**: Right-click an unrevealed cell → 🚩 appears. Right-click same cell again → ❓ appears. Right-click same cell again → mark removed.
4. **Mine counter**: Only 🚩 counts toward counter. ❓ doesn't change counter.
5. **Protected cells**: Left-click on 🚩 or ❓ does nothing.
6. **Cheat mode + questions**: Turn on cheat — ❓ marked mine cell still shows red glow.
7. **Undo with questions**: Lose a game with question marks placed → undo → question marks are restored correctly.
8. **Resize during game**: Resize browser window — board cells resize, game state preserved.
9. **First click safety**: First left-click still opens a safe area.

- [ ] **Step 4: Final commit if any fixes were needed**

If no fixes needed, verification is complete.
