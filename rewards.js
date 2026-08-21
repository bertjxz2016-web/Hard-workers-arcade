// Shared Pixel Party Points and temporary boosts.
(function () {
  const cost = 150;
  const thresholds = { Snake: 100, 'Pac-Man': 200, Tetris: 999999, '2048': 200, 'Block Breaker': 150 };
  let points = Number(localStorage.getItem('pixelPartyPoints') || 0);
  const earned = JSON.parse(localStorage.getItem('pixelPartyEarned') || '{}');
  let boostTimer;
  let lastScore = 0;
  let adjustingScore = false;
  let sessionAwarded = false;

  const badge = document.createElement('div');
  badge.className = 'party-points';
  document.body.appendChild(badge);

  function save() {
    localStorage.setItem('pixelPartyPoints', points);
    localStorage.setItem('pixelPartyEarned', JSON.stringify(earned));
    const label = `★ PARTY POINTS: ${points}`;
    if (badge.textContent !== label) badge.textContent = label;
  }

  function currentGame() { return document.querySelector('#game h2')?.textContent || ''; }
  function award(gameName) {
    if (sessionAwarded) return;
    points += 100;
    sessionAwarded = true;
    save();
    const score = document.getElementById('score');
    if (score) score.textContent += ' · +100 PARTY POINTS!';
  }

  window.usePartyBoost = function () {
    if (points < cost) { alert(`You need ${cost} Party Points for a boost.`); return; }
    points -= cost; save();
    window.partyBoostActive = true;
    const score = document.getElementById('score');
    if (score) score.textContent += ' · BOOST ACTIVE!';
    document.body.classList.add('boosted');
    clearTimeout(boostTimer);
    boostTimer = setTimeout(() => { document.body.classList.remove('boosted'); window.partyBoostActive = false; }, 15000);
    document.dispatchEvent(new CustomEvent('partyboost', { detail: { game: currentGame(), points: 50 } }));
  };

  function addControls() {
    let boost = document.querySelector('.boost-button');
    if (!document.querySelector('#game h2')) { if (boost) boost.remove(); return; }
    if (!boost) {
      boost = document.createElement('button');
      boost.className = 'boost-button';
      boost.textContent = `USE BOOST (${cost})`;
      boost.onclick = window.usePartyBoost;
      document.querySelector('#game').appendChild(boost);
    }
    save();
  }

  let lastGame = '';
  const observer = new MutationObserver(() => {
    addControls();
    const scoreText = document.getElementById('score')?.textContent || '';
    const match = scoreText.match(/SCORE:\s*(\d+)/);
    const gameName = currentGame();
    const currentScore = match ? Number(match[1]) : 0;
    if (gameName !== lastGame) { lastScore = currentScore; sessionAwarded = false; }
    if (window.partyBoostActive && !adjustingScore && currentScore > lastScore) {
      const doubled = currentScore + (currentScore - lastScore);
      adjustingScore = true;
      const scoreElement = document.getElementById('score');
      if (scoreElement) scoreElement.textContent = scoreElement.textContent.replace(/SCORE:\s*\d+/, `SCORE: ${doubled}`);
      setTimeout(() => { adjustingScore = false; }, 0);
      lastScore = doubled;
    } else {
      lastScore = currentScore;
    }
    if (gameName !== lastGame) { lastGame = gameName; window.tetrisStarted = 0; }
    if (match && gameName === 'Tetris') {
      if (!window.tetrisStarted) { window.tetrisStarted = Date.now(); setTimeout(() => award('Tetris'), 120000); }
    } else if (match && thresholds[gameName] && Number(match[1]) >= thresholds[gameName]) {
      award(gameName);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  save();
})();
