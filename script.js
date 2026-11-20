
const $ = s => document.querySelector(s);
const screenEl = $('#screen');
const PHOTOS = [1, 2, 3, 4];

/* ---------- placeholders if assets are missing ---------- */
const phSvg = (label, emoji, bg1, bg2) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + bg1 + '"/><stop offset="1" stop-color="' + bg2 + '"/>' +
    '</linearGradient></defs><rect width="400" height="400" fill="url(#g)"/>' +
    '<text x="200" y="200" font-size="150" text-anchor="middle" dominant-baseline="central">' + emoji + '</text>' +
    '<text x="200" y="320" font-size="22" font-family="monospace" fill="#3a1a2e" text-anchor="middle">' + label + '</text></svg>');

const ASSET = { topper: 'assets/1.gif', cake: 'assets/2.gif', load: 'assets/1.png' };

function wire(img, key, label, emoji) {
  const fb = phSvg(label, emoji, '#ffe3ef', '#f7d7c4');
  img.src = ASSET[key];
  img.onerror = () => { img.onerror = null; img.src = fb; };
}

wire($('#topper'), 'topper', 'TOPPER.GIF', '\u{1F388}');
wire($('#cakeGif'), 'cake', 'CAKE.GIF', '\u{1F382}');

/* ---------- audio ---------- */
const music = new Audio('assets/music.mp3');
music.loop = true; music.volume = 0;
let faded = false;
function startMusic() {
  if (faded) return; faded = true;
  music.play().then(() => {
    let v = 0;
    const t = setInterval(() => { v = Math.min(v + .1, .9); music.volume = v; if (v >= .9) clearInterval(t); }, 100);
  }).catch(() => {});
}

/* ---------- click particles ---------- */
const glyphs = ['\u2661', '\u2726', '\u2764', '\u2727', '\u2661'];
screenEl.addEventListener('click', e => {
  const r = screenEl.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'pt';
  p.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
  p.style.left = (e.clientX - r.left) + 'px';
  p.style.top = (e.clientY - r.top) + 'px';
  p.style.fontSize = (12 + Math.random() * 14) + 'px';
  $('#particles').appendChild(p);
  setTimeout(() => p.remove(), 1000);
});

/* ---------- stage switching ---------- */
const stages = ['#s0', '#s1', '#s2', '#s3', '#s4'];
let stage = 0;
function go(n) {
  $(stages[stage]).hidden = true;
  stage = n;
  $(stages[stage]).hidden = false;
  if (n === 2) requestAnimationFrame(sizeCanvas);
  $(stages[stage]).animate(
    [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }],
    { duration: 450, easing: 'ease-out' }
  );
  if (n === 3) revealReadBtn();
}
function revealReadBtn() {
  setTimeout(() => {
    const b = $('#goLetter');
    b.style.transition = 'opacity .4s';
    b.style.opacity = 1;
    b.style.pointerEvents = 'auto';
  }, 1200);
}

/* ================= SEAL HOLD (animated) ================= */
const CIRC = 2 * Math.PI * 42;
const HOLD_MS = 1800;
const holdBtn = $('#hold'), prog = $('#prog'), lbl = $('#holdLbl'), after = $('#after');
const ringWrap = $('.ring-wrap'), petals = $('.petals'), sealBody = $('.seal-body');
const halfL = $('.half.l'), halfR = $('.half.r'), blob = $('.blob');
let holding = false, opened = false, p = 0, lastT = 0, ang = 0, parts = [];
petals.style.animation = 'none';
prog.style.transition = 'none';
[halfL, halfR].forEach(h => h.style.transition = 'none');

