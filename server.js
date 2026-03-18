const express = require('express');
const path = require('path');
const { getInitialBoard, getLegalMoves, applyMove, getGameStatus, pieceColor } = require('./src/ai/rules');
const { getBestMove } = require('./src/ai/engine');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化新游戏
app.post('/api/new-game', (req, res) => {
  const board = getInitialBoard();
  res.json({ board, currentTurn: 'red' });
});

// 校验人类走棋合法性
app.post('/api/validate-move', (req, res) => {
  const { board, from, to } = req.body;
  if (!board || !from || !to) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    const legalMoves = getLegalMoves(board, from[0], from[1]);
    const isLegal = legalMoves.some(([r, c]) => r === to[0] && c === to[1]);
    if (!isLegal) {
      return res.json({ valid: false });
    }
    const newBoard = applyMove(board, from, to);
    const nextTurn = 'black';
    const gameStatus = getGameStatus(newBoard, nextTurn);
    res.json({ valid: true, board: newBoard, gameStatus });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// AI 走棋
app.post('/api/ai-move', (req, res) => {
  const { board, difficulty = 'medium' } = req.body;
  if (!board) {
    return res.status(400).json({ error: 'Missing board' });
  }
  try {
    const move = getBestMove(board, difficulty);
    if (!move) {
      return res.json({ gameStatus: 'checkmate' });
    }
    const newBoard = applyMove(board, move.from, move.to);
    const gameStatus = getGameStatus(newBoard, 'red');
    res.json({ from: move.from, to: move.to, board: newBoard, gameStatus });
  } catch (e) {
    console.error('AI error:', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`象棋服务器运行在 http://localhost:${PORT}`);
});
