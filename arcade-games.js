function installArcadeGames() {
  const arcadeModal = document.getElementById('gameModal');
  const arcadeBox = arcadeModal.querySelector('.game-box');
  let cleanupGame = () => {};

  const gameInfo = {
    skee: {
      title: 'Skee-Ball Showdown',
      description: 'Land inside a numbered circle to score it. Smaller circles are worth more.',
      meta: 'REAL CIRCLE SCORING',
      preview: 'skee-preview'
    },
    air: {
      title: 'Air Hockey Blitz',
      description: 'Fast reflex match against AI or a second player. Win by score before the clock runs out.',
      meta: 'AI OR 2 PLAYER',
      preview: 'air-preview'
    },
    claw: {
      title: 'Claw Grab',
      description: 'Line up a narrow grab window and commit to the drop. The machine keeps its secrets.',
      meta: 'TIGHT GRAB WINDOW',
      preview: 'claw-preview'
    },
    coin: {
      title: 'Coin Push',
      description: 'Drop coins into the lanes and push prizes off the edge for a satisfying payout.',
      meta: 'PRIZE PUSHER',
      preview: 'coin-preview'
    },
    tower: {
      title: 'Crazy Tower',
      description: 'Stack ten floors while the required overlap tightens and every bounce accelerates.',
      meta: '50–70% OVERLAP',
      preview: 'tower-preview'
    }
  };

  function topbar(showBack) {
    return (
      '<div class="arcade-topbar">' +
        (showBack
          ? '<button class="arcade-back" type="button">← ALL GAMES</button>'
          : '<button class="arcade-logo" type="button">★ BRANDON\'S ARCADE</button>') +
        '<div class="arcade-balances">' +
          '<div class="arcade-balance"><b data-arcade-tokens>0</b><small>🪙 TOKENS</small></div>' +
          '<div class="arcade-balance"><b data-arcade-tickets>0</b><small>🎟️ TICKETS</small></div>' +
        '</div>' +
        '<button class="arcade-close" type="button" aria-label="Close arcade">×</button>' +
      '</div>'
    );
  }

  function refreshArcadeBalances() {
    arcadeBox.querySelectorAll('[data-arcade-tokens]').forEach(element => {
      element.textContent = tokens;
    });
    arcadeBox.querySelectorAll('[data-arcade-tickets]').forEach(element => {
      element.textContent = tickets;
    });
  }

  function bindTopbar(showBack) {
    arcadeBox.querySelector('.arcade-close').addEventListener('click', close);
    if (showBack) {
      arcadeBox.querySelector('.arcade-back').addEventListener('click', showLobby);
    } else {
      arcadeBox.querySelector('.arcade-logo').addEventListener('click', showLobby);
    }
    refreshArcadeBalances();
  }

  function spendToken() {
    if (tokens < 1) {
      showToast('Complete a task to earn another game token.');
      return false;
    }

    tokens -= 1;
    sync();
    refreshArcadeBalances();
    return true;
  }

  function awardTickets(amount, gameName) {
    tickets += amount;
    sync();
    refreshArcadeBalances();
    showToast(gameName + ' paid out +' + amount + ' tickets!');
  }

  function highScoreKey(game) {
    const scoreVersion = game === 'skee' ? 'skee_low_values' : game;
    return 'taskArcadeHigh_' + scoreVersion;
  }

  function getHighScore(game) {
    return Number(localStorage.getItem(highScoreKey(game))) || 0;
  }

  function saveHighScore(game, value) {
    if (value > getHighScore(game)) {
      localStorage.setItem(highScoreKey(game), String(value));
    }
    return getHighScore(game);
  }

  function open() {
    arcadeModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    showLobby();
  }

  function close() {
    cleanupGame();
    cleanupGame = () => {};
    arcadeModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showLobby() {
    cleanupGame();
    cleanupGame = () => {};
    arcadeBox.className = 'game-box arcade-box';
    arcadeBox.innerHTML =
      topbar(false) +
      '<section class="arcade-lobby">' +
        '<div class="arcade-lobby-intro">' +
          '<div class="kicker">03 / ARCADE FLOOR</div>' +
          '<h2>Pick your <span>challenge.</span></h2>' +
          '<p>Every round costs one task token. Skill turns that token into tickets for the Prize Vault.</p>' +
        '</div>' +
        '<div class="arcade-game-grid">' +
          Object.entries(gameInfo).map(([id, game]) =>
            '<button class="arcade-game-card" type="button" data-game="' + id + '">' +
              '<div class="game-preview ' + game.preview + '"></div>' +
              '<div class="arcade-game-card-copy">' +
                '<b>' + game.title + '<span>→</span></b>' +
                '<small>' + game.description + '</small>' +
                '<div class="card-meta"><span>' + game.meta + '</span><span>HIGH ' + getHighScore(id) + '</span></div>' +
              '</div>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<div class="arcade-rule"><span>🪙 <b>ONE TOKEN = ONE FULL ROUND</b></span><span>Scores automatically pay out as 🎟️ tickets.</span></div>' +
      '</section>';

    bindTopbar(false);
    arcadeBox.querySelectorAll('[data-game]').forEach(card => {
      card.addEventListener('click', () => showGame(card.dataset.game));
    });
  }

  function showGame(game) {
    cleanupGame();
    cleanupGame = () => {};
    if (game === 'skee') setupSkeeBall();
    if (game === 'air') setupAirHockey();
    if (game === 'claw') setupClawGrab();
    if (game === 'coin') setupCoinPush();
    if (game === 'tower') setupCrazyTower();
  }

  function setupAirHockey() {
    arcadeBox.innerHTML =
      topbar(true) +
      '<section class="arcade-game">' +
        '<div class="game-intro">' +
          '<div><div class="kicker">REFLEX / FAST PLAY</div><h2>Air Hockey <span>Blitz</span></h2><p>Block the puck, chase the rebound, and race the clock. In AI mode the opponent reads the puck and in 2-player mode the second paddle uses the keyboard.</p></div>' +
          '<div class="game-stats">' +
            '<div class="game-stat"><b id="airPlayerScore">0</b><small>YOU</small></div>' +
            '<div class="game-stat"><b id="airOpponentScore">0</b><small>OPPONENT</small></div>' +
            '<div class="game-stat"><b id="airTime">45</b><small>SECONDS</small></div>' +
            '<div class="game-stat"><b id="airModeLabel">VS AI</b><small>MODE</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="game-panel">' +
          '<div class="air-hockey-cabinet" id="airBoard" tabindex="0" aria-label="Air hockey table">' +
            '<div class="air-center-line"></div>' +
            '<div class="air-goal left"></div>' +
            '<div class="air-goal right"></div>' +
            '<div class="air-puck" id="airPuck"></div>' +
            '<div class="air-paddle player" id="airPlayerPaddle"></div>' +
            '<div class="air-paddle opponent" id="airOpponentPaddle"></div>' +
          '</div>' +
          '<div class="game-status" id="airStatus">Use W/S or the arrow keys to move. Click the board to focus it, then start the round.</div>' +
          '<div class="game-actions">' +
            '<button class="game-action secondary" id="airMode" type="button">SWITCH TO 2 PLAYER</button>' +
            '<button class="game-action" id="airStart" type="button">START ROUND · 1 TOKEN</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    bindTopbar(true);

    const board = arcadeBox.querySelector('#airBoard');
    const puckElement = arcadeBox.querySelector('#airPuck');
    const playerPaddle = arcadeBox.querySelector('#airPlayerPaddle');
    const opponentPaddle = arcadeBox.querySelector('#airOpponentPaddle');
    const startButton = arcadeBox.querySelector('#airStart');
    const modeButton = arcadeBox.querySelector('#airMode');
    const statusElement = arcadeBox.querySelector('#airStatus');
    const playerScoreElement = arcadeBox.querySelector('#airPlayerScore');
    const opponentScoreElement = arcadeBox.querySelector('#airOpponentScore');
    const timeElement = arcadeBox.querySelector('#airTime');
    const modeLabel = arcadeBox.querySelector('#airModeLabel');
    const BOARD_WIDTH = 640;
    const BOARD_HEIGHT = 320;
    const PUCK_RADIUS = 10;
    const PADDLE_RADIUS = 26;
    const LEFT_X = 58;
    const RIGHT_X = BOARD_WIDTH - 58;
    const GOAL_TOP = BOARD_HEIGHT / 2 - 52;
    const GOAL_BOTTOM = BOARD_HEIGHT / 2 + 52;
    let mode = 'ai';
    let running = false;
    let playerScore = 0;
    let opponentScore = 0;
    let timeLeft = 45;
    let roundStart = 0;
    let lastFrame = 0;
    let raf = 0;
    let restartTimer = 0;
    let playerY = BOARD_HEIGHT / 2;
    let opponentY = BOARD_HEIGHT / 2;
    let puck = { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2, vx: 220, vy: 74 };
    const keys = { w: false, s: false, up: false, down: false };
    const pointerActive = { value: false };

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function render() {
      puckElement.style.left = puck.x / BOARD_WIDTH * 100 + '%';
      puckElement.style.top = puck.y / BOARD_HEIGHT * 100 + '%';
      playerPaddle.style.left = LEFT_X / BOARD_WIDTH * 100 + '%';
      playerPaddle.style.top = playerY / BOARD_HEIGHT * 100 + '%';
      opponentPaddle.style.left = RIGHT_X / BOARD_WIDTH * 100 + '%';
      opponentPaddle.style.top = opponentY / BOARD_HEIGHT * 100 + '%';
      playerScoreElement.textContent = playerScore;
      opponentScoreElement.textContent = opponentScore;
      timeElement.textContent = Math.max(0, Math.ceil(timeLeft));
      modeLabel.textContent = mode === 'ai' ? 'VS AI' : '2 PLAYER';
    }

    function resetPuck(direction) {
      puck.x = BOARD_WIDTH / 2;
      puck.y = BOARD_HEIGHT / 2;
      puck.vx = direction * 170;
      puck.vy = direction > 0 ? 52 : -52;
    }

    function finishRound() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(restartTimer);
      const payout = Math.max(5, playerScore * 14 + Math.max(0, Math.floor(timeLeft * 2)) + Math.max(0, playerScore - opponentScore) * 6);
      const high = saveHighScore('air', playerScore);
      awardTickets(payout, 'Air Hockey');
      showToast('Air Hockey finished. ' + playerScore + ' to ' + opponentScore + ' paid +' + payout + ' tickets.');
      arcadeBox.querySelector('#airMode').disabled = false;
      startButton.disabled = false;
      startButton.textContent = 'PLAY AGAIN · 1 TOKEN';
      statusElement.textContent = 'Final score: ' + playerScore + ' to ' + opponentScore + '. Best score: ' + high + '.';
      render();
    }

    function goal(scoredByPlayer) {
      if (scoredByPlayer) {
        playerScore += 1;
        statusElement.textContent = 'Goal! You scored. Resetting the puck to keep the pace up.';
        resetPuck(-1);
      } else {
        opponentScore += 1;
        statusElement.textContent = 'The other side scored. Get the next rebound back under control.';
        resetPuck(1);
      }

      if (playerScore >= 7 || opponentScore >= 7) {
        timeLeft = 0;
        render();
        finishRound();
      }
    }

    function step(now) {
      if (!running) return;
      if (!lastFrame) lastFrame = now;
      const delta = Math.min(.032, (now - lastFrame) / 1000);
      lastFrame = now;
      timeLeft = Math.max(0, 45 - (now - roundStart) / 1000);

      const playerTarget = clamp(playerY + ((keys.w ? -1 : 0) + (keys.s ? 1 : 0)) * 340 * delta, PADDLE_RADIUS, BOARD_HEIGHT - PADDLE_RADIUS);
      playerY = playerTarget;

      if (mode === 'ai') {
        const pursuit = puck.vx > 0 ? puck.y : BOARD_HEIGHT / 2;
        opponentY += clamp(pursuit - opponentY, -185 * delta, 185 * delta);
      } else {
        opponentY = clamp(opponentY + ((keys.up ? -1 : 0) + (keys.down ? 1 : 0)) * 280 * delta, PADDLE_RADIUS, BOARD_HEIGHT - PADDLE_RADIUS);
      }

      opponentY = clamp(opponentY, PADDLE_RADIUS, BOARD_HEIGHT - PADDLE_RADIUS);
      puck.x += puck.vx * delta;
      puck.y += puck.vy * delta;

      if (puck.y <= PUCK_RADIUS) {
        puck.y = PUCK_RADIUS;
        puck.vy *= -1;
      }
      if (puck.y >= BOARD_HEIGHT - PUCK_RADIUS) {
        puck.y = BOARD_HEIGHT - PUCK_RADIUS;
        puck.vy *= -1;
      }

      const playerHit = puck.vx < 0 && puck.x - PUCK_RADIUS <= LEFT_X + PADDLE_RADIUS + 2 && Math.abs(puck.y - playerY) <= PADDLE_RADIUS + PUCK_RADIUS;
      const opponentHit = puck.vx > 0 && puck.x + PUCK_RADIUS >= RIGHT_X - PADDLE_RADIUS - 2 && Math.abs(puck.y - opponentY) <= PADDLE_RADIUS + PUCK_RADIUS;

      if (playerHit) {
        puck.x = LEFT_X + PADDLE_RADIUS + PUCK_RADIUS + 1;
        puck.vx = Math.abs(puck.vx) * 1.01;
        puck.vy += (puck.y - playerY) * 3.2;
      }

      if (opponentHit) {
        puck.x = RIGHT_X - PADDLE_RADIUS - PUCK_RADIUS - 1;
        puck.vx = -Math.abs(puck.vx) * 1.01;
        puck.vy += (puck.y - opponentY) * 3.2;
      }

      puck.vx = clamp(puck.vx, -320, 320);
      puck.vy = clamp(puck.vy, -220, 220);

      if (puck.x < -20) {
        if (puck.y >= GOAL_TOP && puck.y <= GOAL_BOTTOM) {
          goal(false);
        } else {
          puck.x = PUCK_RADIUS;
          puck.vx = Math.abs(puck.vx);
          puck.vy *= .92;
        }
      }

      if (puck.x > BOARD_WIDTH + 20) {
        if (puck.y >= GOAL_TOP && puck.y <= GOAL_BOTTOM) {
          goal(true);
        } else {
          puck.x = BOARD_WIDTH - PUCK_RADIUS;
          puck.vx = -Math.abs(puck.vx);
          puck.vy *= .92;
        }
      }

      if (timeLeft <= 0) {
        finishRound();
        return;
      }

      render();
      raf = requestAnimationFrame(step);
    }

    function startRound() {
      if (!spendToken()) {
        statusElement.textContent = 'No tokens available. Finish a task to earn another round.';
        return;
      }

      running = true;
      playerScore = 0;
      opponentScore = 0;
      timeLeft = 45;
      roundStart = performance.now();
      lastFrame = 0;
      playerY = BOARD_HEIGHT / 2;
      opponentY = BOARD_HEIGHT / 2;
      resetPuck(1);
      startButton.disabled = true;
      modeButton.disabled = true;
      startButton.textContent = 'MATCH IN PROGRESS';
      statusElement.textContent = 'Keep the puck moving. Fast saves and clean rebounds matter more than holding still.';
      render();
      cancelAnimationFrame(raf);
      clearTimeout(restartTimer);
      raf = requestAnimationFrame(step);
    }

    function toggleMode() {
      if (running) return;
      mode = mode === 'ai' ? 'two' : 'ai';
      modeButton.textContent = mode === 'ai' ? 'SWITCH TO 2 PLAYER' : 'SWITCH TO VS AI';
      render();
      statusElement.textContent = mode === 'ai'
        ? 'AI mode is ready. The right paddle follows the puck with a little delay.'
        : '2-player mode is ready. Use W/S for the left paddle and Arrow Up/Down for the right one.';
    }

    function onKeydown(event) {
      if (event.key === 'w' || event.key === 'W') keys.w = true;
      if (event.key === 's' || event.key === 'S') keys.s = true;
      if (event.key === 'ArrowUp') keys.up = true;
      if (event.key === 'ArrowDown') keys.down = true;
      if ((event.key === ' ' || event.key === 'Enter') && !running && document.activeElement === board) {
        event.preventDefault();
        startRound();
      }
    }

    function onKeyup(event) {
      if (event.key === 'w' || event.key === 'W') keys.w = false;
      if (event.key === 's' || event.key === 'S') keys.s = false;
      if (event.key === 'ArrowUp') keys.up = false;
      if (event.key === 'ArrowDown') keys.down = false;
    }

    function moveFromPointer(event) {
      if (!pointerActive.value) return;
      const rect = board.getBoundingClientRect();
      const y = clamp((event.clientY - rect.top) / rect.height * BOARD_HEIGHT, PADDLE_RADIUS, BOARD_HEIGHT - PADDLE_RADIUS);
      playerY = y;
      if (mode === 'two') {
        opponentY = clamp((event.clientX - rect.left) / rect.width * BOARD_HEIGHT, PADDLE_RADIUS, BOARD_HEIGHT - PADDLE_RADIUS);
      }
      render();
    }

    board.addEventListener('pointerdown', event => {
      pointerActive.value = true;
      board.setPointerCapture(event.pointerId);
      moveFromPointer(event);
    });
    board.addEventListener('pointermove', moveFromPointer);
    board.addEventListener('pointerup', () => { pointerActive.value = false; });
    board.addEventListener('pointercancel', () => { pointerActive.value = false; });
    startButton.addEventListener('click', startRound);
    modeButton.addEventListener('click', toggleMode);
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('keyup', onKeyup);

    render();
    cleanupGame = () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(restartTimer);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('keyup', onKeyup);
    };
  }

  function setupSkeeBall() {
    arcadeBox.innerHTML =
      topbar(true) +
      '<section class="arcade-game">' +
        '<div class="game-intro">' +
          '<div><div class="kicker">SKILL / AIM + POWER</div><h2>Skee-Ball <span>Showdown</span></h2><p>The ball must land inside a circle to score its number. Lower-value circles are larger.</p></div>' +
          '<div class="game-stats">' +
            '<div class="game-stat"><b id="skeeScore">0</b><small>ROUND SCORE</small></div>' +
            '<div class="game-stat"><b id="skeeBalls">3</b><small>BALLS LEFT</small></div>' +
            '<div class="game-stat"><b id="skeeHigh">' + getHighScore('skee') + '</b><small>HIGH SCORE</small></div>' +
            '<div class="game-stat"><b id="skeePower">0%</b><small>POWER</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="game-panel">' +
          '<div class="skee-cabinet">' +
            '<div class="skee-backboard">' +
              '<div class="skee-pocket pocket-40" data-score="40">40</div>' +
              '<div class="skee-pocket pocket-25" data-score="25">25</div>' +
              '<div class="skee-pocket pocket-15" data-score="15">15</div>' +
              '<div class="skee-pocket pocket-10" data-score="10">10</div>' +
            '</div>' +
            '<div class="skee-lane"></div>' +
            '<div class="skee-ball locked" id="skeeBall"></div>' +
          '</div>' +
          '<div class="game-status" id="skeeStatus">Only a ball that finishes inside a circle earns that circle\'s points.</div>' +
          '<div class="game-actions skee-controls">' +
            '<button class="game-action secondary" id="skeeLeft" type="button" disabled>← AIM</button>' +
            '<button class="game-action" id="skeeShoot" type="button" disabled>HOLD TO CHARGE</button>' +
            '<button class="game-action secondary" id="skeeRight" type="button" disabled>AIM →</button>' +
          '</div>' +
          '<div class="game-actions"><button class="game-action" id="skeeStart" type="button">START ROUND · 1 TOKEN</button></div>' +
        '</div>' +
      '</section>';

    bindTopbar(true);

    const cabinet = arcadeBox.querySelector('.skee-cabinet');
    const backboard = arcadeBox.querySelector('.skee-backboard');
    const ballElement = arcadeBox.querySelector('#skeeBall');
    const targetElements = Array.from(arcadeBox.querySelectorAll('.skee-pocket'));
    const startButton = arcadeBox.querySelector('#skeeStart');
    const leftButton = arcadeBox.querySelector('#skeeLeft');
    const rightButton = arcadeBox.querySelector('#skeeRight');
    const shootButton = arcadeBox.querySelector('#skeeShoot');
    const scoreElement = arcadeBox.querySelector('#skeeScore');
    const ballsElement = arcadeBox.querySelector('#skeeBalls');
    const highElement = arcadeBox.querySelector('#skeeHigh');
    const powerElement = arcadeBox.querySelector('#skeePower');
    const statusElement = arcadeBox.querySelector('#skeeStatus');
    const timers = [];
    let roundActive = false;
    let rollingBall = false;
    let draggingBall = false;
    let startX = 0;
    let startY = 0;
    let pullX = 0;
    let pullY = 0;
    let shots = 0;
    let roundScore = 0;
    let buttonAim = 0;
    let chargingShot = false;
    let chargeStart = 0;
    let chargeFrame = 0;
    let buttonPower = 0;

    function setStatus(text, win) {
      statusElement.textContent = text;
      statusElement.classList.toggle('win', Boolean(win));
    }

    function resetSkeeBall() {
      cancelAnimationFrame(chargeFrame);
      rollingBall = false;
      draggingBall = false;
      chargingShot = false;
      buttonAim = 0;
      buttonPower = 0;
      shootButton.textContent = 'HOLD TO CHARGE';
      setPowerDisplay(0);
      ballElement.style.transition = 'none';
      ballElement.style.transform = 'translate(0, 0) scale(1)';
    }

    function enableShotControls(enabled) {
      leftButton.disabled = !enabled;
      rightButton.disabled = !enabled;
      shootButton.disabled = !enabled;
    }

    function setPowerDisplay(power) {
      const percentage = Math.round(Math.max(0, Math.min(1, power)) * 100);
      powerElement.textContent = percentage + '%';
      shootButton.style.setProperty('--charge', percentage + '%');
    }

    function startRound() {
      if (!spendToken()) {
        setStatus('No tokens available. Finish a task and come back.', false);
        return;
      }

      roundActive = true;
      shots = 0;
      roundScore = 0;
      scoreElement.textContent = 0;
      ballsElement.textContent = 3;
      ballElement.classList.remove('locked');
      enableShotControls(true);
      startButton.disabled = true;
      startButton.textContent = 'ROUND IN PROGRESS';
      targetElements.forEach(target => target.classList.remove('hit'));
      resetSkeeBall();
      setStatus('Ball 1 of 3 — aim for a circle. The power meter rises and falls, so release at the right moment.', false);
    }

    function beginDrag(event) {
      if (!roundActive || rollingBall) return;
      draggingBall = true;
      startX = event.clientX;
      startY = event.clientY;
      pullX = 0;
      pullY = 0;
      ballElement.style.transition = 'none';
      ballElement.setPointerCapture(event.pointerId);
      event.preventDefault();
    }

    function moveDrag(event) {
      if (!draggingBall) return;
      pullX = Math.max(-100, Math.min(100, event.clientX - startX));
      pullY = Math.max(0, Math.min(105, event.clientY - startY));
      setPowerDisplay(Math.min(1, pullY / 75));
      ballElement.style.transform = 'translate(' + pullX + 'px,' + pullY + 'px) scale(1.08)';
      event.preventDefault();
    }

    function releaseDrag(event) {
      if (!draggingBall) return;
      draggingBall = false;
      if (ballElement.hasPointerCapture?.(event.pointerId)) {
        ballElement.releasePointerCapture(event.pointerId);
      }

      if (pullY < 7) {
        ballElement.style.transition = 'transform .2s ease-out';
        ballElement.style.transform = 'translate(0,0) scale(1)';
        setPowerDisplay(0);
        setStatus('Pull farther backward before releasing.', false);
        return;
      }

      rollShot();
    }

    function calculateShotLanding(power) {
      const cabinetRect = cabinet.getBoundingClientRect();
      const backboardRect = backboard.getBoundingClientRect();
      const targets = targetElements.map(element => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          score: Number(element.dataset.score),
          x: rect.left + rect.width / 2 - cabinetRect.left,
          y: rect.top + rect.height / 2 - cabinetRect.top,
          radius: Math.max(6, Math.min(rect.width, rect.height) / 2 - 7)
        };
      });
      const highTarget = targets.find(target => target.score === 40);
      const lowestTargetY = Math.max(...targets.map(target => target.y));
      const largestRadius = Math.max(...targets.map(target => target.radius));
      const runwayY = lowestTargetY + largestRadius * .55;
      const landingX = cabinetRect.width / 2 + (pullX / 100) * backboardRect.width * .41;
      const landingY = runwayY - power * (runwayY - highTarget.y);
      const hitTarget = targets
        .map(target => ({
          ...target,
          distance: Math.hypot(landingX - target.x, landingY - target.y)
        }))
        .filter(target => target.distance <= target.radius)
        .sort((first, second) => first.distance / first.radius - second.distance / second.radius)[0];

      return {
        score: hitTarget?.score || 0,
        target: hitTarget?.element || null,
        translateX: landingX - (ballElement.offsetLeft + ballElement.offsetWidth / 2),
        translateY: landingY - (ballElement.offsetTop + ballElement.offsetHeight / 2)
      };
    }

    function rollShot() {
      rollingBall = true;
      chargingShot = false;
      cancelAnimationFrame(chargeFrame);
      enableShotControls(false);
      const power = Math.min(1, pullY / 75);
      const powerPercentage = Math.round(power * 100);
      const landing = calculateShotLanding(power);
      const shotScore = landing.score;
      targetElements.forEach(target => target.classList.remove('hit'));

      ballElement.style.transition = 'transform .72s cubic-bezier(.15,.78,.25,1)';
      ballElement.style.transform = 'translate(' + landing.translateX + 'px,' + landing.translateY + 'px) scale(.35)';

      timers.push(setTimeout(() => {
        if (landing.target) landing.target.classList.add('hit');
        shots += 1;
        roundScore += shotScore;
        scoreElement.textContent = roundScore;
        ballsElement.textContent = 3 - shots;

        if (shots >= 3) {
          finishRound();
          return;
        }

        resetSkeeBall();
        setStatus(
          (shotScore > 0
            ? shotScore + ' points — the ball landed inside the ' + shotScore + ' circle.'
            : 'Miss — 0 points because the ball did not finish inside a circle.') +
          ' Ball ' + (shots + 1) + ' used ' + powerPercentage + '% power.',
          shotScore > 0
        );
        enableShotControls(true);
      }, 760));
    }

    function finishRound() {
      roundActive = false;
      ballElement.classList.add('locked');
      enableShotControls(false);
      const payout = Math.max(5, Math.round(roundScore / 3));
      const high = saveHighScore('skee', roundScore);
      highElement.textContent = high;
      awardTickets(payout, 'Skee-Ball');
      setStatus('Round complete: ' + roundScore + ' score paid +' + payout + ' tickets!', true);
      startButton.disabled = false;
      startButton.textContent = 'PLAY AGAIN · 1 TOKEN';
      resetSkeeBall();
    }

    function moveButtonAim(amount) {
      if (!roundActive || rollingBall) return;
      buttonAim = Math.max(-80, Math.min(80, buttonAim + amount));
      ballElement.style.transition = 'transform .16s ease-out';
      ballElement.style.transform = 'translateX(' + buttonAim + 'px)';
      setStatus('Aim ' + (buttonAim === 0 ? 'center' : buttonAim < 0 ? 'left ' + Math.abs(buttonAim) : 'right ' + buttonAim) + ', then hold the orange button to choose power.', false);
    }

    function beginCharge(event) {
      if (!roundActive || rollingBall || draggingBall || chargingShot) return;

      chargingShot = true;
      chargeStart = performance.now();
      buttonPower = 0;
      pullX = buttonAim;
      setPowerDisplay(0);
      shootButton.textContent = 'RELEASE TO ROLL';
      if (event.pointerId !== undefined) shootButton.setPointerCapture?.(event.pointerId);
      event.preventDefault();

      function updateCharge(now) {
        if (!chargingShot) return;
        const chargePhase = ((now - chargeStart) / 1100) % 2;
        buttonPower = chargePhase <= 1 ? chargePhase : 2 - chargePhase;
        setPowerDisplay(buttonPower);
        chargeFrame = requestAnimationFrame(updateCharge);
      }

      chargeFrame = requestAnimationFrame(updateCharge);
    }

    function releaseCharge(event) {
      if (!chargingShot) return;

      chargingShot = false;
      cancelAnimationFrame(chargeFrame);
      if (event.pointerId !== undefined && shootButton.hasPointerCapture?.(event.pointerId)) {
        shootButton.releasePointerCapture(event.pointerId);
      }
      event.preventDefault();

      if (buttonPower < .12) {
        buttonPower = 0;
        setPowerDisplay(0);
        shootButton.textContent = 'HOLD TO CHARGE';
        setStatus('Hold longer to add power. The ball only rolls when you release.', false);
        return;
      }

      pullX = buttonAim;
      pullY = buttonPower * 75;
      rollShot();
    }

    function onSkeeKeydown(event) {
      if (!roundActive || rollingBall) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveButtonAim(-10);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveButtonAim(10);
      }
      if ((event.key === ' ' || event.key === 'ArrowUp') && !event.repeat) beginCharge(event);
    }

    function onSkeeKeyup(event) {
      if (event.key === ' ' || event.key === 'ArrowUp') releaseCharge(event);
    }

    startButton.addEventListener('click', startRound);
    leftButton.addEventListener('click', () => moveButtonAim(-10));
    rightButton.addEventListener('click', () => moveButtonAim(10));
    shootButton.addEventListener('pointerdown', beginCharge);
    shootButton.addEventListener('pointerup', releaseCharge);
    shootButton.addEventListener('pointercancel', releaseCharge);
    ballElement.addEventListener('pointerdown', beginDrag);
    ballElement.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', releaseDrag);
    window.addEventListener('pointercancel', releaseDrag);
    window.addEventListener('keydown', onSkeeKeydown);
    window.addEventListener('keyup', onSkeeKeyup);

    cleanupGame = () => {
      cancelAnimationFrame(chargeFrame);
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('pointerup', releaseDrag);
      window.removeEventListener('pointercancel', releaseDrag);
      window.removeEventListener('keydown', onSkeeKeydown);
      window.removeEventListener('keyup', onSkeeKeyup);
    };
  }

  function setupClawGrab() {
    arcadeBox.innerHTML =
      topbar(true) +
      '<section class="arcade-game">' +
        '<div class="game-intro">' +
          '<div><div class="kicker">SKILL / PRECISION</div><h2>Claw <span>Grab</span></h2><p>Move left or right, trust your instincts, and commit to the drop. Every plushie pays differently.</p></div>' +
          '<div class="game-stats">' +
            '<div class="game-stat"><b id="clawPosition">50</b><small>AIM</small></div>' +
            '<div class="game-stat"><b id="clawHigh">' + getHighScore('claw') + '</b><small>BEST PAYOUT</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="game-panel">' +
          '<div class="claw-cabinet">' +
            '<div class="claw-rail"></div>' +
            '<div class="player-claw" id="playerClaw"><div class="claw-rope"></div><div class="claw-grabber">✣</div></div>' +
            '<div class="claw-prize" style="--prize-x:10%;--prize-y:84px;--prize-scale:.72;--prize-z:1"><span>🐸</span><small>25 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:20%;--prize-y:45px;--prize-scale:.88"><span>🐰</span><small>20 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:30%;--prize-y:100px;--prize-scale:.70;--prize-z:1"><span>🐧</span><small>28 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:40%;--prize-y:60px;--prize-scale:.82"><span>🐙</span><small>55 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:50%;--prize-y:38px"><span>🦊</span><small>35 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:60%;--prize-y:60px;--prize-scale:.82"><span>🐼</span><small>45 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:70%;--prize-y:100px;--prize-scale:.70;--prize-z:1"><span>👽</span><small>65 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:80%;--prize-y:45px;--prize-scale:.88"><span>🦄</span><small>60 TICKETS</small></div>' +
            '<div class="claw-prize" style="--prize-x:90%;--prize-y:84px;--prize-scale:.72;--prize-z:1"><span>🐻</span><small>70 TICKETS</small></div>' +
          '</div>' +
          '<div class="game-status" id="clawStatus">Start a round, then control the claw yourself.</div>' +
          '<div class="game-actions claw-controls">' +
            '<button class="game-action secondary" id="clawLeft" type="button" disabled>←</button>' +
            '<button class="game-action" id="clawDrop" type="button" disabled>DROP</button>' +
            '<button class="game-action secondary" id="clawRight" type="button" disabled>→</button>' +
          '</div>' +
          '<div class="game-actions"><button class="game-action" id="clawStart" type="button">START ROUND · 1 TOKEN</button></div>' +
        '</div>' +
      '</section>';

    bindTopbar(true);

    const claw = arcadeBox.querySelector('#playerClaw');
    const prizes = [...arcadeBox.querySelectorAll('.claw-prize')];
    const startButton = arcadeBox.querySelector('#clawStart');
    const leftButton = arcadeBox.querySelector('#clawLeft');
    const rightButton = arcadeBox.querySelector('#clawRight');
    const dropButton = arcadeBox.querySelector('#clawDrop');
    const statusElement = arcadeBox.querySelector('#clawStatus');
    const positionElement = arcadeBox.querySelector('#clawPosition');
    const highElement = arcadeBox.querySelector('#clawHigh');
    const targets = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const plushPool = [
      { name: 'Blue Bunny', emoji: '🐰', payout: 20 },
      { name: 'Sunny Fox', emoji: '🦊', payout: 35 },
      { name: 'Golden Bear', emoji: '🐻', payout: 70 },
      { name: 'Lucky Frog', emoji: '🐸', payout: 25 },
      { name: 'Panda Pal', emoji: '🐼', payout: 45 },
      { name: 'Ocean Octopus', emoji: '🐙', payout: 55 },
      { name: 'Rainbow Unicorn', emoji: '🦄', payout: 60 },
      { name: 'Cozy Koala', emoji: '🐨', payout: 30 },
      { name: 'Tiny Dinosaur', emoji: '🦖', payout: 40 },
      { name: 'Arcade Cat', emoji: '🐱', payout: 15 },
      { name: 'Penguin Pop', emoji: '🐧', payout: 28 },
      { name: 'Space Alien', emoji: '👽', payout: 65 },
      { name: 'Baby Elephant', emoji: '🐘', payout: 50 },
      { name: 'Sleepy Sloth', emoji: '🦥', payout: 38 },
      { name: 'Bee Buddy', emoji: '🐝', payout: 22 },
      { name: 'Shark Splash', emoji: '🦈', payout: 48 },
      { name: 'Capybara Buddy', emoji: '🦫', payout: 32 },
      { name: 'Pink Axolotl', emoji: '🦎', payout: 42 }
    ];
    const timers = [];
    let active = false;
    let clawX = 50;
    let dropDrift = 0;
    let activePlushies = plushPool.slice(0, prizes.length);

    function rotatePlushies() {
      const shuffled = [...plushPool];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }
      activePlushies = shuffled.slice(0, prizes.length);
      prizes.forEach((prizeElement, index) => {
        const plushie = activePlushies[index];
        prizeElement.querySelector('span').textContent = plushie.emoji;
        prizeElement.querySelector('small').textContent = plushie.payout + ' TICKETS';
      });
    }

    function enableControls(enabled) {
      leftButton.disabled = !enabled;
      rightButton.disabled = !enabled;
      dropButton.disabled = !enabled;
    }

    function setClawPosition(value) {
      clawX = Math.max(10, Math.min(90, value));
      claw.style.setProperty('--claw-x', clawX + '%');
      positionElement.textContent = Math.round(clawX);
    }

    function startRound() {
      if (!spendToken()) {
        statusElement.textContent = 'No tokens available. Finish a task to earn one.';
        return;
      }

      active = true;
      prizes.forEach(prize => prize.classList.remove('won'));
      rotatePlushies();
      claw.classList.remove('dropping');
      setClawPosition(50);
      const driftOptions = [-10, -7, -4, 4, 7, 10];
      dropDrift = driftOptions[Math.floor(Math.random() * driftOptions.length)];
      enableControls(true);
      startButton.disabled = true;
      startButton.textContent = 'LINE UP THE CLAW';
      statusElement.textContent = 'Line up your shot, then press DROP when you are ready.';
      statusElement.classList.remove('win');
    }

    function moveClaw(amount) {
      if (!active) return;
      setClawPosition(clawX + amount);
    }

    function dropClaw() {
      if (!active) return;
      active = false;
      enableControls(false);
      claw.classList.add('dropping');
      statusElement.textContent = 'Claw dropping…';

      let nearestIndex = 0;
      const finalClawX = clawX + dropDrift;
      targets.forEach((target, index) => {
        if (Math.abs(target - finalClawX) < Math.abs(targets[nearestIndex] - finalClawX)) {
          nearestIndex = index;
        }
      });
      const hit = Math.abs(targets[nearestIndex] - finalClawX) <= 2;

      timers.push(setTimeout(() => {
        claw.style.setProperty('--claw-x', finalClawX + '%');
      }, 180));

      timers.push(setTimeout(() => {
        if (hit) prizes[nearestIndex].classList.add('won');
      }, 560));

      timers.push(setTimeout(() => {
        const wonPlushie = activePlushies[nearestIndex];
        const payout = hit ? wonPlushie.payout : 8;
        const high = saveHighScore('claw', payout);
        highElement.textContent = high;
        awardTickets(payout, 'Claw Grab');
        statusElement.textContent = hit
          ? 'Perfect grab! ' + wonPlushie.name + ' paid +' + payout + ' tickets.'
          : 'So close! Consolation payout: +8 tickets.';
        statusElement.classList.add('win');
        startButton.disabled = false;
        startButton.textContent = 'PLAY AGAIN · 1 TOKEN';
      }, 1050));
    }

    function onKeydown(event) {
      if (!active) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveClaw(-4);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveClaw(4);
      }
      if (event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        dropClaw();
      }
    }

    startButton.addEventListener('click', startRound);
    leftButton.addEventListener('click', () => moveClaw(-4));
    rightButton.addEventListener('click', () => moveClaw(4));
    dropButton.addEventListener('click', dropClaw);
    window.addEventListener('keydown', onKeydown);

    cleanupGame = () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('keydown', onKeydown);
    };
  }

  function setupCoinPush() {
    arcadeBox.innerHTML =
      topbar(true) +
      '<section class="arcade-game">' +
        '<div class="game-intro">' +
          '<div><div class="kicker">DROP / PUSH / WIN</div><h2>Coin <span>Push</span></h2><p>Choose a lane, drop coins, and let the shelf shove prizes closer to the edge. Big pushes and prize falls pay tickets immediately.</p></div>' +
          '<div class="game-stats">' +
            '<div class="game-stat"><b id="coinDrops">10</b><small>DROPS LEFT</small></div>' +
            '<div class="game-stat"><b id="coinTickets">0</b><small>ROUND TICKETS</small></div>' +
            '<div class="game-stat"><b id="coinHigh">' + getHighScore('coin') + '</b><small>BEST ROUND</small></div>' +
            '<div class="game-stat"><b id="coinLaneLabel">LANE 2</b><small>ACTIVE LANE</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="game-panel">' +
          '<div class="coin-push-machine" id="coinMachine" tabindex="0" aria-label="Coin push table">' +
            '<div class="coin-push-header">PRIZE SHELF</div>' +
            '<div class="coin-push-board" id="coinBoard"></div>' +
            '<div class="coin-push-tray" id="coinTray">Every coin nudges the shelf. Prizes that fall into the tray count right away.</div>' +
          '</div>' +
          '<div class="game-status" id="coinStatus">Pick a lane, then drop coins to work the shelf forward.</div>' +
          '<div class="coin-lane-controls" id="coinLanes">' +
            '<button class="game-action secondary" type="button" data-lane="0">LANE 1</button>' +
            '<button class="game-action" type="button" data-lane="1">LANE 2</button>' +
            '<button class="game-action secondary" type="button" data-lane="2">LANE 3</button>' +
          '</div>' +
          '<div class="game-actions">' +
            '<button class="game-action" id="coinDrop" type="button" disabled>DROP COIN</button>' +
            '<button class="game-action secondary" id="coinStart" type="button">START ROUND · 1 TOKEN</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    bindTopbar(true);

    const machine = arcadeBox.querySelector('#coinMachine');
    const board = arcadeBox.querySelector('#coinBoard');
    const tray = arcadeBox.querySelector('#coinTray');
    const statusElement = arcadeBox.querySelector('#coinStatus');
    const startButton = arcadeBox.querySelector('#coinStart');
    const dropButton = arcadeBox.querySelector('#coinDrop');
    const dropsElement = arcadeBox.querySelector('#coinDrops');
    const ticketsElement = arcadeBox.querySelector('#coinTickets');
    const highElement = arcadeBox.querySelector('#coinHigh');
    const laneLabel = arcadeBox.querySelector('#coinLaneLabel');
    const laneButtons = Array.from(arcadeBox.querySelectorAll('#coinLanes [data-lane]'));
    const laneTemplates = [
      [
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }, { type: 'prize', emoji: '🐸', name: 'Lucky Frog', tickets: 24 },
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }, { type: 'prize', emoji: '🐰', name: 'Blue Bunny', tickets: 30 },
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }
      ],
      [
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }, { type: 'prize', emoji: '🦊', name: 'Sunny Fox', tickets: 34 },
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }, { type: 'prize', emoji: '🐼', name: 'Panda Pal', tickets: 48 },
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }
      ],
      [
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }, { type: 'prize', emoji: '🐻', name: 'Golden Bear', tickets: 56 },
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }, { type: 'prize', emoji: '🦄', name: 'Rainbow Unicorn', tickets: 66 },
        { type: 'coin' }, { type: 'coin' }, { type: 'coin' }
      ]
    ];
    const lanes = laneTemplates.map(lane => lane.map(item => ({ ...item })));
    const lanePressure = [0, 0, 0];
    const timers = [];
    let active = false;
    let selectedLane = 1;
    let dropsLeft = 10;
    let roundTickets = 0;
    let dropping = false;

    function prizeClass(item) {
      return item.type === 'prize' ? ' prize' : '';
    }

    function render() {
      board.innerHTML = lanes.map((lane, laneIndex) =>
        '<div class="coin-push-lane' + (laneIndex === selectedLane ? ' active' : '') + '">' +
          lane.map(item =>
            '<div class="coin-push-item' + prizeClass(item) + '">' +
              (item.type === 'coin'
                ? '🪙'
                : '<span>' + item.emoji + '</span><small>' + item.tickets + 'T</small>') +
            '</div>'
          ).join('') +
          '<div class="coin-push-edge">EDGE</div>' +
        '</div>'
      ).join('');
      dropsElement.textContent = dropsLeft;
      ticketsElement.textContent = roundTickets;
      laneLabel.textContent = 'LANE ' + (selectedLane + 1);
      laneButtons.forEach((button, index) => {
        button.classList.toggle('secondary', index !== selectedLane);
        button.classList.toggle('active', index === selectedLane);
      });
    }

    function finishRound() {
      active = false;
      dropping = false;
      dropButton.disabled = true;
      const payout = Math.max(5, roundTickets + Math.floor(dropsLeft / 6));
      const high = saveHighScore('coin', roundTickets);
      highElement.textContent = high;
      awardTickets(payout, 'Coin Push');
      statusElement.textContent = 'Round complete. You pushed out ' + roundTickets + ' worth of prizes and earned +' + payout + ' tickets.';
      tray.textContent = 'Round complete. Best round so far: ' + high + ' tickets.';
      startButton.disabled = false;
      startButton.textContent = 'PLAY AGAIN · 1 TOKEN';
      showToast('Coin Push paid +' + payout + ' tickets.');
    }

    function dropCoin() {
      if (!active || dropping || dropsLeft <= 0) return;
      dropping = true;
      dropsLeft -= 1;

      const lane = lanes[selectedLane];
      lane.unshift({ type: 'coin' });
      lanePressure[selectedLane] += 1;
      const shouldAdvance = lanePressure[selectedLane] >= 2;
      const fallen = shouldAdvance && lane.length > 11 ? lane.pop() : null;
      if (shouldAdvance) {
        lanePressure[selectedLane] = 0;
      }
      render();

      const coin = document.createElement('div');
      coin.className = 'coin-push-drop';
      coin.textContent = '🪙';
      coin.style.left = '50%';
      machine.append(coin);
      requestAnimationFrame(() => coin.classList.add('drop'));
      timers.push(setTimeout(() => coin.remove(), 540));

      timers.push(setTimeout(() => {
        if (fallen && fallen.type === 'prize') {
          roundTickets += fallen.tickets;
          tray.textContent = fallen.name + ' fell off the edge for +' + fallen.tickets + ' tickets.';
          statusElement.textContent = fallen.name + ' was pushed off the shelf. That one counted immediately.';
        } else {
          tray.textContent = 'The shelf shifted. Keep the pressure on the lane.';
          statusElement.textContent = 'Coin landed cleanly. The shelf moved a little farther forward.';
        }
        render();
        dropping = false;
        if (dropsLeft <= 0) {
          finishRound();
        }
      }, 560));
    }

    function startRound() {
      if (!spendToken()) {
        statusElement.textContent = 'No tokens available. Finish a task to earn another round.';
        return;
      }

      active = true;
      dropping = false;
      dropsLeft = 10;
      roundTickets = 0;
      lanes.forEach((lane, laneIndex) => {
        lane.splice(0, lane.length, ...laneTemplates[laneIndex].map(item => ({ ...item })));
        lanePressure[laneIndex] = 0;
      });
      startButton.disabled = true;
      dropButton.disabled = false;
      startButton.textContent = 'ROUND IN PROGRESS';
      tray.textContent = 'Drop coins to shove prizes off the edge.';
      statusElement.textContent = 'Choose a lane. Coins on the shelf are already in motion, so good timing matters.';
      render();
    }

    function selectLane(index) {
      selectedLane = Math.max(0, Math.min(2, index));
      render();
    }

    function onKeydown(event) {
      if (!active) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        selectLane(selectedLane - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        selectLane(selectedLane + 1);
      }
      if (event.key === ' ' || event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        dropCoin();
      }
    }

    laneButtons.forEach(button => {
      button.addEventListener('click', () => selectLane(Number(button.dataset.lane)));
    });
    startButton.addEventListener('click', startRound);
    dropButton.addEventListener('click', dropCoin);
    window.addEventListener('keydown', onKeydown);

    render();
    cleanupGame = () => {
      active = false;
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('keydown', onKeydown);
    };
  }

  function setupCrazyTower() {
    arcadeBox.innerHTML =
      topbar(true) +
      '<section class="arcade-game">' +
        '<div class="game-intro">' +
          '<div><div class="kicker">SKILL / PERFECT TIMING</div><h2>Crazy <span>Tower</span></h2><p>Build ten floors. The safe overlap tightens every level, and every bounce makes the block faster.</p></div>' +
          '<div class="game-stats">' +
            '<div class="game-stat"><b id="towerLevel">0</b><small>FLOORS</small></div>' +
            '<div class="game-stat"><b>10</b><small>GOAL</small></div>' +
            '<div class="game-stat"><b id="towerSafe">50%</b><small>MIN OVERLAP</small></div>' +
            '<div class="game-stat"><b id="towerHigh">' + getHighScore('tower') + '</b><small>BEST TOWER</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="game-panel">' +
          '<div class="tower-stage" id="towerStage"><div class="tower-ground"></div></div>' +
          '<div class="game-status" id="towerStatus">Start a round, then tap DROP when the blocks line up.</div>' +
          '<div class="game-actions">' +
            '<button class="game-action" id="towerDrop" type="button" disabled>DROP BLOCK</button>' +
            '<button class="game-action secondary" id="towerStart" type="button">START ROUND · 1 TOKEN</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    bindTopbar(true);

    const stage = arcadeBox.querySelector('#towerStage');
    const startButton = arcadeBox.querySelector('#towerStart');
    const dropButton = arcadeBox.querySelector('#towerDrop');
    const statusElement = arcadeBox.querySelector('#towerStatus');
    const levelElement = arcadeBox.querySelector('#towerLevel');
    const safeElement = arcadeBox.querySelector('#towerSafe');
    const highElement = arcadeBox.querySelector('#towerHigh');
    let animationFrame = 0;
    let active = false;
    let level = 0;
    let movingBlock;
    let movingX = 0;
    let movingWidth = 50;
    let direction = 1;
    let bounces = 0;
    let lastTime = 0;
    let previousBlock = { x: 29, width: 42 };
    let endTimer;

    function requiredOverlapRatio() {
      return Math.min(.70, .50 + level * (.20 / 9));
    }

    function addBlock(x, width, floor, moving) {
      const block = document.createElement('div');
      block.className = 'tower-block' + (moving ? ' moving' : '');
      block.style.left = x + '%';
      block.style.width = width + '%';
      block.style.bottom = 30 + floor * 30 + 'px';
      stage.append(block);
      return block;
    }

    function startRound() {
      if (!spendToken()) {
        statusElement.textContent = 'No tokens available. Finish a task to earn one.';
        return;
      }

      cancelAnimationFrame(animationFrame);
      clearTimeout(endTimer);
      stage.querySelectorAll('.tower-block').forEach(block => block.remove());
      active = true;
      level = 0;
      direction = 1;
      levelElement.textContent = 0;
      safeElement.textContent = '50%';
      previousBlock = { x: 29, width: 42 };
      addBlock(previousBlock.x, previousBlock.width, 0, false);
      startButton.disabled = true;
      startButton.textContent = 'TOWER IN PROGRESS';
      dropButton.disabled = false;
      statusElement.textContent = 'Floor 1 needs at least 50% overlap. The wider range gets tighter each floor.';
      statusElement.classList.remove('win');
      spawnMovingBlock();
    }

    function spawnMovingBlock() {
      movingWidth = previousBlock.width;
      movingX = direction > 0 ? 1 : 99 - movingWidth;
      bounces = 0;
      movingBlock = addBlock(movingX, movingWidth, level + 1, true);
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(animateBlock);
    }

    function animateBlock(time) {
      if (!active) return;
      const delta = Math.min(35, time - lastTime);
      lastTime = time;
      const bounceBoost = Math.min(1.35, 1 + bounces * .07);
      const speed = (.09 + level * .018) * bounceBoost;
      movingX += direction * speed * delta;

      if (movingX <= 1) {
        movingX = 1;
        direction = 1;
        bounces += 1;
      }
      if (movingX + movingWidth >= 99) {
        movingX = 99 - movingWidth;
        direction = -1;
        bounces += 1;
      }

      movingBlock.style.left = movingX + '%';
      animationFrame = requestAnimationFrame(animateBlock);
    }

    function dropBlock() {
      if (!active || !movingBlock) return;
      cancelAnimationFrame(animationFrame);

      const overlapStart = Math.max(movingX, previousBlock.x);
      const overlapEnd = Math.min(movingX + movingWidth, previousBlock.x + previousBlock.width);
      const overlap = overlapEnd - overlapStart;
      const minimumOverlap = Math.max(5, movingWidth * requiredOverlapRatio());

      if (overlap < minimumOverlap) {
        movingBlock.style.transition = 'transform .5s, opacity .5s';
        movingBlock.style.transform = 'translateY(180px) rotate(18deg)';
        movingBlock.style.opacity = 0;
        endTimer = setTimeout(() => finishTower(false), 480);
        return;
      }

      movingBlock.classList.remove('moving');
      movingBlock.style.left = overlapStart + '%';
      movingBlock.style.width = overlap + '%';
      previousBlock = { x: overlapStart, width: overlap };
      level += 1;
      levelElement.textContent = level;
      safeElement.textContent = Math.round(requiredOverlapRatio() * 100) + '%';

      if (level >= 10) {
        finishTower(true);
        return;
      }

      const accuracy = Math.round(overlap / movingWidth * 100);
      statusElement.textContent = accuracy > 97
        ? 'Perfect drop! Floor ' + (level + 1) + ' is faster and needs ' + safeElement.textContent + '.'
        : accuracy + '% overlap — your next block is narrower and needs ' + safeElement.textContent + '.';
      direction *= -1;
      spawnMovingBlock();
    }

    function finishTower(completed) {
      active = false;
      cancelAnimationFrame(animationFrame);
      dropButton.disabled = true;
      const payout = Math.max(5, level * 9 + (completed ? 60 : 5));
      const high = saveHighScore('tower', level);
      highElement.textContent = high;
      awardTickets(payout, 'Crazy Tower');
      statusElement.textContent = completed
        ? 'Tower complete! Ten floors paid +' + payout + ' tickets!'
        : 'Tower ended at ' + level + ' floors. You earned +' + payout + ' tickets.';
      statusElement.classList.add('win');
      startButton.disabled = false;
      startButton.textContent = 'BUILD AGAIN · 1 TOKEN';
    }

    function onKeydown(event) {
      if (active && (event.key === ' ' || event.key === 'ArrowDown')) {
        event.preventDefault();
        dropBlock();
      }
    }

    startButton.addEventListener('click', startRound);
    dropButton.addEventListener('click', dropBlock);
    window.addEventListener('keydown', onKeydown);

    cleanupGame = () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      clearTimeout(endTimer);
      window.removeEventListener('keydown', onKeydown);
    };
  }

  arcadeBox.className = 'game-box arcade-box';
  window.arcadeApp = {
    open,
    close,
    showLobby,
    refresh: refreshArcadeBalances
  };
}
