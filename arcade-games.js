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
    claw: {
      title: 'Claw Grab',
      description: 'Line up a narrow grab window and commit to the drop. The machine keeps its secrets.',
      meta: 'TIGHT GRAB WINDOW',
      preview: 'claw-preview'
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
    if (game === 'claw') setupClawGrab();
    if (game === 'tower') setupCrazyTower();
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
