// Full-width Tetris board so the blocks can visibly reach both walls.
tetris = function () {
  const W=10,H=20,S=24,c=canvasUI('ARROWS MOVE · UP ROTATES · SPACE DROPS',240,480),x=c.getContext('2d');
  let board=Array.from({length:H},()=>Array(W).fill(0)),p,score=0,level=1,over=false,timer;
  const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]]],colors=['','#f15b35','#ffc857','#73b49b','#6f9ac8','#b4a6d5'];
  function spawn(){let s=shapes[Math.random()*shapes.length|0].map(r=>[...r]);p={s,x:(W-s[0].length)/2|0,y:0,c:1+Math.random()*5|0};if(hit(0,0))over=true}
  function hit(dx,dy,s=p.s){return s.some((r,y)=>r.some((v,z)=>v&&(p.x+z+dx<0||p.x+z+dx>=W||p.y+y+dy>=H||board[p.y+y+dy]?.[p.x+z+dx])))}
  function drop(){if(over)return;if(!hit(0,1))p.y++;else{p.s.forEach((r,y)=>r.forEach((v,z)=>{if(v)board[p.y+y][p.x+z]=p.c}));let lines=0;board=board.filter(r=>{if(r.every(Boolean)){lines++;return false}return true});while(board.length<H)board.unshift(Array(W).fill(0));score+=lines*100;level=Math.min(8,1+score/300|0);spawn();restart()}document.getElementById('score').textContent=`SCORE: ${score} · LEVEL: ${level}`;draw()}
  function restart(){clearInterval(timer);timer=setInterval(drop,Math.max(80,600-level*65))}
  keys(e=>{if(over)return;if(e.key==='ArrowLeft'&&!hit(-1,0))p.x--;if(e.key==='ArrowRight'&&!hit(1,0))p.x++;if(e.key==='ArrowDown')drop();if(e.key==='ArrowUp'){let s=p.s[0].map((_,i)=>p.s.map(r=>r[i]).reverse());if(!hit(0,0,s))p.s=s}if(e.key===' '){while(!hit(0,1))p.y++;drop()}draw()});
  function draw(){x.fillStyle='#14231f';x.fillRect(0,0,240,480);board.forEach((r,y)=>r.forEach((v,z)=>v&&block(x,z*S,y*S,S,colors[v])));p.s.forEach((r,y)=>r.forEach((v,z)=>v&&block(x,(p.x+z)*S,(p.y+y)*S,S,colors[p.c])));if(over)message(x,'GAME OVER',240,480)}
  cleanup=()=>clearInterval(timer);spawn();restart();draw();
};
