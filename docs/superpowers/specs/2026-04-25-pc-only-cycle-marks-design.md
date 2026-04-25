# PC-Only Layout + Cycle Flag Modes Design

> **Feature:** Remove mobile support, make board fill viewport without scrollbars, add cycle mark mode (flag / question mark)

---

## 1. Layout: Full-Screen, No Scrollbars

### Status Quo

Current layout uses `max-width: 660px` centered container, mobile media queries, `overflow: auto` on board with scrollbars, and touch events for mobile flagging.

### Target

- PC browser only
- Body `height: 100vh; overflow: hidden` — no page-level scrollbar
- Container is a vertical flex column filling `100vh`
- Controls area at top (`flex-shrink: 0`)
- Board area fills remaining space (`flex: 1; min-height: 0`)
- Board centered in the remaining area
- Cell sizes calculated in JS to fit exactly — no board scrollbar

### Layout Structure

```
body (100vh, overflow: hidden)
└── .container (100vh, flex column)
    ├── header            ─┐
    ├── .difficulty        │
    ├── .status            ├─ flex-shrink: 0 (fixed height)
    ├── .actions           │
    ├── .message-container │
    └── .board-area       ─┘
        └── .board (grid with JS-calculated px sizes)
```

### Dynamic Cell Sizing

JS calculates cell size on new game and window resize:

```
cellSize = Math.floor(Math.min(boardArea.clientWidth / cols, boardArea.clientHeight / rows))
cellSize = Math.max(cellSize, 16)  // minimum 16px
```

Grid is set with explicit pixel values:
- `grid-template-columns: repeat(cols, cellSize + 'px')`
- `grid-template-rows: repeat(rows, cellSize + 'px')`

Board is centered within `.board-area` via `display: flex; justify-content: center; align-items: center`.

### CSS Changes Detail

Remove:
- `@media (max-width: 480px)` block (entirely)
- `@media (min-width: 768px)` block (replaced by dynamic sizing)
- `touch-action: manipulation` on body
- `-webkit-tap-highlight-color: transparent`
- `.container` `max-width: 660px`
- `.board-container` `overflow: auto` → `overflow: hidden`
- `.cell` `aspect-ratio: 1`, `min-width`, `min-height`, `clamp()` font-size

Add:
- `body { height: 100vh; overflow: hidden; }`
- `.container { height: 100vh; display: flex; flex-direction: column; }`
- `.controls { flex-shrink: 0; }` (wrapper for header + difficulty + status + actions + message)
- `.board-area { flex: 1; min-height: 0; display: flex; justify-content: center; align-items: center; }`
- `.cell { font-size: calc(cellSize * 0.6); }` — font size proportional to cell

### JS Changes Detail (app.js)

Remove:
- All touch event listeners: `touchstart`, `touchmove`, `touchend`, `touchcancel`
- Variables: `longPressTimer`, `touchStartTarget`, `touchMoved`, `lastTouchFlagTime`, `lastTouchFlagCell`
- Android double-fire guard in `contextmenu` handler

Add:
- `resizeBoard()` function — calculates cell size, applies to board grid
- `window.addEventListener('resize', resizeBoard)`
- Call `resizeBoard()` in `startNewGame()` and `refreshUI()`

---

## 2. Cycle Mark Mode

### Behavior

Right-click on a cell cycles through three mark states:

```
none → flag (🚩) → question (❓) → none → ...
```

- Only flagged cells count toward `flagCount` (mine counter)
- Question marks are visual only, don't affect counter
- Both flagged and question-marked cells are protected from reveal (left-click does nothing)
- Both flagged and question-marked cells have no hover/active effect

### Game Logic Changes (game.js)

**Cell object** adds `isQuestion` property (default `false`):

```javascript
{
  isMine: false,
  isRevealed: false,
  isFlagged: false,
  isQuestion: false,   // NEW
  adjacentMines: 0
}
```

**`toggleFlag(r, c)` → `cycleMark(r, c)`:**

```javascript
cycleMark(r, c) {
  const cell = this.board[r][c];
  if (cell.isRevealed) return;
  if (this.gameState !== 'waiting' && this.gameState !== 'playing') return;

  if (!cell.isFlagged && !cell.isQuestion) {
    // none → flag
    cell.isFlagged = true;
    this.flagCount++;
  } else if (cell.isFlagged) {
    // flag → question
    cell.isFlagged = false;
    this.flagCount--;
    cell.isQuestion = true;
  } else {
    // question → none
    cell.isQuestion = false;
  }
}
```

**`reveal(r, c)` guard** updated from `cell.isFlagged` to `cell.isFlagged || cell.isQuestion`.

**`_floodFill(r, c)` guard** updated from `cell.isFlagged` to `cell.isFlagged || cell.isQuestion`.

**`saveState()`** — spread operator `{ ...cell }` already copies `isQuestion` automatically (no change needed).

**`initBoard()`** — initialize `isQuestion: false`.

### UI Changes (ui.js)

**`renderBoard()`** — add question mark rendering:

```javascript
} else if (cell.isFlagged) {
  cellEl.classList.add('flagged');
  cellEl.textContent = '\uD83D\uDEA9';  // 🚩
} else if (cell.isQuestion) {
  cellEl.classList.add('question');
  cellEl.textContent = '\u2753';  // ❓
}
```

### CSS Changes (style.css)

Add `.cell.question` style:

```css
.cell.question {
  background: #4a5a6a;
  cursor: default;
}
```

Update hover/active to exclude `.question`:

```css
.cell:hover:not(.revealed):not(.flagged):not(.question) { background: #5a5a7a; }
.cell:active:not(.revealed):not(.flagged):not(.question) { background: #3a3a5a; }
```

### HTML Changes (index.html)

- Remove `user-scalable=no` from viewport meta
- Wrap controls in a `<div class="controls">` for flex layout

---

## 3. Files Changed Summary

| File | Lines changed | What |
|------|--------------|------|
| `index.html` | ~2 | Remove `user-scalable=no`, add `.controls` wrapper |
| `css/style.css` | ~30 | Remove mobile query + touch CSS, add full-height flex layout, add `.question`, update hover |
| `js/game.js` | ~15 | Add `isQuestion`, `toggleFlag` → `cycleMark`, update guards |
| `js/ui.js` | ~10 | Add question mark rendering in `renderBoard`, update hover comments |
| `js/app.js` | ~30 | Remove touch events (~55 lines), add `resizeBoard` + resize listener (~25 lines), update right-click call to `cycleMark` |

---

## 4. Edge Cases

- **Small board + large cell size**: `Math.floor` prevents partial pixels; `Math.max(cellSize, 16)` ensures minimum visibility
- **Resize during game**: Board recalculates cell size on `resize` event — all game state preserved
- **Undo with question marks**: `saveState` deep-clones including `isQuestion`; undo restores correctly
- **Cheat mode + question marks**: Cheat still shows mine glow on unrevealed question-marked cells (player may have marked the wrong cell)
- **First click on question mark**: Question marks are set by right-click, but first click is always left-click (reveal). Left-click on a question-marked cell is blocked.
