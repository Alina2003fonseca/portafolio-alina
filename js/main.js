
const CONFIG = {
  PLANETS_MIN: 8,
  PLANETS_MAX: 12,
  ORBIT_MIN: 30,     // px
  ORBIT_MAX: 120,
  DRIFT_SPEED: 0.02, // px/frame
  PARALLAX: 18       // px de desplazamiento por profundidad
};


const YEAR_SPAN = document.getElementById('year');
if (YEAR_SPAN) YEAR_SPAN.textContent = new Date().getFullYear();

/* ===== Menú móvil ===== */
const navBtn = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
if (navBtn && nav) {
  navBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}


(function starsBG(){
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(420, Math.floor((w*h)/4800));
    stars = new Array(count).fill().map(()=>({
      x: Math.random()*w, y: Math.random()*h,
      z: Math.random()*1 + 0.3,
      r: Math.random()*1.6 + 0.25,
      vx: (Math.random()*0.2 - 0.1),
      vy: (Math.random()*0.5 + 0.18)
    }));
  }
  resize(); window.addEventListener('resize', resize);

  function tick(){
    ctx.clearRect(0,0,w,h);

   
    const g1 = ctx.createRadialGradient(w*0.15, h*0.05, 0, w*0.15, h*0.05, Math.max(w,h)*0.6);
    g1.addColorStop(0, 'rgba(0,255,179,0.05)'); g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1; ctx.fillRect(0,0,w,h);

    const g2 = ctx.createRadialGradient(w*0.85, h*0.15, 0, w*0.85, h*0.15, Math.max(w,h)*0.7);
    g2.addColorStop(0, 'rgba(124,249,255,0.04)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(0,0,w,h);

    for (const s of stars){
      s.y += s.vy * s.z;
      s.x += s.vx * s.z;
      if (s.y > h+10) { s.y = -10; s.x = Math.random()*w; }
      if (s.x < -10) s.x = w+10;
      if (s.x > w+10) s.x = -10;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r*s.z, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${0.5 + s.z*0.5})`;
      ctx.fill();

      if (Math.random() < 0.004){
        ctx.shadowBlur = 14; ctx.shadowColor = '#7cf9ff'; ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();


(function planets(){
  const count = Math.floor(Math.random()*(CONFIG.PLANETS_MAX - CONFIG.PLANETS_MIN + 1)) + CONFIG.PLANETS_MIN;
  const W = () => window.innerWidth, H = () => window.innerHeight;

  const planets = [];

  function rand(a,b){ return Math.random()*(b-a)+a; }
  function hsv(h,s,v){
    
    let f=(n,k=(n+h/60)%6)=>v-v*s*Math.max(Math.min(k,4-k,1),0);
    const r = Math.round(f(5)*255), g = Math.round(f(3)*255), b = Math.round(f(1)*255);
    return `rgb(${r},${g},${b})`;
  }

  function createPlanet(){
    const size = rand(90, 260);
    const hue  = rand(160, 220) + (Math.random()<0.5 ? rand(-140,-40) : 0); // verdes/cian + alguno cálido
    const light = hsv((hue+40)%360, .25, 1);
    const mid   = hsv(hue%360, .65, .95);
    const dark  = hsv((hue+300)%360, .65, .35);

    const el = document.createElement('div');
    el.className = 'planet dyn';
    el.style.width  = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left   = `${rand(0.05*W(), 0.8*W())}px`;
    el.style.top    = `${rand(0.05*H(), 0.8*H())}px`;
    el.style.background = `
      radial-gradient(circle at 30% 30%, ${light}, ${mid} 45%, ${dark} 80%, #000 105%)
    `;
    el.style.filter = 'drop-shadow(0 0 18px rgba(0,255,179,0.35))';
    el.dataset.depth = rand(0.10, 0.35).toFixed(2);
    el.style.zIndex = -1;
    document.body.appendChild(el);

    const orbitR = rand(CONFIG.ORBIT_MIN, CONFIG.ORBIT_MAX) * (size/200);
    return {
      el,
      size,
      // ancla inicial
      ax: el.offsetLeft, ay: el.offsetTop,
      // deriva
      dx: (Math.random()<0.5?-1:1) * CONFIG.DRIFT_SPEED * rand(0.5, 1.5),
      dy: (Math.random()<0.5?-1:1) * CONFIG.DRIFT_SPEED * rand(0.5, 1.5),
      // órbita
      t: rand(0, Math.PI*2),
      ts: rand(0.002, 0.006), // velocidad angular
      r: orbitR
    };
  }

  for (let i=0;i<count;i++) planets.push(createPlanet());

  // saturno/aro en uno aleatorio
  (function addRing(){
    const p = planets[Math.floor(rand(0, planets.length))];
    if (!p) return;
    p.el.classList.add('with-ring');
  })();

  function step(){
    const w=W(), h=H();
    for (const p of planets){
      // deriva del ancla
      p.ax += p.dx; p.ay += p.dy;
      if (p.ax < -200) p.ax = w+200;
      if (p.ax > w+200) p.ax = -200;
      if (p.ay < -200) p.ay = h+200;
      if (p.ay > h+200) p.ay = -200;

      // órbita
      p.t += p.ts;
      const x = p.ax + Math.cos(p.t) * p.r;
      const y = p.ay + Math.sin(p.t) * p.r;

      p.el.style.left = `${x}px`;
      p.el.style.top  = `${y}px`;
    }
    requestAnimationFrame(step);
  }
  step();

  // Parallax suave
  window.addEventListener('mousemove', (e) => {
    const mx = e.clientX / window.innerWidth - 0.5;
    const my = e.clientY / window.innerHeight - 0.5;
    planets.forEach(p=>{
      const depth = parseFloat(p.el.dataset.depth || 0.15);
      p.el.style.transform = `translate(${mx * -CONFIG.PARALLAX * depth}px, ${my * -CONFIG.PARALLAX * depth}px)`;
    });
  });
})();


(function reactiveGlow(){
  const cards = document.querySelectorAll('.card');
  document.querySelectorAll('.site-nav a, .btn').forEach(el=>{
    el.addEventListener('mousemove', (e)=>{
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--x', x+'px');
      el.style.setProperty('--y', y+'px');
    });
  });
  window.addEventListener('mousemove', (e)=>{
    cards.forEach(card=>{
      const rect = card.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - rect.left)/rect.width, 0), 1);
      card.style.setProperty('--mx', `${x*100}%`);
      card.style.setProperty('--ang', `${x*360}deg`);
    });
  });
})();
