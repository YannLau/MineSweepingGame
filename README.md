**Goal:** Build a responsive H5 minesweeper game with custom difficulty, first-click safety, undo-after-loss, and cheat detection. Deployable to GitHub Pages as static files.

**Architecture:** Pure HTML/CSS/JS with no framework or build step. Three JS files: `game.js` (pure logic class), `ui.js` (DOM rendering), `app.js` (event wiring + app init). CSS Grid board with responsive sizing via `clamp()` and media queries. Mobile flagging via long-press.

**Tech Stack:** HTML5, CSS3 (Grid, clamp, media queries), Vanilla JavaScript (ES6+ classes), GitHub Pages for deployment.