/* sparkle canvas over the seal */
const sparkCv = document.createElement('canvas');
sparkCv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:70;pointer-events:none';
sealBody.appendChild(sparkCv);
const sctx = sparkCv.getContext('2d');
const dpr = Math.min(window.devicePixelRatio || 1, 2);
function fitSpark() {
  const w = Math.round(sealBody.clientWidth * dpr), h = Math.round(sealBody.clientHeight * dpr);
  if (sparkCv.width !== w || sparkCv.height !== h) { sparkCv.width = w; sparkCv.height = h; sctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
}
function sealCenter() {
  const a = ringWrap.getBoundingClientRect(), b = sealBody.getBoundingClientRect();
  return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2];
}
function emit(n, burst) {
  const [cx, cy] = sealCenter();
  const cols = ['#ffd95a', '#fff', '#ffb3d1', '#fff1a8'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283;
    const sp = burst ? 2 + Math.random() * 7 : .5 + Math.random() * 2.2 + p * 2;
    const heart = Math.random() < (burst ? .5 : .25);
    parts.push({
      x: cx + (burst ? 0 : Math.cos(a) * 50), y: cy + (burst ? 0 : Math.sin(a) * 50),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (burst ? 3 : .8),
      life: 0, max: (burst ? 70 : 35) + Math.random() * 40, g: burst ? .12 : -.02,
      ch: heart ? '\u2665' : (Math.random() < .5 ? '\u2726' : '\u2022'),
      sz: burst ? 12 + Math.random() * 18 : 8 + Math.random() * 9,
      c: heart ? '#ff7aa8' : cols[i % 4]
    });
  }
}
function drawSpark() {
  const w = sparkCv.width / dpr, h = sparkCv.height / dpr;
  sctx.clearRect(0, 0, w, h);
  parts = parts.filter(q => q.life < q.max);
  for (const q of parts) {
    q.life++; q.vy += q.g; q.x += q.vx; q.y += q.vy; q.vx *= .99;
    sctx.globalAlpha = Math.max(0, 1 - q.life / q.max);
    sctx.fillStyle = q.c; sctx.shadowColor = q.c; sctx.shadowBlur = 8;
    sctx.font = q.sz + 'px sans-serif'; sctx.textAlign = 'center';
    sctx.fillText(q.ch, q.x, q.y);
  }
  sctx.globalAlpha = 1; sctx.shadowBlur = 0;
}

function renderHold(dt) {
  const e = p * p * (3 - 2 * p);
  if (!opened) {
    halfL.style.transform = halfR.style.transform = 'scaleX(' + (1 - e * .88) + ')';
    blob.style.transform = 'translateX(-50%) translateY(' + (p * 30) + 'px)';
    blob.style.opacity = Math.max(0, 1 - p * 3);
  }
  prog.style.strokeDashoffset = String(CIRC * (1 - p));
  ang += dt * (.02 + p * .6);
  petals.style.transform = 'rotate(' + ang + 'deg) scale(' + (1 + p * .25) + ')';
  const sh = (p > 0 && !opened) ? Math.sin(performance.now() / 22) * p * 3.2 : 0;
  ringWrap.style.transform = 'translate(' + sh + 'px,' + (-sh / 2) + 'px) scale(' + (1 + p * .1) + ')';
  if (holding && !opened && Math.random() < .35 + p) emit(1 + (p * 3 | 0));
}
function tick(t) {
  const dt = Math.min(t - lastT, 50); lastT = t;
  if (!opened) {
    p = Math.max(0, Math.min(1, p + (holding ? dt / HOLD_MS : -dt / 500)));
    renderHold(dt);
    if (p >= 1) openSeal();
    else if (p === 0 && !holding && lbl.textContent !== 'Hold me') lbl.textContent = 'Hold me';
  }
  fitSpark(); drawSpark();
  requestAnimationFrame(tick);
}
requestAnimationFrame(t => { lastT = t; tick(t); });

