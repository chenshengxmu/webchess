// 游戏状态机

const Game = (() => {
  let state = {
    board: null,
    currentTurn: 'red',
    selectedCell: null,
    legalMoves: [],
    history: [],        // [{board, currentTurn, lastMove}, ...]
    status: 'ongoing',  // 'ongoing'|'check'|'checkmate'|'stalemate'
    difficulty: 'medium',
    lastMove: null,
    checkKing: null,    // 被将的将/帅位置
    flashPhase: false,
    aiThinking: false
  };

  function getState() { return state; }

  function init(difficulty) {
    state.board = Rules.getInitialBoard();
    state.currentTurn = 'red';
    state.selectedCell = null;
    state.legalMoves = [];
    state.history = [];
    state.status = 'ongoing';
    state.difficulty = difficulty || state.difficulty;
    state.lastMove = null;
    state.checkKing = null;
    state.flashPhase = false;
    state.aiThinking = false;
  }

  function setDifficulty(d) {
    state.difficulty = d;
  }

  function selectCell(row, col) {
    if (state.status === 'checkmate' || state.status === 'stalemate') return false;
    if (state.currentTurn !== 'red') return false; // 只有红方（人类）可以操作

    const piece = state.board[row][col];

    // 如果已选中棋子，检查是否点击了合法落点
    if (state.selectedCell) {
      const [sr, sc] = state.selectedCell;
      const isLegal = state.legalMoves.some(([r, c]) => r === row && c === col);

      if (isLegal) {
        return { type: 'move', from: [sr, sc], to: [row, col] };
      }

      // 点击己方其他棋子，切换选中
      if (piece && Rules.pieceColor(piece) === 'red') {
        state.selectedCell = [row, col];
        state.legalMoves = Rules.getLegalMoves(state.board, row, col);
        return { type: 'select' };
      }

      // 点击其他位置，取消选中
      state.selectedCell = null;
      state.legalMoves = [];
      return { type: 'deselect' };
    }

    // 未选中状态，选中红方棋子
    if (piece && Rules.pieceColor(piece) === 'red') {
      state.selectedCell = [row, col];
      state.legalMoves = Rules.getLegalMoves(state.board, row, col);
      return { type: 'select' };
    }

    return false;
  }

  function applyHumanMove(from, to) {
    // 保存历史
    state.history.push({
      board: state.board.map(r => r.slice()),
      currentTurn: state.currentTurn,
      lastMove: state.lastMove,
      status: state.status,
      checkKing: state.checkKing
    });

    state.board = Rules.applyMove(state.board, from, to);
    state.lastMove = { from, to };
    state.selectedCell = null;
    state.legalMoves = [];
    state.currentTurn = 'black';

    // 检查游戏状态
    updateStatus();
  }

  function applyAIMove(from, to) {
    state.board = Rules.applyMove(state.board, from, to);
    state.lastMove = { from, to };
    state.currentTurn = 'red';
    state.aiThinking = false;

    updateStatus();
  }

  function updateStatus() {
    const newStatus = Rules.getGameStatus(state.board, state.currentTurn);
    state.status = newStatus;

    // 更新将军位置
    if (newStatus === 'check' || newStatus === 'checkmate') {
      const kingPiece = state.currentTurn === 'red' ? 'rK' : 'bK';
      for (let r = 0; r <= 9; r++) {
        for (let c = 0; c <= 8; c++) {
          if (state.board[r][c] === kingPiece) {
            state.checkKing = [r, c];
            return;
          }
        }
      }
    } else {
      state.checkKing = null;
    }
  }

  function undoLastMove() {
    // 悔棋：撤回人类+AI 各一步（共两步）
    const steps = Math.min(2, state.history.length);
    if (steps === 0) return false;

    for (let i = 0; i < steps; i++) {
      const prev = state.history.pop();
      state.board = prev.board;
      state.currentTurn = prev.currentTurn;
      state.lastMove = prev.lastMove;
      state.status = prev.status;
      state.checkKing = prev.checkKing;
    }

    state.selectedCell = null;
    state.legalMoves = [];
    state.aiThinking = false;
    return true;
  }

  function setAIThinking(v) {
    state.aiThinking = v;
  }

  function setFlashPhase(v) {
    state.flashPhase = v;
  }

  return {
    getState, init, setDifficulty,
    selectCell, applyHumanMove, applyAIMove,
    undoLastMove, setAIThinking, setFlashPhase
  };
})();
