// 非棋盘 UI（提示、动画、状态显示）

const UI = (() => {
  let elements = {};
  let flashTimer = null;
  let flashCount = 0;

  function init() {
    elements = {
      statusText: document.getElementById('status-text'),
      turnIndicator: document.getElementById('turn-indicator'),
      thinkingIndicator: document.getElementById('thinking-indicator'),
      difficultySelect: document.getElementById('difficulty-select'),
      undoBtn: document.getElementById('undo-btn'),
      restartBtn: document.getElementById('restart-btn'),
      messageOverlay: document.getElementById('message-overlay'),
      messageText: document.getElementById('message-text'),
      messageDismiss: document.getElementById('message-dismiss')
    };
  }

  function updateStatus(state) {
    const { status, currentTurn, aiThinking } = state;

    // 回合指示
    if (elements.turnIndicator) {
      elements.turnIndicator.className = 'turn-indicator ' + (currentTurn === 'red' ? 'red-turn' : 'black-turn');
      elements.turnIndicator.textContent = currentTurn === 'red' ? '红方走棋' : '黑方走棋';
    }

    // 状态文字
    let statusMsg = '';
    if (aiThinking) {
      statusMsg = 'AI 思考中...';
    } else if (status === 'check') {
      statusMsg = currentTurn === 'red' ? '⚠ 红方被将！' : '⚠ 黑方被将！';
    } else if (status === 'checkmate') {
      const winner = currentTurn === 'red' ? '黑方' : '红方';
      statusMsg = `${winner}胜！`;
    } else if (status === 'stalemate') {
      statusMsg = '逼和！';
    } else {
      statusMsg = currentTurn === 'red' ? '请走棋' : 'AI 思考中...';
    }

    if (elements.statusText) {
      elements.statusText.textContent = statusMsg;
    }

    // AI 思考动画
    if (elements.thinkingIndicator) {
      elements.thinkingIndicator.style.display = aiThinking ? 'flex' : 'none';
    }

    // 悔棋按钮
    if (elements.undoBtn) {
      elements.undoBtn.disabled = aiThinking || status === 'checkmate' || status === 'stalemate';
    }
  }

  function showMessage(text, autoHide) {
    if (!elements.messageOverlay) return;
    elements.messageText.textContent = text;
    elements.messageOverlay.classList.add('visible');

    if (autoHide) {
      setTimeout(() => hideMessage(), 2000);
    }
  }

  function hideMessage() {
    if (elements.messageOverlay) {
      elements.messageOverlay.classList.remove('visible');
    }
  }

  function startCheckFlash(callback) {
    stopCheckFlash();
    flashCount = 0;
    flashTimer = setInterval(() => {
      flashCount++;
      callback(flashCount % 2 === 1);
      if (flashCount >= 8) stopCheckFlash();
    }, 250);
  }

  function stopCheckFlash() {
    if (flashTimer) {
      clearInterval(flashTimer);
      flashTimer = null;
    }
  }

  function setDifficulty(d) {
    if (elements.difficultySelect) {
      elements.difficultySelect.value = d;
    }
  }

  return { init, updateStatus, showMessage, hideMessage, startCheckFlash, stopCheckFlash, setDifficulty };
})();
