// Input: keyboard state plus mouse clicks, translated into game intents.
// WASD and arrows move, Shift sneaks, M mutes, P or Escape pauses,
// R restarts a level, Enter or Space confirms on menus. A mouse click
// during play throws a coin at that spot; on menus it presses buttons.

export function createInput(canvas) {
  const keys = new Set();
  // One-shot actions live here, apart from the held-keys set: a fast tap
  // whose keyup lands before the next animation frame must still register.
  const pressedActions = new Set();
  const clicks = [];
  let anyKey = null;

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyM: 'mute', KeyP: 'pause', Escape: 'pause',
    KeyR: 'restart', Enter: 'confirm', Space: 'confirm',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'confirm'].includes(action)) e.preventDefault();
    keys.add(action);
    if (!e.repeat) {
      pressedActions.add(action);
      anyKey = action;
    }
  }

  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    clicks.push({
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    });
  }

  function onBlur() {
    keys.clear();
    pressedActions.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onClick);

  return {
    // Held movement direction, normalized, or null when idle.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() {
      return keys.has('sneak');
    },
    // Consume one pending one-shot action (mute/pause/restart/confirm).
    takeAction(name) {
      if (pressedActions.has(name)) {
        pressedActions.delete(name);
        return true;
      }
      return false;
    },
    pressedAny() {
      const v = anyKey;
      anyKey = null;
      return v;
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('mousedown', onClick);
    },
  };
}
