# 中国象棋 — 人机对战

A Chinese Chess (象棋) game playable in the browser against an AI opponent.

**Live demo:** https://generous-curiosity-production.up.railway.app

## Features

- Full Chinese Chess rules — all 7 piece types with correct movement
- AI opponent with 3 difficulty levels (easy / medium / hard)
- Move animation, legal move highlighting, check flash
- Undo, restart, difficulty switching

## AI

Minimax + Alpha-Beta pruning with MVV-LVA move ordering.

| Difficulty | Depth | extras |
|------------|-------|--------|
| Easy | 2 | randomised among near-optimal moves |
| Medium | 3 | position value tables |
| Hard | 3 | position tables + mobility evaluation |

## Running locally

```bash
npm install
node server.js
# open http://localhost:3000
```

## Tech stack

- **Backend:** Node.js + Express (AI engine, move validation)
- **Frontend:** Vanilla HTML / CSS / Canvas (no frameworks)