function pressStart(e) {
  if (opened) return;
  e.preventDefault();
  holding = true;
  holdBtn.classList.add('holding');
  lbl.textContent = 'Holding\u2026';
}
function pressEnd() {
  if (!holding || opened) return;
  holding = false;
  holdBtn.classList.remove('holding');
  lbl.textContent = p > .02 ? 'Too soon!' : 'Hold me';
}
holdBtn.addEventListener('pointerdown', pressStart);
holdBtn.addEventListener('pointerup', pressEnd);
holdBtn.addEventListener('pointerleave', pressEnd);
holdBtn.addEventListener('pointercancel', pressEnd);
holdBtn.addEventListener('contextmenu', e => e.preventDefault());

function openSeal() {
  opened = true; holding = false; p = 1;
  renderHold(0);
  startMusic();
  holdBtn.classList.remove('holding');
  const fl = document.createElement('div'); fl.className = 'sflash'; sealBody.appendChild(fl);
  emit(90, true); setTimeout(() => emit(60, true), 250);
  navigator.vibrate && navigator.vibrate([40, 40, 80]);
  void halfL.offsetWidth;                       // hand the curtains back to CSS
  [halfL, halfR].forEach(h => { h.style.transition = ''; h.style.transform = ''; });
  screenEl.classList.add('opened');
  setTimeout(showLock, 500);
}

/* ================= VAULT LOCK ================= */
const PASSCODE = '1234';                      // <-- change your passkey
const AVATAR_URL = 'assets/images/1.png';     // <-- photo shown on the lock (heart if missing)
let code = '', vBusy = false, lockOn = false, passT;

function showLock() {
  lockOn = true;
  $('#s0Title').textContent = 'VAULT.EXE';
  after.className = 'after vault';
  const keys = ['1','2','3','4','5','6','7','8','9','\u232B','0',''];
  after.innerHTML = '<div class="vault-in">' +
    '<div class="v-avatar" id="vAvatar">\u2665</div>' +
    '<div class="v-mini" id="vMini">\u2665</div>' +
    '<div class="v-lbl"><span id="vLbl">SECURE SYSTEM ENTRY</span></div>' +
    '<div class="v-dots" id="vDots"><i></i><i></i><i></i><i></i></div>' +
    '<div class="v-pad" id="vPad">' +
    keys.map((k, i) => k === '' ? '<div class="v-dotkey"></div>' :
      '<button class="v-key" style="--i:' + i + '" data-k="' + k + '">' + k + '</button>').join('') +
    '</div><div class="v-hint">HINT: CLICK ON IMAGE AGAIN IF YOU FORGET PASSKEY</div></div>';

  const im = new Image();
  im.alt = '';
  im.onload = () => { const av = $('#vAvatar'); if (av) { av.textContent = ''; av.appendChild(im); } };
  im.src = AVATAR_URL;

  $('#vPad').addEventListener('click', e => { const b = e.target.closest('.v-key'); if (b) press(b.dataset.k); });
  $('#vAvatar').addEventListener('click', () => {
    const m = $('#vMini'), on = m.classList.toggle('show');
    m.textContent = on ? PASSCODE.split('').join(' ') : '\u2665';
    clearTimeout(passT);
    if (on) passT = setTimeout(() => { m.classList.remove('show'); m.textContent = '\u2665'; }, 6000);
  });
}
function paint() { [...$('#vDots').children].forEach((d, i) => d.classList.toggle('on', i < code.length)); }
function say(t, ms) {
  $('#vLbl').textContent = t;
  if (ms) setTimeout(() => { const l = $('#vLbl'); if (l && lockOn) l.textContent = 'SECURE SYSTEM ENTRY'; }, ms);
}
function press(k) {
  if (!lockOn || vBusy) return;
  if (k === '\u232B') code = code.slice(0, -1);
  else if (code.length < 4) code += k;
  paint();
  if (code.length === 4) setTimeout(checkCode, 260);
}
function checkCode() {
  vBusy = true;
  const dots = $('#vDots');
  if (code === PASSCODE) {
    dots.classList.add('ok'); say('ACCESS GRANTED \u2665');
    navigator.vibrate && navigator.vibrate([30, 30, 60]);
    confetti({ particleCount: 70, spread: 80, origin: { y: .6 }, colors: ['#ff5ea6', '#d4789c', '#ffd95a', '#fff'] });
    setTimeout(startCountdown, 1200);
  } else {
    dots.classList.add('shake'); say('WRONG PASSKEY', 1400);
    navigator.vibrate && navigator.vibrate(200);
    setTimeout(() => { dots.classList.remove('shake'); code = ''; paint(); vBusy = false; }, 500);
  }
}
document.addEventListener('keydown', e => {
  if (!lockOn) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === 'Backspace') press('\u232B');
});

