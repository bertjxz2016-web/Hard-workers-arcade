const savedTokenValue = localStorage.getItem('taskArcadeTokens');
const savedTokens = Number(savedTokenValue);
let tokens = savedTokenValue !== null && Number.isFinite(savedTokens) && savedTokens >= 0 ? savedTokens : 12;
const savedTicketValue = localStorage.getItem('taskArcadeTickets');
const savedPointValue = localStorage.getItem('taskArcadePoints');
let tickets = savedTicketValue === null ? 0 : Math.max(0, Number(savedTicketValue) || 0);
let points = savedPointValue === null ? 0 : Math.max(0, Number(savedPointValue) || 0);
const savedLifetimeStarsValue = localStorage.getItem('taskArcadeLifetimeStars');
const savedLifetimeStars = Number(savedLifetimeStarsValue);
let lifetimeStars = savedLifetimeStarsValue !== null && Number.isFinite(savedLifetimeStars) && savedLifetimeStars >= 0
  ? savedLifetimeStars
  : points;
const starsPerTaskToken = 20;

const prizeCatalog = {
  'Sunny Fox': { price: 40, points: 100, emoji: '🦊' },
  'Lucky Frog': { price: 60, points: 150, emoji: '🐸' },
  'Blue Bunny': { price: 80, points: 225, emoji: '🐰' },
  'Cozy Koala': { price: 100, points: 300, emoji: '🐨' },
  'Panda Pal': { price: 130, points: 400, emoji: '🐼' },
  'Golden Bear': { price: 160, points: 500, emoji: '🐻' },
  'Tiny Dinosaur': { price: 200, points: 650, emoji: '🦖' },
  'Rainbow Unicorn': { price: 240, points: 800, emoji: '🦄' }
};
const pointsPerToken = 900;
const spinCost = 1100;
const spinRewards = [
  { type: 'stars', amount: 200, icon: '⭐', label: '200 STARS' },
  { type: 'tokens', amount: 1, icon: '🪙', label: '1 TOKEN' },
  { type: 'plushie', name: 'Star Dragon', emoji: '🐲', points: 450, icon: '🐲', label: 'DRAGON' },
  { type: 'stars', amount: 350, icon: '⭐', label: '350 STARS' },
  { type: 'tokens', amount: 2, icon: '🪙', label: '2 TOKENS' },
  { type: 'stars', amount: 100, icon: '⭐', label: '100 STARS' },
  { type: 'plushie', name: 'Moon Cat', emoji: '🐈‍⬛', points: 325, icon: '🐈‍⬛', label: 'MOON CAT' },
  { type: 'stars', amount: 1500, icon: '🌟', label: '1500 STARS' }
];

let tokenEl = document.getElementById('tokenCount');
let ticketEl;
let pointEl;
let pointRedeemButton;
let pointProgressText;
let pointProgressFill;
let spinModal;
let spinButton;
let spinWheelElement;
let spinStatus;
let spinStarBalance;
let spinning = false;
let wheelRotation = 0;
let spinTimer;
const modal = document.getElementById('gameModal');
const ramp = document.querySelector('.ramp');
const ball = document.getElementById('ball');
const message = document.getElementById('gameMessage');
const scoreEl = document.getElementById('gameScore');
const rollButton = document.querySelector('.game-box > .primary');
const gameInstructions = document.querySelector('.game-box > p');

let dragging = false;
let rolling = false;
let startX = 0;
let startY = 0;
let pullX = 0;
let pullY = 0;
let resetTimer;

function sync() {
  tokenEl.textContent = tokens;
  if (ticketEl) ticketEl.textContent = tickets;
  if (pointEl) pointEl.textContent = points;
  localStorage.setItem('taskArcadeTokens', String(tokens));
  localStorage.setItem('taskArcadeTickets', String(tickets));
  localStorage.setItem('taskArcadePoints', String(points));
  localStorage.setItem('taskArcadeLifetimeStars', String(lifetimeStars));
  updatePointExchangeUI();
  updateLuckySpinUI();
  updateDailyRewardsUI();
  updateMilestoneUI();
}

function taskStarReward(tokens) {
  return Math.max(20, Math.round(Number(tokens) || 0) * starsPerTaskToken);
}

function awardStars(amount) {
  const earned = Math.max(0, Math.round(Number(amount) || 0));
  points += earned;
  lifetimeStars += earned;
  return earned;
}

function completeTask(button, amount, taskId) {
  const mission = button.closest('.mission');
  const dailyTaskId = mission?.dataset.dailyTask;
  const dailyRewards = dailyTaskId
    ? claimDailyTaskRewards(dailyTaskId)
    : { firstTaskBonus: false, challengeBonus: 0 };
  const baseStars = taskStarReward(amount);
  const earnedStars = awardStars(
    baseStars * (dailyRewards.firstTaskBonus ? 2 : 1) + dailyRewards.challengeBonus
  );

  button.disabled = true;
  button.textContent = 'CLAIMED ✓';
  mission.classList.add('done');
  tokens += amount;

  if (taskId) {
    const task = customTasks.find(item => item.id === taskId);
    if (task) {
      task.done = true;
      saveCustomTasks();
    } else if (dailyTaskId === taskId) {
      dailyTaskClaims[taskId] = true;
      saveDailyTaskClaims();
    }
  }

  sync();
  const bonusText = dailyRewards.firstTaskBonus
    ? ' Double stars!'
    : dailyRewards.challengeBonus
      ? ' Challenge bonus!'
      : '';
  showToast('Task complete — +' + amount + ' tokens and +' + earnedStars + ' stars!' + bonusText);
}

