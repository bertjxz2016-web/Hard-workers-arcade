pacman = function () {
  const levels = [
    [
      '###############',
      '#.............#',
      '#.###.###.###.#',
      '#.............#',
      '#.###.#.#.###.#',
      '#.....#.#.....#',
      '#####.#.#.#####',
      '#.............#',
      '#.###.###.###.#',
      '#.............#',
      '###############'
    ],
    [
      '###############',
      '#.....#.......#',
      '#.###.#.#####.#',
      '#.#...........#',
      '#.#.###.###.#.#',
      '#...#.....#.#.#',
      '###.#.###.#.#.#',
      '#.....#.......#',
      '#.#####.#####.#',
      '#.............#',
      '###############'
    ],
    [
      '###############',
      '#.............#',
      '#.###.###.###.#',
      '#.#.........#.#',
      '#.#.#.###.#.#.#',
      '#...#.....#...#',
      '#.#####.#####.#',
      '#.............#',
      '#.###.#.#.###.#',
      '#.....#.#.....#',
      '###############'
    ]
  ];
  const S = 28;
  const canvas = canvasUI('ARROWS SET DIRECTION · CLEAR DOTS TO ADVANCE', 420, 308);
  const ctx = canvas.getContext('2d');
  let level = 0, totalScore = 0, map, player, ghost, dots, direction, queued, timer, paused = false, over = false;

  function startLevel() {
    map = levels[level];
    player = { x: 1, y: 1 };
    ghost = { x: 13, y: 9 };
    direction = { x: 0, y: 0 };
    queued = { x: 0, y: 0 };
    dots = new Set();
    map.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell === '.') dots.add(`${x},${y}`);
    }));
    updateScore();
    draw();
  }

  function open(x, y) {
    return Boolean(map[y] && map[y][x] && map[y][x] !== '#');
  }

  function updateScore() {
    document.getElementById('score').textContent = `SCORE: ${totalScore} · LEVEL: ${level + 1}`;
  }

  function finishLevel() {
    paused = true;
    draw();
    message(ctx, level === levels.length - 1 ? 'YOU WON ALL LEVELS!' : `LEVEL ${level + 1} CLEAR!`, 420, 308);
    if (level === levels.length - 1) {
      over = true;
      return;
    }
    setTimeout(() => {
      if (modal.hidden) return;
      level++;
      paused = false;
      restartTimer();
      startLevel();
    }, 1200);
  }

  function movePlayer() {
    if (open(player.x + queued.x, player.y + queued.y)) direction = queued;
    if (open(player.x + direction.x, player.y + direction.y)) {
      player.x += direction.x;
      player.y += direction.y;
    }
    if (dots.delete(`${player.x},${player.y}`)) {
      totalScore += 10;
      updateScore();
    }
    if (player.x === ghost.x && player.y === ghost.y) over = true;
    if (!dots.size && !over) finishLevel();
  }

  function moveGhost() {
    const choices = [[1,0],[-1,0],[0,1],[0,-1]]
      .filter(([dx,dy]) => open(ghost.x + dx, ghost.y + dy))
      .sort((a,b) => (Math.abs(ghost.x+a[0]-player.x)+Math.abs(ghost.y+a[1]-player.y)) - (Math.abs(ghost.x+b[0]-player.x)+Math.abs(ghost.y+b[1]-player.y)));
    const move = choices[Math.random() < 0.72 ? 0 : Math.floor(Math.random() * choices.length)];
    if (move) { ghost.x += move[0]; ghost.y += move[1]; }
    if (player.x === ghost.x && player.y === ghost.y) over = true;
  }

  function tick() {
    if (paused || over) return;
    movePlayer();
    if (Math.random() < 0.55 + level * 0.12) moveGhost();
    draw();
    if (over) message(ctx, 'CAUGHT!', 420, 308);
  }

  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(tick, Math.max(115, 190 - level * 25));
  }

  function onKey(event) {
    const move = {
      ArrowLeft: [-1,0], a: [-1,0],
      ArrowRight: [1,0], d: [1,0],
      ArrowUp: [0,-1], w: [0,-1],
      ArrowDown: [0,1], s: [0,1]
    }[event.key];
    if (move && !over) {
      event.preventDefault();
      queued = { x: move[0], y: move[1] };
      if (!direction.x && !direction.y && open(player.x + queued.x, player.y + queued.y)) direction = queued;
    }
  }

  function draw() {
    ctx.fillStyle = '#07141d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    map.forEach((row,y) => [...row].forEach((cell,x) => {
      if (cell === '#') { ctx.fillStyle = '#3559d5'; ctx.fillRect(x*S, y*S, S, S); }
    }));
    ctx.fillStyle = '#f8f3e9';
    dots.forEach(dot => { const [x,y] = dot.split(',').map(Number); ctx.beginPath(); ctx.arc(x*S+14,y*S+14,3,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle = '#ffc928'; ctx.beginPath(); ctx.arc(player.x*S+14,player.y*S+14,11,.3,Math.PI*2-.3); ctx.lineTo(player.x*S+14,player.y*S+14); ctx.fill();
    ctx.fillStyle = '#f15b35'; ctx.beginPath(); ctx.arc(ghost.x*S+14,ghost.y*S+14,10,Math.PI,0); ctx.lineTo(ghost.x*S+24,ghost.y*S+24); ctx.lineTo(ghost.x*S+4,ghost.y*S+24); ctx.fill();
  }

  document.addEventListener('keydown', onKey);
  cleanup = () => { document.removeEventListener('keydown', onKey); clearInterval(timer); };
  startLevel();
  restartTimer();
};