/* ================= COUNTDOWN 3-2-1 ================= */
function startCountdown() {
  lockOn = false;
  after.className = 'after';
  $('#s0Title').textContent = 'SEAL.EXE';
  let n = 3;
  const render = () => {
    after.innerHTML = '<div class="count">' + n + '</div>' +
      '<div class="cd-dots"><i style="background:#d4789c"></i><i style="background:#e8a4be"></i><i style="background:#f4ccda"></i></div>';
    if (n === 1) { setTimeout(showLoading, 600); return; }
    n--; setTimeout(render, 900);
  };
  render();
}

function showLoading() {
  after.innerHTML = '<div class="loading">' +
    '<img class="ph-img" id="loadImg" alt="surprise">' +
    '<p>Loading your gift...</p>' +
    '<div class="loader-dots"><i style="animation-delay:0s"></i><i style="animation-delay:.2s"></i><i style="animation-delay:.4s"></i></div></div>';
  wire($('#loadImg'), 'load', '', '');
  setTimeout(() => go(1), 2600);
}

$('#goCake').addEventListener('click', () => go(2));

/* ================= CAKE SLICING ================= */
const area = $('#cakeArea'), canvas = $('#slice'), ctx = canvas.getContext('2d');
let trail = [], drawing = false, startPt = null, cakeDone = false, pct = 0;

function sizeCanvas() { canvas.width = area.clientWidth; canvas.height = area.clientHeight; }
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (trail.length > 1) {
    const a = trail[0], b = trail[trail.length - 1];
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, 'rgba(255,94,166,1)');
    g.addColorStop(1, 'rgba(255,94,166,.05)');
    ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = g; ctx.shadowColor = '#ff5ea6'; ctx.shadowBlur = 15; ctx.stroke();
  }
  if (trail.length > 30) trail.shift();
  requestAnimationFrame(loop);
}
loop();

canvas.addEventListener('pointerdown', e => {
  if (cakeDone) return;
  canvas.setPointerCapture(e.pointerId);
  drawing = true; trail = []; startPt = pos(e); setPct(0);
});
canvas.addEventListener('pointermove', e => {
  if (!drawing || cakeDone) return;
  const p = pos(e);
  trail.push(p);
  setPct(Math.min(Math.hypot(p.x - startPt.x, p.y - startPt.y) / 80 * 100, 100));
});
canvas.addEventListener('pointerup', endSlice);
canvas.addEventListener('pointerleave', endSlice);
canvas.addEventListener('pointercancel', endSlice);

function setPct(v) {
  pct = v;
  $('#progWrap').style.display = 'block';
  $('#cakeProg').style.strokeDashoffset = String(326.73 * (1 - v / 100));
  $('#progTxt').textContent = Math.round(v) + '%';
}
function endSlice() {
  if (!drawing) return;
  drawing = false;
  if (pct >= 80 && !cakeDone) celebrateCake();
  else { trail = []; setPct(0); $('#progWrap').style.display = 'none'; }
}
function celebrateCake() {
  cakeDone = true;
  const cols = ['#ff1f9e', '#ff5f9f', '#ff6767', '#ff6c6c', '#ff5cb0'];
  confetti({ particleCount: 280, spread: 120, origin: { y: .5 }, colors: cols, gravity: .8, ticks: 300 });
  setTimeout(() => {
    confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0, y: .6 }, colors: cols });
    confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1, y: .6 }, colors: cols });
  }, 100);

  $('#cakeTitle').outerHTML = '<h2 class="celebrate" id="cakeTitle">Happy Birthday, My Girl! \u{1F497}</h2>';
  $('#cakeSub').remove();
  $('#cakeSlot').innerHTML = '<button class="btn" id="goGallery">Next <svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>';
  $('#goGallery').addEventListener('click', () => go(3));
  setTimeout(() => { trail = []; ctx.clearRect(0, 0, canvas.width, canvas.height); }, 400);
}