function buyPrize(cost, name) {
  const prize = prizeCatalog[name];
  if (!prize) return;

  if (tickets < prize.price) {
    showToast('You need ' + (prize.price - tickets) + ' more tickets for ' + name + '.');
    return;
  }

  tickets -= prize.price;
  plushies.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    emoji: prize.emoji,
    points: prize.points
  });
  savePlushies();
  sync();
  renderCollection();
  showToast(name + ' added to your collection!');
}

function openGame() {
  if (window.arcadeApp) {
    window.arcadeApp.open();
    return;
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  resetBall();
  message.textContent = tokens > 0
    ? 'Each roll costs 1 token. Drag backward, aim, and release.'
    : 'Complete a task to earn a token before playing.';
}

function closeGame() {
  if (window.arcadeApp) {
    window.arcadeApp.close();
    return;
  }

  modal.classList.remove('open');
  document.body.style.overflow = '';
  clearTimeout(resetTimer);
  resetBall();
  message.textContent = '';
}

function resetBall() {
  dragging = false;
  rolling = false;
  pullX = 0;
  pullY = 0;
  ball.style.transition = 'none';
  ball.style.transform = 'translate(0, 0) scale(1)';
  ball.style.cursor = 'grab';
}

function beginPull(event) {
  if (rolling) return;

  dragging = true;
  startX = event.clientX;
  startY = event.clientY;
  pullX = 0;
  pullY = 0;
  ball.style.transition = 'none';
  ball.style.cursor = 'grabbing';
  ball.setPointerCapture(event.pointerId);
  message.textContent = 'Pull down for power. Move sideways to aim.';
  event.preventDefault();
  event.stopPropagation();
}

function movePull(event) {
  if (!dragging) return;

  pullX = Math.max(-85, Math.min(85, event.clientX - startX));
  pullY = Math.max(0, Math.min(100, event.clientY - startY));
  ball.style.transform = 'translate(' + pullX + 'px, ' + pullY + 'px) scale(1.08)';
  event.preventDefault();
}

function releasePull(event) {
  if (!dragging) return;

  dragging = false;
  if (ball.hasPointerCapture?.(event.pointerId)) {
    ball.releasePointerCapture(event.pointerId);
  }
  ball.style.cursor = 'grab';

  if (pullY < 6) {
    ball.style.transition = 'transform 220ms ease-out';
    ball.style.transform = 'translate(0, 0) scale(1)';
    message.textContent = 'Pull farther back, then release.';
    return;
  }

  launchBall(pullX, pullY);
  event.preventDefault();
  event.stopPropagation();
}

function launchBall(aim, power) {
  if (tokens < 1) {
    message.textContent = 'No tokens left — complete a task to earn more.';
    ball.style.transition = 'transform 220ms ease-out';
    ball.style.transform = 'translate(0, 0) scale(1)';
    return;
  }

  rolling = true;
  tokens -= 1;
  sync();
  const strength = Math.min(1, power / 60);
  const landingX = aim * 1.35;
  const rise = 115 + strength * 85;

  ball.style.transition = 'transform 700ms cubic-bezier(.15,.75,.3,1)';
  ball.style.transform = 'translate(' + landingX + 'px, -' + rise + 'px) scale(.42)';

  let score = 10;
  const accuracy = Math.abs(landingX);
  if (accuracy < 13 && strength > .82) score = 100;
  else if (accuracy < 32 && strength > .58) score = 50;
  else if (accuracy < 65 && strength > .38) score = 25;

  resetTimer = setTimeout(() => {
    scoreEl.textContent = score;
    tickets += score;
    sync();
    message.textContent = score === 100
      ? 'JACKPOT! +100 TICKETS 🎉'
      : score + ' score — +' + score + ' tickets!';

    setTimeout(resetBall, 450);
  }, 720);
}

const plushieStoreKey = 'taskArcadePlushies';
let plushies = loadPlushies();
let toastTimer;

function loadPlushies() {
  try {
    const stored = JSON.parse(localStorage.getItem(plushieStoreKey) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function savePlushies() {
  localStorage.setItem(plushieStoreKey, JSON.stringify(plushies));
}

function showToast(text) {
  let toast = document.getElementById('arcadeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'arcadeToast';
    toast.className = 'arcade-toast';
    document.body.append(toast);
  }

  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updatePointExchangeUI() {
  if (!pointRedeemButton || !pointProgressText || !pointProgressFill) return;

  const progress = Math.min(points, pointsPerToken);
  pointProgressText.textContent = progress + ' / ' + pointsPerToken + ' STARS';
  pointProgressFill.style.width = progress / pointsPerToken * 100 + '%';
  pointRedeemButton.disabled = points < pointsPerToken;
  pointRedeemButton.textContent = points >= pointsPerToken
    ? 'REDEEM 900 STARS → 1 TOKEN'
    : pointsPerToken - points + ' STARS TO GO';
}

function redeemPointsForToken() {
  if (points < pointsPerToken) {
    showToast('You need ' + (pointsPerToken - points) + ' more stars for a token.');
    return;
  }

  points -= pointsPerToken;
  tokens += 1;
  sync();
  showToast('900 stars exchanged for +1 game token!');
}

function exchangePlushie(id) {
  const plushieIndex = plushies.findIndex(plushie => plushie.id === id);
  if (plushieIndex < 0) return;

  const plushie = plushies[plushieIndex];
  plushies.splice(plushieIndex, 1);
  awardStars(plushie.points);
  savePlushies();
  sync();
  renderCollection();
  showToast(plushie.name + ' exchanged for +' + plushie.points + ' stars!');
}

function renderCollection() {
  const collection = document.querySelector('.collection');
  if (!collection) return;

  collection.classList.add('economy-collection');
  collection.innerHTML = '';

  if (!plushies.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-collection';
    empty.innerHTML = '<span>🧸</span>Win tickets, choose a plushie, then keep it or exchange it for stars.';
    collection.append(empty);
    return;
  }

  plushies.forEach(plushie => {
    const item = document.createElement('div');
    item.className = 'owned-plush';

    const emoji = document.createElement('span');
    emoji.textContent = plushie.emoji;

    const name = document.createElement('b');
    name.textContent = plushie.name;

    const value = document.createElement('small');
    value.textContent = 'Worth ' + plushie.points + ' stars';

    const exchangeButton = document.createElement('button');
    exchangeButton.type = 'button';
    exchangeButton.textContent = 'EXCHANGE FOR +' + plushie.points + ' STARS';
    exchangeButton.addEventListener('click', () => exchangePlushie(plushie.id));

    item.append(emoji, name, value, exchangeButton);
    collection.append(item);
  });
}

function installEconomyUI() {
  const wallet = document.querySelector('.wallet');
  wallet.innerHTML =
    '<div class="currency-balance"><span class="currency-icon">🪙</span><strong id="tokenCount">0</strong><small>TOKENS</small></div>' +
    '<i class="wallet-divider"></i>' +
    '<div class="currency-balance"><span class="currency-icon">🎟️</span><strong id="ticketCount">0</strong><small>TICKETS</small></div>' +
    '<i class="wallet-divider"></i>' +
    '<div class="currency-balance"><span class="currency-icon">⭐</span><strong id="pointCount">0</strong><small>STARS</small></div>';
  tokenEl = document.getElementById('tokenCount');
  ticketEl = document.getElementById('ticketCount');
  pointEl = document.getElementById('pointCount');

  document.querySelector('.hero-copy p').textContent =
    'Finish tasks for game tokens and permanent stars. Play the arcade to win tickets, grab plushies from the Prize Vault, then keep them or exchange them for even more stars.';

  const rewardLoop = document.createElement('section');
  rewardLoop.className = 'reward-loop';
  rewardLoop.setAttribute('aria-label', 'How rewards work');
  rewardLoop.innerHTML =
    '<div class="loop-step"><span>✅</span><b>1. FINISH TASKS</b><small>Earn tokens + saved stars</small></div>' +
    '<div class="loop-step"><span>🎮</span><b>2. PLAY GAMES</b><small>Win arcade tickets</small></div>' +
    '<div class="loop-step"><span>🧸</span><b>3. GET PLUSHIES</b><small>Spend your tickets</small></div>' +
    '<div class="loop-step"><span>⭐</span><b>4. BUILD STARS</b><small>Unlock bonus rewards</small></div>';
  document.querySelector('.hero').after(rewardLoop);

  const vaultCopy = document.querySelector('.vault-copy p');
  document.querySelector('.vault h2').innerHTML = 'Spend tickets.<br><span>Get plush.</span>';
  vaultCopy.textContent =
    'Spend tickets from arcade games on real plushie rewards. Keep your favorites, or exchange them later to build your star balance.';
  document.querySelector('.vault-note').innerHTML = '🎟️ <b>Play games</b> to earn more tickets';

  document.querySelectorAll('.prize-card').forEach(card => {
    const name = card.querySelector('h3').textContent.trim();
    const prize = prizeCatalog[name];
    if (!prize) return;

    card.classList.remove('locked');
    const price = card.querySelector(':scope > div:last-child > b');
    const button = card.querySelector(':scope > div:last-child > button');
    price.textContent = prize.price + ' 🎟️';
    button.disabled = false;
    button.textContent = 'GET';
    button.onclick = () => buyPrize(prize.price, name);

    const badge = card.querySelector('.badge');
    if (name === 'Golden Bear' && badge) badge.textContent = 'RARE';
  });

  const collectionSection = document.querySelector('.bottom-line');
  collectionSection.classList.add('economy-collection-section');
  collectionSection.querySelector('.kicker').textContent = 'YOUR PLUSHIES';
  collectionSection.querySelector('h2').textContent = 'Keep it or trade for stars.';

  const exchangePanel = document.createElement('div');
  exchangePanel.className = 'point-token-exchange';
  exchangePanel.innerHTML =
    '<div class="point-token-rate"><span>⭐ 900 STARS</span><strong>→ 1 🪙</strong></div>' +
    '<div class="point-token-progress"><i></i></div>' +
    '<small class="point-progress-text">0 / 900 STARS</small>' +
    '<button type="button" disabled>900 STARS TO GO</button>';
  collectionSection.firstElementChild.append(exchangePanel);
  pointRedeemButton = exchangePanel.querySelector('button');
  pointProgressText = exchangePanel.querySelector('.point-progress-text');
  pointProgressFill = exchangePanel.querySelector('.point-token-progress i');
  pointRedeemButton.addEventListener('click', redeemPointsForToken);

  installLuckySpin(collectionSection);

  gameInstructions.textContent =
    'Spend 1 token to roll. Your aim sets the score, and every score becomes arcade tickets.';
  renderCollection();
  updatePointExchangeUI();
  updateDailyRewardsUI();
  updateMilestoneUI();
}

function updateLuckySpinUI() {
  if (!spinButton || !spinStarBalance) return;

  if (!spinning) spinStarBalance.textContent = points;
  spinButton.disabled = spinning || points < spinCost;
  spinButton.textContent = spinning
    ? 'SPINNING…'
    : points >= spinCost
      ? 'SPIN · 1100 STARS'
      : spinCost - points + ' STARS TO GO';
}

function openLuckySpin() {
  if (!spinModal) return;

  spinModal.classList.add('open');
  spinModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  spinStatus.classList.remove('win');
  spinStatus.textContent = points >= spinCost
    ? 'The prize stays secret until the wheel stops.'
    : 'Earn ' + (spinCost - points) + ' more stars to spin.';
  updateLuckySpinUI();
}

function closeLuckySpin() {
  if (!spinModal || spinning) return;

  spinModal.classList.remove('open');
  spinModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function addSpinReward(reward) {
  if (reward.type === 'stars') {
    awardStars(reward.amount);
    return 'You won ' + reward.amount + ' stars!';
  }

  if (reward.type === 'tokens') {
    tokens += reward.amount;
    return 'You won ' + reward.amount + (reward.amount === 1 ? ' game token!' : ' game tokens!');
  }

  plushies.push({
    id: 'spin-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: reward.name,
    emoji: reward.emoji,
    points: reward.points
  });
  savePlushies();
  renderCollection();
  return 'You won the exclusive ' + reward.name + ' plushie!';
}

function spinLuckyWheel() {
  if (spinning) return;

  if (points < spinCost) {
    showToast('You need ' + (spinCost - points) + ' more stars to spin.');
    updateLuckySpinUI();
    return;
  }

  const rewardIndex = Math.floor(Math.random() * spinRewards.length);
  const reward = spinRewards[rewardIndex];
  const currentAngle = ((wheelRotation % 360) + 360) % 360;
  const targetAngle = (360 - rewardIndex * 45) % 360;
  const landingTurn = (targetAngle - currentAngle + 360) % 360;

  spinning = true;
  points -= spinCost;
  const resultMessage = addSpinReward(reward);
  sync();

  spinStatus.classList.remove('win');
  spinStatus.textContent = 'Spinning…';
  wheelRotation += 1800 + landingTurn;
  spinWheelElement.style.transform = 'rotate(' + wheelRotation + 'deg)';

  clearTimeout(spinTimer);
  spinTimer = setTimeout(() => {
    spinning = false;
    spinStatus.textContent = resultMessage;
    spinStatus.classList.add('win');
    sync();
    showToast(resultMessage);
  }, 4100);
}

function installLuckySpin(collectionSection) {
  const offer = document.createElement('div');
  offer.className = 'spin-wheel-offer';
  offer.innerHTML =
    '<div class="spin-offer-top"><span>🎡</span><div><b>LUCKY SPIN</b><small>Stars, tokens, and exclusive plushies</small></div></div>' +
    '<button type="button">OPEN WHEEL · 1100 ⭐</button>';
  collectionSection.firstElementChild.append(offer);

  spinModal = document.createElement('div');
  spinModal.id = 'luckySpinModal';
  spinModal.className = 'spin-modal';
  spinModal.setAttribute('aria-hidden', 'true');
  spinModal.innerHTML =
    '<div class="spin-card" role="dialog" aria-modal="true" aria-labelledby="spinTitle">' +
      '<button class="spin-close" type="button" aria-label="Close lucky spin">×</button>' +
      '<div class="kicker">04 / LUCKY SPIN</div>' +
      '<h2 id="spinTitle">Take a chance.</h2>' +
      '<p>Each spin costs 1,100 stars. Win stars, game tokens, or an exclusive plushie.</p>' +
      '<div class="spin-balance">YOUR STARS <b id="spinStarBalance">0</b> ⭐</div>' +
      '<div class="wheel-stage">' +
        '<div class="wheel-pointer" aria-hidden="true"></div>' +
        '<div class="lucky-wheel" id="luckyWheel">' +
          spinRewards.map((reward, index) =>
            '<div class="wheel-label" style="--label-angle:' + (index * 45) + 'deg"><span>' + reward.icon + '</span>' + reward.label + '</div>'
          ).join('') +
        '</div>' +
        '<div class="wheel-hub" aria-hidden="true">★</div>' +
      '</div>' +
      '<button class="spin-action" id="spinAction" type="button">SPIN · 1100 STARS</button>' +
      '<div class="spin-status" id="spinStatus" aria-live="polite">The prize stays secret until the wheel stops.</div>' +
    '</div>';
  document.body.append(spinModal);

  spinButton = document.getElementById('spinAction');
  spinWheelElement = document.getElementById('luckyWheel');
  spinStatus = document.getElementById('spinStatus');
  spinStarBalance = document.getElementById('spinStarBalance');

  offer.querySelector('button').addEventListener('click', openLuckySpin);
  spinModal.querySelector('.spin-close').addEventListener('click', closeLuckySpin);
  spinButton.addEventListener('click', spinLuckyWheel);
  spinModal.addEventListener('click', event => {
    if (event.target === spinModal) closeLuckySpin();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && spinModal.classList.contains('open')) closeLuckySpin();
  });
  updateLuckySpinUI();
}

const customTaskKey = 'taskArcadeCustomTasks';
const dailyTaskDateKey = 'taskArcadeDailyDate';
const dailyTaskClaimsKey = 'taskArcadeDailyClaims';
const visitStreakKey = 'taskArcadeVisitStreak';
const dailyRewardStateKey = 'taskArcadeDailyRewardState';
const milestoneClaimsKey = 'taskArcadeMilestoneClaims';
const dailyChallengeStars = 60;
const dailyChallenges = [
  { id: 'subject-homework', title: 'HOMEWORK DASH', taskName: 'Finish a subject\'s homework' },
  { id: 'study-30-minutes', title: 'FOCUS RUSH', taskName: 'Study for 30 minutes' },
  { id: 'finish-todays-homework', title: 'FINAL BOSS', taskName: 'Finish your homework for today' }
];
const milestoneRewards = [
  { id: 'token-boost', target: 300, icon: '🪙', title: 'TOKEN BOOST', reward: '+1 game token', type: 'tokens', amount: 1 },
  { id: 'ticket-burst', target: 900, icon: '🎟️', title: 'TICKET BURST', reward: '+150 tickets', type: 'tickets', amount: 150 },
  { id: 'starlight-bear', target: 1800, icon: '🐻‍❄️', title: 'STARLIGHT BEAR', reward: 'exclusive plushie', type: 'plushie', name: 'Starlight Bear', emoji: '🐻‍❄️', points: 350 }
];
let customTasks = loadCustomTasks();
let dailyTaskClaims = loadDailyTaskClaims();
let dailyRewardState = loadDailyRewardState();
let milestoneClaims = loadMilestoneClaims();
let dailyRefreshTimer;

function loadCustomTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(customTaskKey) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveCustomTasks() {
  localStorage.setItem(customTaskKey, JSON.stringify(customTasks));
}

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function loadDailyRewardState() {
  try {
    const stored = JSON.parse(localStorage.getItem(dailyRewardStateKey) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveDailyRewardState() {
  localStorage.setItem(dailyRewardStateKey, JSON.stringify(dailyRewardState));
}

function loadMilestoneClaims() {
  try {
    const stored = JSON.parse(localStorage.getItem(milestoneClaimsKey) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveMilestoneClaims() {
  localStorage.setItem(milestoneClaimsKey, JSON.stringify(milestoneClaims));
}

function getDailyChallenge() {
  const todayNumber = getDayNumberFromKey(getLocalDayKey()) || 0;
  return dailyChallenges[todayNumber % dailyChallenges.length];
}

function resetDailyRewardsForNewDay() {
  const today = getLocalDayKey();
  if (dailyRewardState.date === today) return false;

  dailyRewardState = {
    date: today,
    firstTaskClaimed: false,
    challengeClaimed: false
  };
  saveDailyRewardState();
  return true;
}

function claimDailyTaskRewards(taskId) {
  resetDailyRewardsForNewDay();
  const challenge = getDailyChallenge();
  const firstTaskBonus = !dailyRewardState.firstTaskClaimed;
  const challengeBonus = taskId === challenge.id && !dailyRewardState.challengeClaimed
    ? dailyChallengeStars
    : 0;

  if (firstTaskBonus) dailyRewardState.firstTaskClaimed = true;
  if (challengeBonus) dailyRewardState.challengeClaimed = true;
  saveDailyRewardState();
  return { firstTaskBonus, challengeBonus };
}

function updateDailyChallengeVisuals() {
  const challenge = getDailyChallenge();
  document.querySelectorAll('[data-daily-task]').forEach(card => {
    const isChallenge = card.dataset.dailyTask === challenge.id;
    card.classList.toggle('daily-challenge', isChallenge);
    card.classList.toggle('challenge-claimed', isChallenge && Boolean(dailyRewardState.challengeClaimed));
    card.querySelector('.daily-challenge-tag')?.remove();

    if (!isChallenge) return;

    const badge = document.createElement('div');
    badge.className = 'daily-challenge-tag';
    badge.textContent = dailyRewardState.challengeClaimed
      ? 'BONUS CLAIMED ✓'
      : 'TODAY + ' + dailyChallengeStars + ' ⭐';
    card.querySelector('.mission-info').append(badge);
  });
}

function updateDailyRewardsUI() {
  const firstBonusTitle = document.getElementById('firstTaskBonusTitle');
  const firstBonusText = document.getElementById('firstTaskBonusText');
  const challengeName = document.getElementById('dailyChallengeName');
  const challengeText = document.getElementById('dailyChallengeText');
  const starBalance = document.getElementById('dailyStarBalance');
  const starProgress = document.getElementById('dailyStarProgress');
  if (!firstBonusTitle || !firstBonusText || !challengeName || !challengeText || !starBalance || !starProgress) return;

  resetDailyRewardsForNewDay();
  const challenge = getDailyChallenge();
  const nextMilestone = milestoneRewards.find(milestone => !milestoneClaims[milestone.id]);
  firstBonusTitle.textContent = dailyRewardState.firstTaskClaimed
    ? 'DOUBLE STARS CLAIMED'
    : 'DOUBLE STARS READY';
  firstBonusText.textContent = dailyRewardState.firstTaskClaimed
    ? 'Come back tomorrow for another first-task double-star boost.'
    : 'Finish the first top-three mission today for double stars.';
  challengeName.textContent = challenge.title;
  challengeText.textContent = dailyRewardState.challengeClaimed
    ? 'Bonus claimed. A new featured mission appears tomorrow.'
    : 'Complete “' + challenge.taskName + '” for +' + dailyChallengeStars + ' bonus stars.';
  starBalance.textContent = points;
  starProgress.textContent = nextMilestone
    ? lifetimeStars + ' lifetime stars · ' + Math.max(0, nextMilestone.target - lifetimeStars) + ' to ' + nextMilestone.title
    : lifetimeStars + ' lifetime stars · every milestone unlocked!';
  updateDailyChallengeVisuals();
}

function updateMilestoneUI() {
  const track = document.getElementById('milestoneTrack');
  if (!track) return;

  track.innerHTML = '';
  milestoneRewards.forEach(milestone => {
    const claimed = Boolean(milestoneClaims[milestone.id]);
    const unlocked = lifetimeStars >= milestone.target;
    const progress = Math.min(100, lifetimeStars / milestone.target * 100);
    const card = document.createElement('article');
    card.className = 'milestone-card' + (unlocked ? ' unlocked' : '') + (claimed ? ' claimed' : '');
    card.innerHTML =
      '<span class="milestone-icon" aria-hidden="true">' + milestone.icon + '</span>' +
      '<div><b>' + milestone.target + ' ⭐ · ' + milestone.title + '</b><small>' + milestone.reward + '</small></div>' +
      '<div class="milestone-progress" aria-label="' + Math.round(progress) + '% complete"><i style="width:' + progress + '%"></i></div>';

    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = claimed || !unlocked;
    button.textContent = claimed
      ? 'CLAIMED ✓'
      : unlocked
        ? 'CLAIM REWARD'
        : Math.max(0, milestone.target - lifetimeStars) + ' STARS TO GO';
    button.addEventListener('click', () => claimMilestone(milestone.id));
    card.append(button);
    track.append(card);
  });
}

function claimMilestone(milestoneId) {
  const milestone = milestoneRewards.find(item => item.id === milestoneId);
  if (!milestone || milestoneClaims[milestone.id]) return;
  if (lifetimeStars < milestone.target) {
    showToast('Earn ' + (milestone.target - lifetimeStars) + ' more lifetime stars to unlock this reward.');
    return;
  }

  milestoneClaims[milestone.id] = true;
  saveMilestoneClaims();
  if (milestone.type === 'tokens') tokens += milestone.amount;
  if (milestone.type === 'tickets') tickets += milestone.amount;
  if (milestone.type === 'plushie') {
    plushies.push({
      id: 'milestone-' + milestone.id,
      name: milestone.name,
      emoji: milestone.emoji,
      points: milestone.points
    });
    savePlushies();
    renderCollection();
  }

  sync();
  showToast(milestone.title + ' unlocked — ' + milestone.reward + '!');
}

function installDailyRewards() {
  resetDailyRewardsForNewDay();
  updateDailyRewardsUI();
  updateMilestoneUI();
}

function getDayNumberFromKey(dayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey || '');
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return Math.floor(date.getTime() / 86400000);
}

function loadVisitStreak() {
  try {
    const stored = JSON.parse(localStorage.getItem(visitStreakKey) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function calculateVisitStreak(previous, today) {
  const todayNumber = getDayNumberFromKey(today);
  const previousNumber = getDayNumberFromKey(previous.lastVisit);
  const previousCount = Math.max(0, Math.floor(Number(previous.count) || 0));
  let count = previousCount;

  if (previous.lastVisit !== today) {
    count = previousNumber !== null && todayNumber - previousNumber === 1
      ? previousCount + 1
      : 1;
  } else if (count < 1) {
    count = 1;
  }

  const rewardEarned = count % 7 === 0 && previous.lastRewardDay !== today;
  return {
    state: {
      lastVisit: today,
      count,
      lastRewardDay: rewardEarned ? today : (previous.lastRewardDay || '')
    },
    rewardEarned
  };
}

function updateVisitStreakUI(state) {
  const card = document.getElementById('loginStreak');
  const countLabel = document.getElementById('loginStreakCount');
  const rewardLabel = document.getElementById('loginStreakReward');
  const pips = document.getElementById('loginStreakPips');
  if (!card || !countLabel || !rewardLabel || !pips) return;

  const count = Math.max(1, state.count);
  const cycleDay = count % 7 || 7;
  const rewardedToday = state.lastRewardDay === getLocalDayKey();
  countLabel.textContent = count + ' DAY' + (count === 1 ? '' : 'S') + ' IN A ROW';
  rewardLabel.textContent = rewardedToday
    ? '+500 tickets collected today!'
    : 'Day ' + cycleDay + ' of 7 · ' + (7 - cycleDay) + ' day' + (7 - cycleDay === 1 ? '' : 's') + ' to +500';
  card.classList.toggle('rewarded', rewardedToday);
  card.setAttribute('aria-label', countLabel.textContent + '. ' + rewardLabel.textContent);
  pips.replaceChildren(...Array.from({ length: 7 }, (_, index) => {
    const pip = document.createElement('i');
    if (index < cycleDay) pip.className = 'active';
    return pip;
  }));
}

function installVisitStreak() {
  function recordVisit() {
    const result = calculateVisitStreak(loadVisitStreak(), getLocalDayKey());
    localStorage.setItem(visitStreakKey, JSON.stringify(result.state));

    if (result.rewardEarned) {
      tickets += 500;
      sync();
      showToast('7-day streak! +500 tickets!');
    }

    updateVisitStreakUI(result.state);
  }

  recordVisit();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recordVisit();
  });
}

function loadDailyTaskClaims() {
  try {
    const stored = JSON.parse(localStorage.getItem(dailyTaskClaimsKey) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveDailyTaskClaims() {
  localStorage.setItem(dailyTaskClaimsKey, JSON.stringify(dailyTaskClaims));
}

function resetTasksForNewDay(announce) {
  const today = getLocalDayKey();
  const previousDay = localStorage.getItem(dailyTaskDateKey);
  if (previousDay === today) return false;

  dailyTaskClaims = {};
  saveDailyTaskClaims();
  localStorage.setItem(dailyTaskDateKey, today);
  resetDailyRewardsForNewDay();

  if (announce && previousDay) showToast('New day — top 3 tasks, double stars, and the featured bonus are ready!');
  return true;
}

function applyBuiltInTaskClaims() {
  document.querySelectorAll('[data-daily-task]').forEach(card => {
    const button = card.querySelector('.reward button');
    const claimed = Boolean(dailyTaskClaims[card.dataset.dailyTask]);
    card.classList.toggle('done', claimed);
    button.disabled = claimed;
    button.textContent = claimed ? 'CLAIMED ✓' : 'DONE';
  });
}

function updateDailyResetCountdown() {
  const label = document.getElementById('dailyResetText');
  if (!label) return;

  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const minutesLeft = Math.max(1, Math.ceil((nextMidnight - now) / 60000));
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  label.textContent = hours > 0
    ? 'Refreshes in ' + hours + 'h ' + minutes + 'm'
    : 'Refreshes in ' + minutes + 'm';
}

function installDailyTaskRefresh() {
  const resetIndicator = document.querySelector('.section-head .streak');
  resetIndicator.innerHTML = '🔄 <b>TOP 3 RESET</b><small id="dailyResetText" aria-live="polite"></small>';
  resetIndicator.title = 'Only the three built-in tasks refresh at your local midnight.';

  resetTasksForNewDay(false);
  applyBuiltInTaskClaims();
  updateDailyResetCountdown();

  function checkForNewDay() {
    if (resetTasksForNewDay(true)) {
      applyBuiltInTaskClaims();
      renderCustomTasks();
      updateDailyRewardsUI();
    }
    updateDailyResetCountdown();
  }

  clearInterval(dailyRefreshTimer);
  dailyRefreshTimer = setInterval(checkForNewDay, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForNewDay();
  });
}

function buildTaskCard(task) {
  const categoryDetails = {
    school: { label: 'SCHOOL', icon: '📚', tagClass: 'green' },
    study: { label: 'STUDY', icon: '⏱️', tagClass: 'orange' },
    daily: { label: 'DAILY WIN', icon: '✅', tagClass: 'purple' },
    personal: { label: 'PERSONAL', icon: '⭐', tagClass: 'blue' }
  };
  const details = categoryDetails[task.category] || categoryDetails.personal;
  const article = document.createElement('article');
  article.className = 'mission custom' + (task.done ? ' done' : '');
  article.dataset.taskId = task.id;

  const icon = document.createElement('div');
  icon.className = 'mission-icon';
  icon.textContent = details.icon;

  const info = document.createElement('div');
  info.className = 'mission-info';

  const tag = document.createElement('div');
  tag.className = 'tag ' + details.tagClass;
  tag.textContent = details.label;

  const title = document.createElement('h3');
  title.textContent = task.title;

  const description = document.createElement('p');
  description.textContent = task.description || 'A custom mission for today';

  info.append(tag, title, description);

  const reward = document.createElement('div');
  reward.className = 'reward';
  reward.append(document.createTextNode('+' + task.tokens + ' 🪙'));

  const starReward = document.createElement('small');
  starReward.className = 'task-star-reward';
  starReward.textContent = '+' + taskStarReward(task.tokens) + ' ⭐ SAVED';
  reward.append(starReward);

  const claimButton = document.createElement('button');
  claimButton.type = 'button';
  claimButton.textContent = task.done ? 'CLAIMED ✓' : 'DONE';
  claimButton.disabled = task.done;
  claimButton.addEventListener('click', () => {
    completeTask(claimButton, task.tokens, task.id);
  });
  reward.append(claimButton);

  article.append(icon, info, reward);
  return article;
}

function renderCustomTasks() {
  const missionGrid = document.querySelector('.missions');
  missionGrid.querySelectorAll('.mission.custom').forEach(task => task.remove());
  customTasks.forEach(task => missionGrid.append(buildTaskCard(task)));
}

function installTaskCreator() {
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'create-task-btn';
  addButton.textContent = '+ CREATE TASK';
  document.querySelector('.mission-head-actions').prepend(addButton);

  const creator = document.createElement('div');
  creator.className = 'task-create-modal';
  creator.id = 'taskCreator';
  creator.innerHTML =
    '<div class="task-form-card" role="dialog" aria-modal="true" aria-labelledby="taskFormTitle">' +
      '<button class="task-form-close" type="button" aria-label="Close">×</button>' +
      '<div class="kicker">NEW / CUSTOM MISSION</div>' +
      '<h2 id="taskFormTitle">Create a <span>task.</span></h2>' +
      '<p>Choose what needs doing and how many tokens it earns.</p>' +
      '<form id="taskForm">' +
        '<div class="task-form-grid">' +
          '<div class="task-field wide"><label for="newTaskTitle">TASK NAME</label><input id="newTaskTitle" name="title" maxlength="60" placeholder="Example: Read chapter 4" required></div>' +
          '<div class="task-field"><label for="newTaskCategory">CATEGORY</label><select id="newTaskCategory" name="category"><option value="school">School</option><option value="study">Study</option><option value="daily">Daily win</option><option value="personal">Personal</option></select></div>' +
          '<div class="task-field"><label for="newTaskTokens">TOKEN REWARD</label><input id="newTaskTokens" name="tokens" type="number" min="1" max="20" value="3" required></div>' +
          '<div class="task-field wide"><label for="newTaskDescription">SHORT NOTE</label><input id="newTaskDescription" name="description" maxlength="90" placeholder="What does finished look like?"></div>' +
        '</div>' +
        '<div class="task-form-actions"><small>Custom tasks stay saved and do not reset automatically.</small><button class="task-submit" type="submit">ADD MISSION →</button></div>' +
      '</form>' +
    '</div>';
  document.body.append(creator);

  const form = creator.querySelector('#taskForm');
  const titleInput = creator.querySelector('#newTaskTitle');

  function openCreator() {
    creator.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => titleInput.focus(), 50);
  }

  function closeCreator() {
    creator.classList.remove('open');
    document.body.style.overflow = '';
  }

  addButton.addEventListener('click', openCreator);
  creator.querySelector('.task-form-close').addEventListener('click', closeCreator);
  creator.addEventListener('click', event => {
    if (event.target === creator) closeCreator();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    if (!title) return;

    const reward = Math.max(1, Math.min(20, Number(data.get('tokens')) || 1));
    customTasks.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title,
      category: String(data.get('category') || 'personal'),
      description: String(data.get('description') || '').trim(),
      tokens: reward,
      done: false
    });
    saveCustomTasks();
    renderCustomTasks();
    form.reset();
    creator.querySelector('#newTaskTokens').value = 3;
    closeCreator();
    document.querySelector('.missions').lastElementChild.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && creator.classList.contains('open')) {
      closeCreator();
    }
  });

  renderCustomTasks();
}

// The ball moves only when the player drags and releases it.
ramp.onclick = event => event.stopPropagation();
rollButton.onclick = event => {
  event.preventDefault();
  message.textContent = 'Grab the white ball, pull it down, and release!';
  ball.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }],
    { duration: 320 }
  );
};
rollButton.innerHTML = 'DRAG BALL TO ROLL <span>↑</span>';
gameInstructions.textContent = 'Grab the ball, pull backward to charge your shot, then release. Your aim and power decide the score.';
ball.style.touchAction = 'none';

ball.addEventListener('pointerdown', beginPull);
ball.addEventListener('pointermove', movePull);
ball.addEventListener('pointerup', releasePull);
ball.addEventListener('pointercancel', releasePull);
window.addEventListener('pointerup', releasePull);
window.addEventListener('pointercancel', releasePull);

modal.addEventListener('click', event => {
  if (event.target === modal) closeGame();
});

installEconomyUI();
installDailyRewards();
installVisitStreak();
installDailyTaskRefresh();
installTaskCreator();
installArcadeGames();
sync();
