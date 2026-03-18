// Canvas 棋盘渲染

const Board = (() => {
  const COLS = 9;
  const ROWS = 10;
  const PADDING = 40;

  // 棋子汉字映射
  const PIECE_CHARS = {
    rK: '帅', rA: '仕', rB: '相', rN: '马', rR: '车', rC: '炮', rP: '兵',
    bK: '将', bA: '士', bB: '象', bN: '马', bR: '车', bC: '炮', bP: '卒'
  };

  let canvas, ctx, cellSize, offsetX, offsetY;
  let animating = false;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    const container = canvas.parentElement;
    const maxW = Math.min(container.clientWidth - 20, 560);
    const maxH = Math.min(window.innerHeight - 200, 620);
    const sizeByW = (maxW - PADDING * 2) / (COLS - 1);
    const sizeByH = (maxH - PADDING * 2) / (ROWS - 1);
    cellSize = Math.floor(Math.min(sizeByW, sizeByH));
    const boardW = cellSize * (COLS - 1) + PADDING * 2;
    const boardH = cellSize * (ROWS - 1) + PADDING * 2;
    canvas.width = boardW;
    canvas.height = boardH;
    offsetX = PADDING;
    offsetY = PADDING;
  }

  function cellToPixel(row, col) {
    return {
      x: offsetX + col * cellSize,
      y: offsetY + row * cellSize
    };
  }

  function pixelToCell(px, py) {
    const col = Math.round((px - offsetX) / cellSize);
    const row = Math.round((py - offsetY) / cellSize);
    if (row < 0 || row > 9 || col < 0 || col > 8) return null;
    return [row, col];
  }

  function drawBoard() {
    const w = canvas.width, h = canvas.height;

    // 背景
    ctx.fillStyle = '#dcb967';
    ctx.fillRect(0, 0, w, h);

    // 木纹效果
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(180, 120, 40, ${0.04 + i * 0.01})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i * h / 8);
      ctx.lineTo(w, i * h / 8 + 10);
      ctx.stroke();
    }

    // 棋盘格线
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;

    // 竖线
    for (let c = 0; c < COLS; c++) {
      const x = offsetX + c * cellSize;
      if (c === 0 || c === COLS - 1) {
        // 边线：完整竖线
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + (ROWS - 1) * cellSize);
        ctx.stroke();
      } else {
        // 内部竖线：楚河汉界断开
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + 4 * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, offsetY + 5 * cellSize);
        ctx.lineTo(x, offsetY + (ROWS - 1) * cellSize);
        ctx.stroke();
      }
    }

    // 横线
    for (let r = 0; r < ROWS; r++) {
      const y = offsetY + r * cellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + (COLS - 1) * cellSize, y);
      ctx.stroke();
    }

    // 九宫格斜线
    drawPalaceLines('red');
    drawPalaceLines('black');

    // 楚河汉界
    drawRiverText();

    // 炮/兵位置标记
    drawPositionMarkers();
  }

  function drawPalaceLines(color) {
    const r1 = color === 'red' ? 7 : 0;
    const r2 = color === 'red' ? 9 : 2;
    const c1 = 3, c2 = 5;
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;

    // 左上到右下
    ctx.beginPath();
    ctx.moveTo(offsetX + c1 * cellSize, offsetY + r1 * cellSize);
    ctx.lineTo(offsetX + c2 * cellSize, offsetY + r2 * cellSize);
    ctx.stroke();

    // 右上到左下
    ctx.beginPath();
    ctx.moveTo(offsetX + c2 * cellSize, offsetY + r1 * cellSize);
    ctx.lineTo(offsetX + c1 * cellSize, offsetY + r2 * cellSize);
    ctx.stroke();
  }

  function drawRiverText() {
    const riverY = offsetY + 4.5 * cellSize;
    ctx.font = `bold ${Math.floor(cellSize * 0.5)}px KaiTi, STKaiti, serif`;
    ctx.fillStyle = '#8B4513';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 楚河（左侧）
    const leftX = offsetX + 2 * cellSize;
    ctx.save();
    ctx.translate(leftX, riverY);
    ctx.fillText('楚', -cellSize * 0.3, 0);
    ctx.fillText('河', cellSize * 0.3, 0);
    ctx.restore();

    // 汉界（右侧）
    const rightX = offsetX + 6 * cellSize;
    ctx.save();
    ctx.translate(rightX, riverY);
    ctx.fillText('汉', -cellSize * 0.3, 0);
    ctx.fillText('界', cellSize * 0.3, 0);
    ctx.restore();
  }

  function drawPositionMarkers() {
    // 炮位标记
    const cannonPositions = [[2,1],[2,7],[7,1],[7,7]];
    // 兵/卒位标记
    const pawnPositions = [
      [3,0],[3,2],[3,4],[3,6],[3,8],
      [6,0],[6,2],[6,4],[6,6],[6,8]
    ];

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;

    for (const [r, c] of [...cannonPositions, ...pawnPositions]) {
      drawCrossMarker(r, c);
    }
  }

  function drawCrossMarker(row, col) {
    const { x, y } = cellToPixel(row, col);
    const s = cellSize * 0.12;
    const g = cellSize * 0.06;

    // 四个角的小十字标记
    const corners = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of corners) {
      const cx = x + dc * g;
      const cy = y + dr * g;

      ctx.beginPath();
      if (dc < 0) {
        ctx.moveTo(cx - s, cy);
        ctx.lineTo(cx, cy);
      } else {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + s, cy);
      }
      ctx.stroke();

      ctx.beginPath();
      if (dr < 0) {
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx, cy);
      } else {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + s);
      }
      ctx.stroke();
    }
  }

  function drawPiece(row, col, piece, highlight, flashRed) {
    const { x, y } = cellToPixel(row, col);
    drawPieceAt(x, y, piece, highlight, flashRed);
  }

  function drawPieceAt(x, y, piece, highlight, flashRed) {
    const radius = cellSize * 0.42;
    const color = piece[0] === 'r' ? 'red' : 'black';

    ctx.save();

    // 外圈阴影
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 棋子底色
    const gradient = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, radius * 0.1, x, y, radius);
    if (color === 'red') {
      gradient.addColorStop(0, '#fff0e0');
      gradient.addColorStop(0.5, '#f5c87a');
      gradient.addColorStop(1, '#c8860a');
    } else {
      gradient.addColorStop(0, '#e8e8e8');
      gradient.addColorStop(0.5, '#888888');
      gradient.addColorStop(1, '#222222');
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // 外圈
    ctx.strokeStyle = color === 'red' ? '#8B2000' : '#111';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 内圈
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.82, 0, Math.PI * 2);
    ctx.strokeStyle = color === 'red' ? '#c04000' : '#444';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 选中高亮
    if (highlight) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#00cc44';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 将军闪烁
    if (flashRed) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 棋子文字
    ctx.font = `bold ${Math.floor(radius * 1.1)}px KaiTi, STKaiti, FangSong, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color === 'red' ? '#8B0000' : '#f0f0f0';
    ctx.fillText(PIECE_CHARS[piece] || '?', x, y + 1);

    ctx.restore();
  }

  function drawLegalMoveIndicator(row, col) {
    const { x, y } = cellToPixel(row, col);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, cellSize * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 200, 80, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 150, 50, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawLastMoveIndicator(from, to) {
    for (const [r, c] of [from, to]) {
      const { x, y } = cellToPixel(r, c);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  function render(state) {
    if (animating) return;
    drawBoard();

    const { board, selectedCell, legalMoves, lastMove, checkKing, flashPhase } = state;

    // 上一步走法高亮
    if (lastMove) {
      drawLastMoveIndicator(lastMove.from, lastMove.to);
    }

    // 合法落点
    if (legalMoves) {
      for (const [r, c] of legalMoves) {
        if (!board[r][c]) {
          drawLegalMoveIndicator(r, c);
        }
      }
    }

    // 棋子
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
        const isLegalTarget = legalMoves && legalMoves.some(([lr, lc]) => lr === r && lc === c);
        const isCheckKing = checkKing && checkKing[0] === r && checkKing[1] === c;
        const flash = isCheckKing && flashPhase;
        drawPiece(r, c, piece, isSelected, flash);

        // 可吃子的合法落点圆圈
        if (isLegalTarget) {
          const { x, y } = cellToPixel(r, c);
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.42, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 200, 80, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // 走棋动画
  function animateMove(board, from, to, piece, onComplete) {
    animating = true;
    const startPos = cellToPixel(from[0], from[1]);
    const endPos = cellToPixel(to[0], to[1]);
    const duration = 200; // ms
    const startTime = performance.now();

    // 绘制不含动画棋子的棋盘
    const tempBoard = board.map(row => row.slice());
    tempBoard[from[0]][from[1]] = null;

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut

      drawBoard();

      // 绘制静态棋子
      for (let r = 0; r <= 9; r++) {
        for (let c = 0; c <= 8; c++) {
          const p = tempBoard[r][c];
          if (p) drawPiece(r, c, p, false, false);
        }
      }

      // 绘制动画棋子
      const x = startPos.x + (endPos.x - startPos.x) * ease;
      const y = startPos.y + (endPos.y - startPos.y) * ease;
      drawPieceAt(x, y, piece, false, false);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        animating = false;
        onComplete();
      }
    }

    requestAnimationFrame(frame);
  }

  return {
    init, resize, render, animateMove,
    cellToPixel, pixelToCell,
    get cellSize() { return cellSize; }
  };
})();
