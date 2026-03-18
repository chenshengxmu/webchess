// 入口，事件绑定，流程控制

(function () {
  const canvas = document.getElementById('chess-board');

  // 初始化
  Board.init(canvas);
  UI.init();
  Game.init('medium');

  let renderScheduled = false;

  function scheduleRender() {
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(() => {
        renderScheduled = false;
        Board.render(Game.getState());
        UI.updateStatus(Game.getState());
      });
    }
  }

  // 初始渲染
  scheduleRender();

  // Canvas 点击事件
  canvas.addEventListener('click', async (e) => {
    const state = Game.getState();
    if (state.aiThinking || state.status === 'checkmate' || state.status === 'stalemate') return;
    if (state.currentTurn !== 'red') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const cell = Board.pixelToCell(px, py);
    if (!cell) return;

    const [row, col] = cell;
    const result = Game.selectCell(row, col);

    if (!result) {
      scheduleRender();
      return;
    }

    if (result.type === 'move') {
      await executeHumanMove(result.from, result.to);
    } else {
      scheduleRender();
    }
  });

  async function executeHumanMove(from, to) {
    const state = Game.getState();
    const piece = state.board[from[0]][from[1]];

    // 走棋动画
    await new Promise(resolve => {
      Board.animateMove(state.board, from, to, piece, resolve);
    });

    Game.applyHumanMove(from, to);
    scheduleRender();

    const newState = Game.getState();

    // 将军提示
    if (newState.status === 'check') {
      UI.startCheckFlash(phase => {
        Game.setFlashPhase(phase);
        scheduleRender();
      });
    }

    // 游戏结束
    if (newState.status === 'checkmate') {
      setTimeout(() => UI.showMessage('将死！红方胜！'), 300);
      return;
    }
    if (newState.status === 'stalemate') {
      setTimeout(() => UI.showMessage('逼和！'), 300);
      return;
    }

    // 触发 AI 走棋
    await triggerAIMove();
  }

  async function triggerAIMove() {
    Game.setAIThinking(true);
    scheduleRender();

    try {
      const state = Game.getState();
      const response = await fetch('/api/ai-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: state.board, difficulty: state.difficulty })
      });

      if (!response.ok) throw new Error('AI 请求失败');

      const data = await response.json();

      if (!data.from || !data.to) {
        // AI 无法走棋（将死）
        Game.setAIThinking(false);
        scheduleRender();
        setTimeout(() => UI.showMessage('黑方无子可走！红方胜！'), 300);
        return;
      }

      const currentState = Game.getState();
      const piece = currentState.board[data.from[0]][data.from[1]];

      // AI 走棋动画
      await new Promise(resolve => {
        Board.animateMove(currentState.board, data.from, data.to, piece, resolve);
      });

      Game.applyAIMove(data.from, data.to);
      scheduleRender();

      const afterState = Game.getState();

      // 将军提示
      if (afterState.status === 'check') {
        UI.startCheckFlash(phase => {
          Game.setFlashPhase(phase);
          scheduleRender();
        });
        setTimeout(() => UI.showMessage('将！', true), 100);
      }

      // 游戏结束
      if (afterState.status === 'checkmate') {
        setTimeout(() => UI.showMessage('将死！黑方胜！'), 300);
      } else if (afterState.status === 'stalemate') {
        setTimeout(() => UI.showMessage('逼和！'), 300);
      }

    } catch (err) {
      console.error('AI 错误:', err);
      Game.setAIThinking(false);
      scheduleRender();
    }
  }

  // 悔棋按钮
  document.getElementById('undo-btn').addEventListener('click', () => {
    UI.stopCheckFlash();
    const success = Game.undoLastMove();
    if (success) {
      scheduleRender();
    }
  });

  // 重新开始按钮
  document.getElementById('restart-btn').addEventListener('click', () => {
    UI.stopCheckFlash();
    UI.hideMessage();
    const state = Game.getState();
    Game.init(state.difficulty);
    scheduleRender();
  });

  // 难度切换
  document.getElementById('difficulty-select').addEventListener('change', (e) => {
    Game.setDifficulty(e.target.value);
  });

  // 消息关闭
  document.getElementById('message-dismiss').addEventListener('click', () => {
    UI.hideMessage();
  });

  // 窗口大小变化时重绘
  window.addEventListener('resize', () => {
    Board.resize();
    scheduleRender();
  });

})();
