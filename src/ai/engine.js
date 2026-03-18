// Minimax + Alpha-Beta 搜索引擎（优化版）
// 使用伪合法走法 + 快速将军检测减少开销

const { applyMove, getAllLegalMoves, getPseudoLegalMoves, isInCheck, pieceColor, pieceType } = require('./rules');
const { evaluate, PIECE_VALUES } = require('./evaluator');

const DEPTH_CONFIG = {
  easy: 2,
  medium: 3,
  hard: 3   // 深度3但使用更好的评估（困难=中等+机动性）
};

// 获取伪合法走法（不过滤自将，更快）
function getFastMoves(board, color) {
  const moves = [];
  for (let r = 0; r <= 9; r++) {
    for (let c = 0; c <= 8; c++) {
      const piece = board[r][c];
      if (piece && pieceColor(piece) === color) {
        const pieceMoves = getPseudoLegalMoves(board, r, c);
        for (const [tr, tc] of pieceMoves) {
          moves.push({ from: [r, c], to: [tr, tc] });
        }
      }
    }
  }
  return moves;
}

// MVV-LVA 走法排序：吃子优先
function sortMoves(board, moves) {
  return moves.sort((a, b) => {
    const targetA = board[a.to[0]][a.to[1]];
    const targetB = board[b.to[0]][b.to[1]];
    const fromA = board[a.from[0]][a.from[1]];
    const fromB = board[b.from[0]][b.from[1]];

    const scoreA = targetA
      ? (PIECE_VALUES[pieceType(targetA)] || 0) - (PIECE_VALUES[pieceType(fromA)] || 0) / 10
      : -1000;
    const scoreB = targetB
      ? (PIECE_VALUES[pieceType(targetB)] || 0) - (PIECE_VALUES[pieceType(fromB)] || 0) / 10
      : -1000;

    return scoreB - scoreA;
  });
}

function alphaBeta(board, depth, alpha, beta, maximizing, color, difficulty) {
  if (depth === 0) {
    return evaluate(board, difficulty);
  }

  const pseudoMoves = getFastMoves(board, color);
  const nextColor = color === 'red' ? 'black' : 'red';
  const sortedMoves = sortMoves(board, pseudoMoves);

  let hasLegalMove = false;

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of sortedMoves) {
      const newBoard = applyMove(board, move.from, move.to);
      if (isInCheck(newBoard, color)) continue; // 过滤自将
      hasLegalMove = true;

      const score = alphaBeta(newBoard, depth - 1, alpha, beta, false, nextColor, difficulty);
      if (score > maxScore) maxScore = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    if (!hasLegalMove) {
      return isInCheck(board, color) ? -100000 - depth : 0;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of sortedMoves) {
      const newBoard = applyMove(board, move.from, move.to);
      if (isInCheck(newBoard, color)) continue;
      hasLegalMove = true;

      const score = alphaBeta(newBoard, depth - 1, alpha, beta, true, nextColor, difficulty);
      if (score < minScore) minScore = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    if (!hasLegalMove) {
      return isInCheck(board, color) ? 100000 + depth : 0;
    }
    return minScore;
  }
}

function getBestMove(board, difficulty) {
  const depth = DEPTH_CONFIG[difficulty] || 3;
  const color = 'black'; // AI 始终是黑方
  const moves = getAllLegalMoves(board, color);

  if (moves.length === 0) return null;

  const sortedMoves = sortMoves(board, moves);
  const scored = sortedMoves.map(move => {
    const newBoard = applyMove(board, move.from, move.to);
    const score = alphaBeta(newBoard, depth - 1, -Infinity, Infinity, true, 'red', difficulty);
    return { move, score };
  });

  // 找最优分
  let bestScore = Infinity;
  for (const { score } of scored) {
    if (score < bestScore) bestScore = score;
  }

  // 简单模式：从分数接近最优的走法中随机选
  if (difficulty === 'easy') {
    const threshold = 80;
    const goodMoves = scored
      .filter(({ score }) => score <= bestScore + threshold)
      .map(({ move }) => move);
    return goodMoves[Math.floor(Math.random() * goodMoves.length)];
  }

  // 中等/困难：选最优走法
  return scored.find(({ score }) => score === bestScore).move;
}

module.exports = { getBestMove };
