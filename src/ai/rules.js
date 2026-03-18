// 后端走法生成 — 与前端 rules.js 逻辑相同

function pieceColor(piece) {
  if (!piece) return null;
  return piece[0] === 'r' ? 'red' : 'black';
}

function pieceType(piece) {
  if (!piece) return null;
  return piece[1];
}

function inBounds(r, c) {
  return r >= 0 && r <= 9 && c >= 0 && c <= 8;
}

function inPalace(r, c, color) {
  if (color === 'red') return r >= 7 && r <= 9 && c >= 3 && c <= 5;
  return r >= 0 && r <= 2 && c >= 3 && c <= 5;
}

// 深拷贝棋盘
function cloneBoard(board) {
  return board.map(row => row.slice());
}

// 应用走法，返回新棋盘（不可变）
function applyMove(board, from, to) {
  const newBoard = cloneBoard(board);
  newBoard[to[0]][to[1]] = newBoard[from[0]][from[1]];
  newBoard[from[0]][from[1]] = null;
  return newBoard;
}

// 判断某方是否被将
function isInCheck(board, color) {
  // 找到将/帅位置
  let kingRow = -1, kingCol = -1;
  const kingPiece = color === 'red' ? 'rK' : 'bK';
  for (let r = 0; r <= 9; r++) {
    for (let c = 0; c <= 8; c++) {
      if (board[r][c] === kingPiece) {
        kingRow = r; kingCol = c;
      }
    }
  }
  if (kingRow === -1) return false;

  const opponent = color === 'red' ? 'black' : 'red';

  // 对将检测（飞将）：两将同列且中间无子
  const opponentKingPiece = opponent === 'red' ? 'rK' : 'bK';
  for (let r = 0; r <= 9; r++) {
    if (board[r][kingCol] === opponentKingPiece) {
      // 检查两将之间是否有棋子
      const minR = Math.min(r, kingRow) + 1;
      const maxR = Math.max(r, kingRow);
      let blocked = false;
      for (let mr = minR; mr < maxR; mr++) {
        if (board[mr][kingCol]) { blocked = true; break; }
      }
      if (!blocked) return true;
    }
  }

  // 检查对方所有棋子是否能攻击到将/帅
  for (let r = 0; r <= 9; r++) {
    for (let c = 0; c <= 8; c++) {
      const piece = board[r][c];
      if (piece && pieceColor(piece) === opponent) {
        const moves = getPseudoLegalMoves(board, r, c);
        for (const [mr, mc] of moves) {
          if (mr === kingRow && mc === kingCol) return true;
        }
      }
    }
  }
  return false;
}

// 获取伪合法走法（不检查自将）
function getPseudoLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const color = pieceColor(piece);
  const type = pieceType(piece);
  const moves = [];

  switch (type) {
    case 'K': // 将/帅
      getKingMoves(board, row, col, color, moves);
      break;
    case 'A': // 士/仕
      getAdvisorMoves(board, row, col, color, moves);
      break;
    case 'B': // 象/相
      getBishopMoves(board, row, col, color, moves);
      break;
    case 'N': // 马
      getKnightMoves(board, row, col, color, moves);
      break;
    case 'R': // 车
      getRookMoves(board, row, col, color, moves);
      break;
    case 'C': // 炮
      getCannonMoves(board, row, col, color, moves);
      break;
    case 'P': // 兵/卒
      getPawnMoves(board, row, col, color, moves);
      break;
  }
  return moves;
}

function getKingMoves(board, row, col, color, moves) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (!inPalace(nr, nc, color)) continue;
    const target = board[nr][nc];
    if (!target || pieceColor(target) !== color) {
      // 检查对将（flying general）
      moves.push([nr, nc]);
    }
  }
  // 对将检测在 getLegalMoves 中通过 isInCheck 处理
  // 但对将规则需要在伪合法中也处理（对方将可以走到对将位置，需要过滤）
  // 这里先加入，让 getLegalMoves 过滤
}

function getAdvisorMoves(board, row, col, color, moves) {
  const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (!inPalace(nr, nc, color)) continue;
    const target = board[nr][nc];
    if (!target || pieceColor(target) !== color) {
      moves.push([nr, nc]);
    }
  }
}

function getBishopMoves(board, row, col, color, moves) {
  // 象走田，不能过河
  const dirs = [[-2,-2],[-2,2],[2,-2],[2,2]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (!inBounds(nr, nc)) continue;
    // 不能过河
    if (color === 'red' && nr < 5) continue;
    if (color === 'black' && nr > 4) continue;
    // 象眼
    const eyeR = row + dr / 2, eyeC = col + dc / 2;
    if (board[eyeR][eyeC]) continue; // 象眼被堵
    const target = board[nr][nc];
    if (!target || pieceColor(target) !== color) {
      moves.push([nr, nc]);
    }
  }
}