/* ================= GALLERY ================= */
const wrap = $('#swWrap');
PHOTOS.forEach(n => {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';
  slide.innerHTML = '<div class="polaroid"><div class="frame"><img alt="Memory ' + n + '"></div>' +
    '<div class="cap">IMG_' + n + '.PNG</div></div>';
  const img = slide.querySelector('img');
  img.src = 'assets/images/' + n + '.png';
  img.onerror = () => { img.onerror = null; img.src = phSvg('IMG_' + n, '\u{1F5BC}\u{FE0F}', '#ffd9e8', '#e7d2f0'); };
  wrap.appendChild(slide);
});

new Swiper('#swiper', {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  loop: true,
  coverflowEffect: { rotate: 10, stretch: -5, depth: 100, modifier: 1, slideShadows: false },
  pagination: { clickable: true }
});

$('#goLetter').addEventListener('click', () => go(4));

/* ================= LETTER ================= */
const LETTER = [
  'My favorite person \u{1F43C}',
  '',
  'You know, having you in my life makes everything feel a little brighter and a lot more beautiful \u{1F932}',
  '',
  'I love the way you make me smile, the way you make ordinary moments feel special, and the way you somehow make my heart feel at home \u{1F60C}',
  '',
  'I want us to share unlimited laughs, love, silly fights, late-night talks, and countless beautiful memories together \u{1F9FF}\u{1F61A}',
  '',
  'Thank you for being my comfort, my happiness, and my favorite person in every sense \u2764\u{FE0F}',
  '',
  'I love you forever and ever and ever \u267E\u{FE0F}\u{1F618}\u{1F618}\u2764\u{FE0F}\u{1F9FF}'
].join('\n');

const env = $('#env'), modalBg = $('#modalBg'), msgTxt = $('#msgTxt'), msgBox = $('#msg');
let typing = null, unsealed = false;

env.addEventListener('click', () => {
  if (unsealed) return;
  unsealed = true;
  env.classList.add('spin');
  $('#envTag').textContent = 'Unsealing\u2026';
  setTimeout(() => {
    env.classList.remove('spin');
    $('#envTag').textContent = 'Tap to open';
    modalBg.classList.add('on');
    msgTxt.innerHTML = '';
    let i = 0;
    typing = setInterval(() => {
      i++;
      msgTxt.textContent = LETTER.slice(0, i);
      msgTxt.insertAdjacentHTML('beforeend', '<span class="cursor">_</span>');
      msgBox.scrollTop = msgBox.scrollHeight;
      if (i >= LETTER.length) clearInterval(typing);
    }, 22);
  }, 1500);
});

function closeModal() { modalBg.classList.remove('on'); }
$('#closeModal').addEventListener('click', closeModal);
modalBg.addEventListener('click', e => { if (e.target === modalBg) closeModal(); });

$('#yay').addEventListener('click', () => {
  const cols = ['#ff1f9e', '#ff5f9f', '#ff6767', '#ff6c6c', '#ff5cb0'];
  confetti({ particleCount: 180, spread: 100, origin: { y: .6 }, colors: cols, gravity: .85 });
  setTimeout(() => {
    confetti({ particleCount: 70, angle: 60, spread: 55, origin: { x: 0, y: .65 }, colors: cols });
    confetti({ particleCount: 70, angle: 120, spread: 55, origin: { x: 1, y: .65 }, colors: cols });
  }, 100);
});
