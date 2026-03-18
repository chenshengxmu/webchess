// 前端走法生成 — 纯逻辑，无副作用

const Rules = (() => {
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

  function cloneBoard(board) {
    return board.map(row => row.slice());
  }

  function applyMove(board, from, to) {
    const newBoard = cloneBoard(board);
    newBoard[to[0]][to[1]] = newBoard[from[0]][from[1]];
    newBoard[from[0]][from[1]] = null;
    return newBoard;
  }

  function isInCheck(board, color) {
    let kingRow = -1, kingCol = -1;
    const kingPiece = color === 'red' ? 'rK' : 'bK';
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        if (board[r][c] === kingPiece) { kingRow = r; kingCol = c; }
      }
    }
    if (kingRow === -1) return false;
    const opponent = color === 'red' ? 'black' : 'red';

    // 对将检测（飞将）：两将同列且中间无子
    const opponentKingPiece = opponent === 'red' ? 'rK' : 'bK';
    for (let r = 0; r <= 9; r++) {
      if (board[r][kingCol] === opponentKingPiece) {
        const minR = Math.min(r, kingRow) + 1;
        const maxR = Math.max(r, kingRow);
        let blocked = false;
        for (let mr = minR; mr < maxR; mr++) {
          if (board[mr][kingCol]) { blocked = true; break; }
        }
        if (!blocked) return true;
      }
    }

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

  function getPseudoLegalMoves(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    const color = pieceColor(piece);
    const type = pieceType(piece);
    const moves = [];

    switch (type) {
      case 'K': getKingMoves(board, row, col, color, moves); break;
      case 'A': getAdvisorMoves(board, row, col, color, moves); break;
      case 'B': getBishopMoves(board, row, col, color, moves); break;
      case 'N': getKnightMoves(board, row, col, color, moves); break;
      case 'R': getRookMoves(board, row, col, color, moves); break;
      case 'C': getCannonMoves(board, row, col, color, moves); break;
      case 'P': getPawnMoves(board, row, col, color, moves); break;
    }
    return moves;
  }

  function getKingMoves(board, row, col, color, moves) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = row + dr, nc = col + dc;
      if (!inPalace(nr, nc, color)) continue;
      const target = board[nr][nc];
      if (!target || pieceColor(target) !== color) moves.push([nr, nc]);
    }
  }

  function getAdvisorMoves(board, row, col, color, moves) {
    const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of dirs) {
      const nr = row + dr, nc = col + dc;
      if (!inPalace(nr, nc, color)) continue;
      const target = board[nr][nc];
      if (!target || pieceColor(target) !== color) moves.push([nr, nc]);
    }
  }

  function getBishopMoves(board, row, col, color, moves) {
    const dirs = [[-2,-2],[-2,2],[2,-2],[2,2]];
    for (const [dr, dc] of dirs) {
      const nr = row + dr, nc = col + dc;
      if (!inBounds(nr, nc)) continue;
      if (color === 'red' && nr < 5) continue;
      if (color === 'black' && nr > 4) continue;
      const eyeR = row + dr / 2, eyeC = col + dc / 2;
      if (board[eyeR][eyeC]) continue;
      const target = board[nr][nc];
      if (!target || pieceColor(target) !== color) moves.push([nr, nc]);
    }
  }

  function getKnightMoves(board, row, col, color, moves) {
    const steps = [
      [-2,-1,[-1,0]], [-2,1,[-1,0]],
      [2,-1,[1,0]],   [2,1,[1,0]],
      [-1,-2,[0,-1]], [1,-2,[0,-1]],
      [-1,2,[0,1]],   [1,2,[0,1]]
    ];
    for (const [dr, dc, [lr, lc]] of steps) {
      const nr = row + dr, nc = col + dc;
      if (!inBounds(nr, nc)) continue;
      if (board[row + lr][col + lc]) continue;
      const target = board[nr][nc];
      if (!target || pieceColor(target) !== color) moves.push([nr, nc]);
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
            moves.push([nr, nc]);
          } else {
            hasScreen = true;
          }
        } else {
          if (target) {
            if (pieceColor(target) !== color) moves.push([nr, nc]);
            break;
          }
        }
        nr += dr; nc += dc;
      }
    }
  }

  function getPawnMoves(board, row, col, color, moves) {
    if (color === 'red') {
      const forward = row - 1;
      if (inBounds(forward, col)) {
        const t = board[forward][col];
        if (!t || pieceColor(t) !== color) moves.push([forward, col]);
      }
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
      const forward = row + 1;
      if (inBounds(forward, col)) {
        const t = board[forward][col];
        if (!t || pieceColor(t) !== color) moves.push([forward, col]);
      }
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

  function getGameStatus(board, currentTurn) {
    const moves = getAllLegalMoves(board, currentTurn);
    if (moves.length === 0) {
      if (isInCheck(board, currentTurn)) return 'checkmate';
      return 'stalemate';
    }
    if (isInCheck(board, currentTurn)) return 'check';
    return 'ongoing';
  }

  function getInitialBoard() {
    const board = Array(10).fill(null).map(() => Array(9).fill(null));
    board[0][0] = 'bR'; board[0][1] = 'bN'; board[0][2] = 'bB';
    board[0][3] = 'bA'; board[0][4] = 'bK'; board[0][5] = 'bA';
    board[0][6] = 'bB'; board[0][7] = 'bN'; board[0][8] = 'bR';
    board[2][1] = 'bC'; board[2][7] = 'bC';
    board[3][0] = 'bP'; board[3][2] = 'bP'; board[3][4] = 'bP';
    board[3][6] = 'bP'; board[3][8] = 'bP';
    board[9][0] = 'rR'; board[9][1] = 'rN'; board[9][2] = 'rB';
    board[9][3] = 'rA'; board[9][4] = 'rK'; board[9][5] = 'rA';
    board[9][6] = 'rB'; board[9][7] = 'rN'; board[9][8] = 'rR';
    board[7][1] = 'rC'; board[7][7] = 'rC';
    board[6][0] = 'rP'; board[6][2] = 'rP'; board[6][4] = 'rP';
    board[6][6] = 'rP'; board[6][8] = 'rP';
    return board;
  }

  return {
    pieceColor, pieceType, cloneBoard, applyMove,
    isInCheck, getPseudoLegalMoves, getLegalMoves,
    getAllLegalMoves, getGameStatus, getInitialBoard
  };
})();