function getKnightMoves(board, row, col, color, moves) {
  // 马走日，马腿规则
  const steps = [
    [-2,-1,[-1,0]], [-2,1,[-1,0]],
    [2,-1,[1,0]],   [2,1,[1,0]],
    [-1,-2,[0,-1]], [1,-2,[0,-1]],
    [-1,2,[0,1]],   [1,2,[0,1]]
  ];
  for (const [dr, dc, [lr, lc]] of steps) {
    const nr = row + dr, nc = col + dc;
    if (!inBounds(nr, nc)) continue;
    // 马腿
    if (board[row + lr][col + lc]) continue;
    const target = board[nr][nc];
    if (!target || pieceColor(target) !== color) {
      moves.push([nr, nc]);
    }
  }
}

function getRookMoves(board, row, col, color, moves) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    let nr = row + dr, nc = col + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push([nr, nc]);
      } else {
        if (pieceColor(target) !== color) moves.push([nr, nc]);
        break;
      }
      nr += dr; nc += dc;
    }
  }
}

function getCannonMoves(board, row, col, color, moves) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    let nr = row + dr, nc = col + dc;
    let hasScreen = false;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!hasScreen) {
        if (!target) {
          moves.push([nr, nc]); // 移动
        } else {
          hasScreen = true; // 找到炮架
        }
      } else {
        if (target) {
          if (pieceColor(target) !== color) moves.push([nr, nc]); // 吃子
          break;
        }
      }
      nr += dr; nc += dc;
    }
  }
}

function getPawnMoves(board, row, col, color, moves) {
  if (color === 'red') {
    // 红兵：向上（row 减小）
    const forward = row - 1;
    if (inBounds(forward, col)) {
      const t = board[forward][col];
      if (!t || pieceColor(t) !== color) moves.push([forward, col]);
    }
    // 过河后可左右
    if (row <= 4) {
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (inBounds(row, nc)) {
          const t = board[row][nc];
          if (!t || pieceColor(t) !== color) moves.push([row, nc]);
        }
      }
    }
  } else {
    // 黑卒：向下（row 增大）
    const forward = row + 1;
    if (inBounds(forward, col)) {
      const t = board[forward][col];
      if (!t || pieceColor(t) !== color) moves.push([forward, col]);
    }
    // 过河后可左右
    if (row >= 5) {
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (inBounds(row, nc)) {
          const t = board[row][nc];
          if (!t || pieceColor(t) !== color) moves.push([row, nc]);
        }
      }
    }
  }
}

// 获取合法走法（过滤自将）
function getLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const color = pieceColor(piece);
  const pseudoMoves = getPseudoLegalMoves(board, row, col);
  return pseudoMoves.filter(([tr, tc]) => {
    const newBoard = applyMove(board, [row, col], [tr, tc]);
    return !isInCheck(newBoard, color);
  });
}

// 获取某方所有合法走法
function getAllLegalMoves(board, color) {
  const moves = [];
  for (let r = 0; r <= 9; r++) {
    for (let c = 0; c <= 8; c++) {
      const piece = board[r][c];
      if (piece && pieceColor(piece) === color) {
        const pieceMoves = getLegalMoves(board, r, c);
        for (const [tr, tc] of pieceMoves) {
          moves.push({ from: [r, c], to: [tr, tc] });
        }
      }
    }
  }
  return moves;
}

// 判断游戏状态
function getGameStatus(board, currentTurn) {
  const moves = getAllLegalMoves(board, currentTurn);
  if (moves.length === 0) {
    if (isInCheck(board, currentTurn)) return 'checkmate';
    return 'stalemate';
  }
  if (isInCheck(board, currentTurn)) return 'check';
  return 'ongoing';
}

// 初始棋盘
function getInitialBoard() {
  const board = Array(10).fill(null).map(() => Array(9).fill(null));
  // 黑方（上方，row 0-4）
  board[0][0] = 'bR'; board[0][1] = 'bN'; board[0][2] = 'bB';
  board[0][3] = 'bA'; board[0][4] = 'bK'; board[0][5] = 'bA';
  board[0][6] = 'bB'; board[0][7] = 'bN'; board[0][8] = 'bR';
  board[2][1] = 'bC'; board[2][7] = 'bC';
  board[3][0] = 'bP'; board[3][2] = 'bP'; board[3][4] = 'bP';
  board[3][6] = 'bP'; board[3][8] = 'bP';
  // 红方（下方，row 5-9）
  board[9][0] = 'rR'; board[9][1] = 'rN'; board[9][2] = 'rB';
  board[9][3] = 'rA'; board[9][4] = 'rK'; board[9][5] = 'rA';
  board[9][6] = 'rB'; board[9][7] = 'rN'; board[9][8] = 'rR';
  board[7][1] = 'rC'; board[7][7] = 'rC';
  board[6][0] = 'rP'; board[6][2] = 'rP'; board[6][4] = 'rP';
  board[6][6] = 'rP'; board[6][8] = 'rP';
  return board;
}

module.exports = {
  pieceColor, pieceType, cloneBoard, applyMove,
  isInCheck, getPseudoLegalMoves, getLegalMoves,
  getAllLegalMoves, getGameStatus, getInitialBoard
};
