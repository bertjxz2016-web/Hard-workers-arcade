// Keep keyboard controls isolated to the currently open game.
(function () {
  const oldKeys = keys;
  const oldOpenGame = openGame;
  const handlers = [];
  keys = function (handler) {
    handlers.push(handler);
    oldKeys(handler);
  };
  openGame = function (type) {
    handlers.splice(0).forEach(handler => document.removeEventListener('keydown', handler));
    oldOpenGame(type);
  };
})();
