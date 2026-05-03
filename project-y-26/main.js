/* ═══════════════════════════════════════════════
   PROJECT Y-26 — FOR YIN — main.js
   A Time-Locked Digital Editorial Experience
   ═══════════════════════════════════════════════ */

// ══════════════════════════════════════════
// CONFIG — TODO: Change these before deploying
// ══════════════════════════════════════════
const BIRTHDAY = new Date('2025-05-29T00:00:00');

// TODO: Replace YouTube video IDs for each day
const TRACKS = {
  1: 'YOUTUBE_ID_DAY1', // Day 1 — warm, lo-fi, soft
  2: 'YOUTUBE_ID_DAY2', // Day 2 — sparse, single instrument
  3: 'YOUTUBE_ID_DAY3', // Day 3 — intimate, quiet
  4: 'YOUTUBE_ID_DAY4', // Day 4 — cinematic, building
  5: 'YOUTUBE_ID_DAY5', // Day 5 — full, warm, celebratory
};

// TODO: Change admin password before deploying
const ADMIN_PASSWORD = 'jaeyin2025';

// TODO: Replace with actual email for form submissions
const JAE_EMAIL = 'JAE_EMAIL@example.com';

const LS_KEY_MSG = 'yin_live_msg';
const LS_KEY_FORM = 'yin_form_2025';
const LS_KEY_MODAL = 'yin_modal_seen';

// DEV OVERRIDE: Set to 1–5 to force a specific day for testing.
// Set to null in production.
const DEV_DAY = null;

// ══════════════════════════════════════════
// 3. TIME-LOCK ENGINE
// ══════════════════════════════════════════
function getUnlockDate(dayNumber) {
  const d = new Date(BIRTHDAY);
  d.setDate(d.getDate() - (5 - dayNumber));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getCurrentUnlockedDay() {
  const now = new Date();
  for (let d = 5; d >= 1; d--) {
    if (now >= getUnlockDate(d)) return d;
  }
  return 0;
}

function getActiveDay() {
  return DEV_DAY !== null ? DEV_DAY : getCurrentUnlockedDay();
}

const TODAY = getActiveDay();

// ══════════════════════════════════════════
// 4. MUSIC SYSTEM
// ══════════════════════════════════════════
let musicFrame = null;
let musicOn = false;
const musicBtn = document.getElementById('music-btn');

function playMusic(day) {
  stopMusic();
  const id = TRACKS[day];
  if (!id || id.startsWith('YOUTUBE_ID')) return;
  musicFrame = document.createElement('iframe');
  musicFrame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0&rel=0`;
  musicFrame.allow = 'autoplay';
  Object.assign(musicFrame.style, {
    position: 'fixed', width: '0', height: '0',
    border: 'none', opacity: '0', pointerEvents: 'none'
  });
  document.body.appendChild(musicFrame);
  musicOn = true;
  musicBtn.classList.add('playing');
  musicBtn.textContent = '🎵';
}

function stopMusic() {
  if (musicFrame) { musicFrame.remove(); musicFrame = null; }
  musicOn = false;
  musicBtn.classList.remove('playing');
  musicBtn.textContent = '🔇';
}

musicBtn.addEventListener('click', () => {
  if (musicOn) stopMusic();
  else if (TODAY > 0) playMusic(TODAY);
});

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
let currentScreen = 'home';

function showScreen(id) {
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.add('screen-exit');
    setTimeout(() => {
      current.classList.remove('active', 'screen-exit');
    }, 400);
  }
  const next = document.getElementById(id);
  setTimeout(() => {
    next.classList.add('active', 'screen-enter');
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => next.classList.remove('screen-enter'), 500);
  }, current ? 200 : 0);
  currentScreen = id;
}

function goHome() {
  stopMusic();
  showScreen('home');
  updatePetalOpacity(false);
}

function openDay(d) {
  if (d < 1 || d > 5) return;
  if (d > TODAY) return;
  showScreen('day' + d);
  const isDark = d === 2 || d === 4;
  updatePetalOpacity(isDark);
  setTimeout(() => playMusic(d), d === 2 ? 800 : 600);
  if (d === 1) initDay1();
  if (d === 2) initDay2();
  if (d === 3) initDay3();
  if (d === 5) initDay5();
  loadLiveMessage(d);
}

// ══════════════════════════════════════════
// 2.4 FLOATING PETAL ANIMATION
// ══════════════════════════════════════════
const petalCanvas = document.getElementById('petal-canvas');
const petalCtx = petalCanvas.getContext('2d');
let petalDarkMode = false;

function resizePetalCanvas() {
  petalCanvas.width = window.innerWidth;
  petalCanvas.height = window.innerHeight;
}
resizePetalCanvas();
window.addEventListener('resize', resizePetalCanvas);

const petals = Array.from({ length: 22 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  s: 5 + Math.random() * 9,
  d: 0.12 + Math.random() * 0.25,
  dx: (Math.random() - 0.5) * 0.25,
  a: Math.random() * Math.PI * 2,
  da: 0.004 + Math.random() * 0.009,
  op: 0.04 + Math.random() * 0.09,
}));

function updatePetalOpacity(dark) {
  petalDarkMode = dark;
}

function drawPetals() {
  petalCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
  petals.forEach(p => {
    p.y += p.d;
    p.x += p.dx;
    p.a += p.da;
    if (p.y > petalCanvas.height + 20) {
      p.y = -20;
      p.x = Math.random() * petalCanvas.width;
    }
    const opacity = petalDarkMode ? p.op * 0.35 : p.op;
    petalCtx.save();
    petalCtx.translate(p.x, p.y);
    petalCtx.rotate(p.a);
    petalCtx.globalAlpha = opacity;
    petalCtx.fillStyle = '#c47a6a';
    petalCtx.beginPath();
    petalCtx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2);
    petalCtx.fill();
    petalCtx.restore();
  });
  requestAnimationFrame(drawPetals);
}
drawPetals();

// ══════════════════════════════════════════
// 5. HOME SCREEN
// ══════════════════════════════════════════

// 5.7 Countdown
function updateCountdown() {
  const container = document.getElementById('countdown-timer');
  const diff = BIRTHDAY.getTime() - Date.now();

  if (diff <= 0) {
    container.innerHTML = '<div class="countdown-birthday">HAPPY BIRTHDAY YIN 🌸</div>';
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  container.innerHTML = `
    <div class="countdown-cell">
      <div class="countdown-number">${String(d).padStart(2, '0')}</div>
      <div class="countdown-unit">DAYS</div>
    </div>
    <div class="countdown-sep">|</div>
    <div class="countdown-cell">
      <div class="countdown-number">${String(h).padStart(2, '0')}</div>
      <div class="countdown-unit">HRS</div>
    </div>
    <div class="countdown-sep">|</div>
    <div class="countdown-cell">
      <div class="countdown-number">${String(m).padStart(2, '0')}</div>
      <div class="countdown-unit">MIN</div>
    </div>
    <div class="countdown-sep">|</div>
    <div class="countdown-cell">
      <div class="countdown-number">${String(s).padStart(2, '0')}</div>
      <div class="countdown-unit">SEC</div>
    </div>
  `;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// 5.5 Open button
const openBtn = document.getElementById('open-today-btn');
if (TODAY === 0) {
  openBtn.disabled = true;
  openBtn.textContent = 'COMES ALIVE ON MAY 25';
}
openBtn.addEventListener('click', () => {
  if (TODAY > 0) openDay(TODAY);
});

// 5.8 Issues list
const ISSUES = [
  { num: 1, subtitle: 'THE OPENING', igbo: 'Ụtọ', tag: 'SCRATCH', date: 'May 25' },
  { num: 2, subtitle: 'THE FEATURE', igbo: 'Echiche', tag: 'TERMINAL', date: 'May 26' },
  { num: 3, subtitle: 'THE FOLDER', igbo: 'Obi m', tag: 'VOICE', date: 'May 27' },
  { num: 4, subtitle: 'THE LANGUAGE', igbo: 'Ifunanya', tag: 'FILM', date: 'May 28' },
  { num: 5, subtitle: 'THE DAY', igbo: 'Ndụ m', tag: 'BIRTHDAY', date: 'May 29' },
];

function buildIssuesList() {
  const list = document.getElementById('issues-list');
  const countEl = document.getElementById('issues-count');
  countEl.textContent = `${TODAY} / 5 UNLOCKED`;

  list.innerHTML = ISSUES.map(issue => {
    const unlocked = issue.num <= TODAY;
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const unlockDate = getUnlockDate(issue.num);
    const dateStr = `${dayNames[unlockDate.getDay()]}, ${String(unlockDate.getDate()).padStart(2, '0')} ${unlockDate.toLocaleString('en', { month: 'short' }).toUpperCase()}`;

    return `
      <div class="issue-card ${unlocked ? '' : 'locked'}" data-day="${issue.num}">
        <div class="issue-card-top">
          <div class="issue-card-number">${String(issue.num).padStart(2, '0')}</div>
          <div class="issue-card-dot"></div>
        </div>
        <div class="issue-card-bottom">
          <div class="issue-card-eyebrow">${unlocked ? `ISSUE ${String(issue.num).padStart(2, '0')} — ${issue.subtitle}` : 'COMES ALIVE SOON'}</div>
          <div class="issue-card-igbo">${unlocked ? issue.igbo : '—'}</div>
          <div class="issue-card-tag">${unlocked ? issue.tag : dateStr}</div>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.issue-card').forEach(card => {
    const day = parseInt(card.dataset.day);
    if (day <= TODAY) {
      card.addEventListener('click', () => openDay(day));
    }
  });
}
buildIssuesList();

// ══════════════════════════════════════════
// 6. DAY 1 — SCRATCH CARDS
// ══════════════════════════════════════════
const D1_CARDS = [
  { label: '01 / 06', title: 'the intrusive thoughts.', body: 'spamming me with them at the most random times. lights up my day in ways i genuinely cannot explain.', hidden: 'keep them coming. every single one.', rot: -1.5, egg: null },
  { label: '02 / 06', title: 'you update me.', body: 'without being asked. that\'s the crazy part. and the wholesome part.', hidden: 'i don\'t need to ask. that\'s the whole thing.', rot: 1, egg: null },
  { label: '03 / 06', title: 'the <span class="egg-word">yapping</span>.', body: 'nonstop. relentless. i act like i\'m not listening.', hidden: 'i\'m always listening.', rot: -0.5, egg: 'yapping' },
  { label: '04 / 06', title: 'random snaps.', body: 'the ones that make me think thoughts i\'m not ready to say out loud yet.', hidden: 'this one\'s staying in drafts a little longer. but it\'s there.', rot: 2, egg: null },
  { label: '05 / 06', title: 'the spam.', body: 'photos. texts. like i\'m not going to see you.', hidden: 'please never stop.', rot: -1, egg: null },
  { label: '06 / 06', title: 'existing.', body: '', hidden: 'that\'s the whole list. one word.', rot: 0.5, egg: 'existing', isSpecial: true },
];

let d1Revealed = 0;
let d1Initialized = false;

function initDay1() {
  if (d1Initialized) return;
  d1Initialized = true;
  const container = document.getElementById('d1-cards');
  container.innerHTML = D1_CARDS.map((card, i) => `
    <div class="scratch-card ${card.isSpecial ? 'card06' : ''}" data-idx="${i}" style="transform: rotate(${card.rot}deg)">
      <canvas class="scratch-card-canvas" data-idx="${i}"></canvas>
      <div class="scratch-card-content">
        <div class="scratch-card-label">${card.label}</div>
        <div class="scratch-card-title ${card.isSpecial ? 'centered' : ''}">${card.title}</div>
        ${card.body ? `<div class="scratch-card-body">${card.body}</div>` : ''}
      </div>
      <div class="scratch-card-tap-hint" data-idx="${i}">tap for more</div>
      <div class="scratch-card-hidden" data-idx="${i}">${card.hidden}</div>
    </div>
  `).join('');

  // Initialize scratch canvases
  container.querySelectorAll('.scratch-card-canvas').forEach(canvas => {
    initScratchCanvas(canvas);
  });

  // Tap for hidden layer
  container.querySelectorAll('.scratch-card').forEach(card => {
    const idx = parseInt(card.dataset.idx);
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('scratch-card-canvas')) return;
      const canvas = card.querySelector('.scratch-card-canvas');
      if (canvas && canvas.style.opacity !== '0') return;
      const hidden = card.querySelector('.scratch-card-hidden');
      const hint = card.querySelector('.scratch-card-tap-hint');
      if (hidden && !hidden.classList.contains('visible')) {
        hidden.classList.add('visible');
        if (hint) hint.classList.remove('visible');
      }
    });
  });

  // Egg words
  document.querySelectorAll('#day1 .egg-word').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      spawnHearts(e.clientX, e.clientY);
    });
  });
}

function initScratchCanvas(canvas) {
  const card = canvas.parentElement;
  const rect = card.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');

  // Draw scratch surface
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#e8e2d9');
  grad.addColorStop(1, '#d8d2c9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Diagonal lines pattern
  ctx.strokeStyle = 'rgba(196,122,106,0.06)';
  ctx.lineWidth = 1;
  for (let i = -canvas.height; i < canvas.width + canvas.height; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + canvas.height, canvas.height);
    ctx.stroke();
  }

  // "SCRATCH HERE" watermark
  ctx.fillStyle = 'rgba(107,80,80,0.3)';
  ctx.font = '10px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2);

  // Scratch interaction
  let isScratching = false;
  let scratchedPixels = 0;
  const totalPixels = canvas.width * canvas.height;

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    scratchedPixels += 22 * 22 * Math.PI;
    const pct = scratchedPixels / totalPixels;
    if (pct > 0.6) completeScratch(canvas);
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  }

  canvas.addEventListener('mousedown', (e) => { isScratching = true; const p = getPos(e); scratch(p.x, p.y); });
  canvas.addEventListener('mousemove', (e) => { if (isScratching) { const p = getPos(e); scratch(p.x, p.y); } });
  canvas.addEventListener('mouseup', () => { isScratching = false; });
  canvas.addEventListener('mouseleave', () => { isScratching = false; });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isScratching = true; const p = getPos(e); scratch(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (isScratching) { const p = getPos(e); scratch(p.x, p.y); } }, { passive: false });
  canvas.addEventListener('touchend', () => { isScratching = false; });
}

function completeScratch(canvas) {
  if (canvas.dataset.done) return;
  canvas.dataset.done = '1';
  canvas.style.transition = 'opacity 0.5s ease';
  canvas.style.opacity = '0';
  setTimeout(() => { canvas.style.display = 'none'; }, 500);

  const idx = parseInt(canvas.dataset.idx);
  const hint = document.querySelector(`.scratch-card-tap-hint[data-idx="${idx}"]`);
  if (hint) hint.classList.add('visible');

  // Spawn flower emoji
  const card = canvas.parentElement;
  const rect = card.getBoundingClientRect();
  spawnFlowerEmoji(rect.left + rect.width / 2, rect.top + rect.height / 2);

  d1Revealed++;
  if (d1Revealed >= 6) {
    setTimeout(() => {
      document.getElementById('d1-end').classList.add('visible');
    }, 1500);
  }
}

function spawnFlowerEmoji(x, y) {
  const el = document.createElement('div');
  el.textContent = '🌸';
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:20px;pointer-events:none;z-index:100;animation:heart-float 1.4s ease-out forwards;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ══════════════════════════════════════════
// 7. DAY 2 — TERMINAL / TYPEWRITER
// ══════════════════════════════════════════
let d2Initialized = false;
let d2Typing = false;
let d2Abort = false;

// Day 2 terminal secret
let d2TypedKeys = '';
document.addEventListener('keydown', (e) => {
  if (currentScreen !== 'day2') { d2TypedKeys = ''; return; }
  d2TypedKeys += e.key.toLowerCase();
  if (d2TypedKeys.length > 10) d2TypedKeys = d2TypedKeys.slice(-10);
  if (d2TypedKeys.endsWith('yin') && d2Typing) {
    d2TerminalSecret();
  }
});

async function d2TerminalSecret() {
  d2Abort = true;
  await delay(500);
  const content = document.getElementById('d2-content');
  await typeLine(content, "you're reading this. hi.", { color: 'var(--rose)' });
  await delay(2000);
  await typeLine(content, "i see you.", { color: 'var(--rose)' });
  await delay(1500);
  d2Abort = false;
}

function initDay2() {
  if (d2Initialized) return;
  d2Initialized = true;
  startTerminal();
}

async function startTerminal() {
  const content = document.getElementById('d2-content');
  content.innerHTML = '';
  d2Typing = true;

  // PHASE 1
  await typeLine(content, 'echiche.', { speed: 60 });
  await delay(1200);
  await typeLine(content, 'thoughts.', { speed: 60 });
  await delay(800);
  await typeLine(content, 'the ones i have about you.', { speed: 45 });
  await delay(2000);
  await blankLine(content);

  // PHASE 2
  await typeLine(content, "what's the point of having eyes", { speed: 40 });
  await typeLine(content, 'if the first thing i see when i wake up', { speed: 40 });
  await typeLine(content, 'is not your face.', { speed: 40 });
  await delay(3500);
  await blankLine(content);

  // PHASE 3
  await typeLine(content, 'i catch myself mid-sentence sometimes.', { speed: 45 });
  await delay(400);
  await typeLine(content, 'thinking about something you said', { speed: 45 });
  await typeLine(content, 'three days ago.', { speed: 45 });
  await delay(600);
  await typeLine(content, "like it's still happening.", { speed: 45 });
  await delay(400);
  await typeLine(content, "like you're still talking.", { speed: 45 });
  await delay(2500);
  await blankLine(content);

  // PHASE 4
  await typeLine(content, "you don't know this.", { speed: 45 });
  await delay(1500);
  await typeLine(content, 'you send me something at 2am', { speed: 45 });
  await typeLine(content, "thinking i'm asleep.", { speed: 45 });
  await delay(1000);
  await blankLine(content);
  await typeLine(content, "i'm never asleep.", { speed: 45 });
  await delay(3000);
  await blankLine(content);

  // PHASE 5 — safety line
  await typeLine(content, 'nothing here asks anything of you.', { speed: 45, safety: true });
  await delay(1500);
  await blankLine(content);

  // PHASE 6
  await typeLine(content, "i've started measuring time differently.", { speed: 45 });
  await delay(1000);
  await typeLine(content, 'before i knew you.', { speed: 45 });
  await delay(600);
  await appendText(content, ' after.', { speed: 45 });
  await delay(1200);
  await typeLine(content, 'the second column is better.', { speed: 45 });
  await delay(3000);
  await blankLine(content, 1000);

  // PHASE 7 — close
  await typeLine(content, 'come back tomorrow.', { speed: 45, rose: true });
  await delay(1000);
  await typeLine(content, 'obi m.', { speed: 45, rose: true });
  await delay(2000);

  // Cursor continues blinking
  d2Typing = false;
}

async function typeLine(container, text, opts = {}) {
  if (d2Abort) {
    while (d2Abort) await delay(100);
  }
  const speed = opts.speed || 45;
  const line = document.createElement('div');
  line.className = 'd2-line';
  if (opts.safety) line.classList.add('safety');
  if (opts.rose) line.classList.add('rose');
  container.appendChild(line);

  for (let i = 0; i < text.length; i++) {
    if (d2Abort) { while (d2Abort) await delay(100); }
    line.textContent += text[i];
    // Auto-scroll
    container.scrollTop = container.scrollHeight;
    // Punctuation pause
    if ('.,—!'.includes(text[i])) await delay(300);
    else await delay(speed);
  }
  // Add cursor to last line
  document.querySelectorAll('.d2-cursor').forEach(c => c.remove());
  const cursor = document.createElement('span');
  cursor.className = 'd2-cursor';
  line.appendChild(cursor);
}

async function appendText(container, text, opts = {}) {
  if (d2Abort) { while (d2Abort) await delay(100); }
  const speed = opts.speed || 45;
  const lines = container.querySelectorAll('.d2-line');
  const lastLine = lines[lines.length - 1];
  for (let i = 0; i < text.length; i++) {
    if (d2Abort) { while (d2Abort) await delay(100); }
    // Insert before cursor
    const cursor = lastLine.querySelector('.d2-cursor');
    if (cursor) {
      const textNode = document.createTextNode(text[i]);
      lastLine.insertBefore(textNode, cursor);
    } else {
      lastLine.textContent += text[i];
    }
    container.scrollTop = container.scrollHeight;
    await delay(speed);
  }
}

function blankLine(container, ms = 800) {
  return new Promise(resolve => {
    const br = document.createElement('div');
    br.style.height = '1em';
    container.appendChild(br);
    container.scrollTop = container.scrollHeight;
    setTimeout(resolve, ms);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ══════════════════════════════════════════
// 8. DAY 3 — VOICE MEMOS
// ══════════════════════════════════════════
const VOICE_NOTES = [
  { timestamp: 'today, 2:47am', duration: '0:34', transcript: "you get upset when i do dumb things. not in a way that's exhausting — in a way that means you're paying attention. that's not nothing. that's actually everything.", barSeed: 42 },
  { timestamp: 'last tuesday', duration: '0:58', transcript: "your jealous side. i know you think i don't notice it. i notice it immediately, every single time, and i think about it for the rest of the day.", barSeed: 17 },
  { timestamp: 'the night after', duration: '1:12', transcript: "you wear what i like. you didn't make a big thing of it. you just — did. and i didn't say anything because i didn't have the words yet. i'm still working on the words.", barSeed: 73 },
  { timestamp: 'three weeks ago', duration: '0:47', transcript: "you call me anytime. not at convenient times. not when it makes sense. anytime. like i'm the first option, not the backup plan. do you know what that does to a person.", barSeed: 91 },
  { timestamp: 'tonight', duration: '0:29', transcript: "i love the little things. i love that it's the little things. i love that you don't even know which ones i mean.", barSeed: 55 },
];

let d3Initialized = false;
let d3Played = 0;
let d3CurrentlyPlaying = null;

function initDay3() {
  if (d3Initialized) return;
  d3Initialized = true;

  const container = document.getElementById('voice-memo-container');
  const header = container.querySelector('.voice-memo-header');

  VOICE_NOTES.forEach((note, i) => {
    // Safety line between notes 2 and 3
    if (i === 2) {
      const safety = document.createElement('div');
      safety.className = 'd3-safety';
      safety.textContent = 'nothing here asks anything of you.';
      container.appendChild(safety);
    }

    const bars = generateWaveform(note.barSeed, 40);
    const noteEl = document.createElement('div');
    noteEl.className = 'voice-note';
    noteEl.dataset.idx = i;
    noteEl.innerHTML = `
      <div class="voice-note-row">
        <div class="vn-play-btn" data-idx="${i}">▶</div>
        <div class="vn-waveform" data-idx="${i}">
          ${bars.map((h, j) => `<div class="vn-bar" data-bar="${j}" style="height:${h}px"></div>`).join('')}
        </div>
        <div class="vn-duration">${note.duration}</div>
      </div>
      <div class="vn-timestamp">${note.timestamp}</div>
      <div class="vn-transcript" data-idx="${i}">${note.transcript}</div>
    `;
    container.appendChild(noteEl);
  });

  // Play button handlers
  container.querySelectorAll('.vn-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      toggleVoiceNote(idx);
    });
  });
}

function generateWaveform(seed, count) {
  const bars = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 0) % 2147483647;
    bars.push(4 + (s % 21));
  }
  return bars;
}

function toggleVoiceNote(idx) {
  // Stop current if different
  if (d3CurrentlyPlaying !== null && d3CurrentlyPlaying !== idx) {
    stopVoiceNote(d3CurrentlyPlaying);
  }

  if (d3CurrentlyPlaying === idx) {
    stopVoiceNote(idx);
    return;
  }

  // Play new
  d3CurrentlyPlaying = idx;
  const btn = document.querySelector(`.vn-play-btn[data-idx="${idx}"]`);
  const transcript = document.querySelector(`.vn-transcript[data-idx="${idx}"]`);
  const waveform = document.querySelector(`.vn-waveform[data-idx="${idx}"]`);
  btn.textContent = '■';
  btn.classList.add('playing');
  transcript.classList.add('open');

  // Animate waveform bars
  const bars = waveform.querySelectorAll('.vn-bar');
  let currentBar = 0;
  const interval = setInterval(() => {
    if (currentBar < bars.length) {
      bars[currentBar].classList.add('played');
      currentBar++;
    } else {
      clearInterval(interval);
      // Auto-stop when done
      setTimeout(() => {
        if (d3CurrentlyPlaying === idx) stopVoiceNote(idx);
      }, 500);
    }
  }, 80);

  btn._interval = interval;

  // Check if all played
  d3Played = document.querySelectorAll('.vn-transcript.open').length;
  if (d3Played >= 5) {
    setTimeout(() => {
      document.getElementById('d3-end').classList.add('visible');
    }, 1500);
  }
}

function stopVoiceNote(idx) {
  const btn = document.querySelector(`.vn-play-btn[data-idx="${idx}"]`);
  if (!btn) return;
  btn.textContent = '▶';
  btn.classList.remove('playing');
  if (btn._interval) clearInterval(btn._interval);
  d3CurrentlyPlaying = null;
}

// ══════════════════════════════════════════
// 9. DAY 4 — IGBO SLIDESHOW
// ══════════════════════════════════════════
const SLIDES = [
  {
    igbo: 'Ụtọ', translation: 'sweetness.',
    body: ['the way you exist in a room.', 'the way a conversation feels different', "after you've been in it."],
    bg: 'var(--bg-primary)', textColor: true, duration: 7000,
  },
  {
    igbo: 'Echiche', translation: 'thoughts.',
    body: ['you are the recurring one.', 'the one that shows up without invitation', 'and stays without apology.'],
    bg: '#0f0808', textColor: false, duration: 7000,
  },
  {
    igbo: 'Obi m', translation: 'my heart.',
    body: ['two words.', 'the shortest thing i could say', 'and the truest.'],
    bg: '#1a0c0c', textColor: false, duration: 7000,
  },
  {
    igbo: "Ahụrụmgị n'anya", translation: 'i see you in my heart.',
    body: ['not just look at you.', 'see you.', 'the version most people miss.', "i don't miss it."],
    bg: 'linear-gradient(160deg, #1a0808 0%, #0a0404 100%)', textColor: false, duration: 10000,
    note: '[this is different from Ifunanya — this is the action. the living version of love.]',
    igboSmall: true, igboColor: 'var(--rose)',
  },
  {
    igbo: 'Ifunanya', translation: 'love in its purest form.',
    body: ['before it becomes complicated.', 'before it needs explaining.', 'just — this.', 'just you.'],
    bg: 'var(--bg-primary)', textColor: true, duration: 7000,
  },
  {
    igbo: 'Ndụ m', translation: 'my life.',
    body: [],
    bg: '#0a0404', textColor: false, duration: 12000,
    endSlide: true,
  },
];

let d4Initialized = false;
let d4CurrentSlide = 0;
let d4SlideTimer = null;

document.getElementById('d4-sound-btn').addEventListener('click', () => {
  document.getElementById('d4-sound-gate').classList.add('hidden');
  document.getElementById('d4-slides').classList.add('active');
  playMusic(4);
  if (!d4Initialized) {
    d4Initialized = true;
    buildSlides();
    showSlide(0);
  }
});

function buildSlides() {
  const container = document.getElementById('d4-slides');
  container.innerHTML = SLIDES.map((slide, i) => {
    const isLight = slide.textColor;
    const igboColor = slide.igboColor || (isLight ? 'var(--text-primary)' : 'rgba(245,240,232,0.9)');
    const transColor = isLight ? 'var(--text-secondary)' : (slide.igbo === 'Echiche' ? 'var(--rose-light)' : (slide.igbo === 'Obi m' ? 'var(--rose)' : 'var(--rose-light)'));
    const bodyColor = isLight ? 'var(--text-secondary)' : (slide.igbo === 'Ụtọ' ? 'var(--text-secondary)' : 'rgba(245,240,232,0.55)');

    return `
      <div class="d4-slide" data-idx="${i}" style="background: ${slide.bg}; color: ${isLight ? 'var(--text-primary)' : 'rgba(245,240,232,0.8)'}">
        <div class="d4-slide-igbo ${slide.igboSmall ? 'small' : ''}" style="color: ${igboColor}">${slide.igbo}</div>
        <div class="d4-slide-translation" style="color: ${transColor}">${slide.translation}</div>
        ${slide.body.length ? `<div class="d4-slide-body">
          ${slide.body.map(line => `<div class="d4-slide-body-line" style="color: ${bodyColor}">${line}</div>`).join('')}
        </div>` : ''}
        ${slide.note ? `<div class="d4-slide-note">${slide.note}</div>` : ''}
        ${slide.endSlide ? `<div class="d4-slide-body-line" id="d4-tomorrow" style="color: rgba(245,240,232,0.25); font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16px; margin-top: 40px; opacity: 0; transition: opacity 1.5s ease;">tomorrow.</div>` : ''}
      </div>
    `;
  }).join('');
}

function showSlide(idx) {
  d4CurrentSlide = idx;
  const slides = document.querySelectorAll('.d4-slide');
  const dots = document.querySelectorAll('.d4-dot');

  slides.forEach((s, i) => {
    s.classList.toggle('active', i === idx);
  });
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });

  const slide = SLIDES[idx];

  // Staggered text appearance
  setTimeout(() => {
    const igbo = slides[idx].querySelector('.d4-slide-igbo');
    if (igbo) igbo.classList.add('visible');
  }, 500);

  setTimeout(() => {
    const trans = slides[idx].querySelector('.d4-slide-translation');
    if (trans) trans.classList.add('visible');
  }, 1500);

  const bodyLines = slides[idx].querySelectorAll('.d4-slide-body-line');
  bodyLines.forEach((line, i) => {
    setTimeout(() => line.classList.add('visible'), 2000 + i * 500);
  });

  if (slide.note) {
    setTimeout(() => {
      const note = slides[idx].querySelector('.d4-slide-note');
      if (note) note.classList.add('visible');
    }, 2000 + bodyLines.length * 500 + 1500);
  }

  // End slide special behavior
  if (slide.endSlide) {
    setTimeout(() => {
      const tomorrow = document.getElementById('d4-tomorrow');
      if (tomorrow) tomorrow.style.opacity = '1';
    }, 8000);

    // Music fade out + fade to black
    setTimeout(() => {
      stopMusic();
      document.getElementById('d4-end').classList.add('visible');
      document.getElementById('day4-back').style.display = 'block';
    }, 12000);
  } else {
    // Auto-advance
    d4SlideTimer = setTimeout(() => {
      if (idx < SLIDES.length - 1) {
        showSlide(idx + 1);
      }
    }, slide.duration);
  }
}

document.getElementById('d4-end-back').addEventListener('click', goHome);

// ══════════════════════════════════════════
// 10. DAY 5 — BIRTHDAY
// ══════════════════════════════════════════
let d5Initialized = false;

function initDay5() {
  if (d5Initialized) return;
  d5Initialized = true;
  playMusic(5);
}

// Envelope gate
document.getElementById('envelope-icon').addEventListener('click', () => {
  const gate = document.getElementById('envelope-gate');
  const icon = document.getElementById('envelope-icon');
  const flash = document.getElementById('flash-overlay');

  // Envelope animation
  icon.style.transition = 'transform 0.6s ease, opacity 0.3s ease 0.3s';
  icon.style.transform = 'scale(1.2) rotate(5deg)';
  setTimeout(() => { icon.style.opacity = '0'; }, 300);
  setTimeout(() => { gate.classList.add('hidden'); }, 600);

  // Flash
  flash.style.opacity = '0.6';
  setTimeout(() => { flash.style.opacity = '0'; }, 400);

  // Show content
  setTimeout(() => {
    document.getElementById('bday-content').classList.add('visible');
    document.getElementById('day5-back').style.display = 'block';
    launchConfetti();
    setTimeout(launchConfetti, 3000);
  }, 400);
});

// 10.3 Confetti
function launchConfetti() {
  const cv = document.getElementById('confetti-canvas');
  cv.style.display = 'block';
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  const ctx = cv.getContext('2d');
  const cols = ['#c47a6a', '#e8b4a0', '#9e4a3a', '#c9956c', '#f5f0e8', '#ffffff', '#f9c6b5', '#ffd6cc'];
  const pieces = Array.from({ length: 200 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: window.innerHeight * 0.8,
    vx: (Math.random() - 0.5) * 12,
    vy: -8 - Math.random() * 12,
    r: 3 + Math.random() * 6,
    color: cols[~~(Math.random() * cols.length)],
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.2,
    gravity: 0.15 + Math.random() * 0.1,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));
  let f = 0;
  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rot += p.rotV;
      p.vx *= 0.99;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      }
      ctx.restore();
    });
    f++;
    if (f < 480) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; }
  }
  draw();
}

// 10.4.3 10 Ways modal
const TEN_WAYS = [
  "the way i reach for my phone when something happens — and your name is already there before i think.",
  "the way i listen. every word. even when i say nothing back.",
  "the way i notice things. the small things. the ones you think no one sees.",
  "the way being around you makes me want to be more deliberate. more present. more worth it.",
  "the way i stay up. not from habit — because time with you doesn't feel like something to cut short.",
  "the way i think about you mid-sentence when we're not talking. mid-sentence.",
  "the way your voice sounds when you're telling me something that matters to you. i could live there.",
  "the way i'm honest with you. even when it costs something. because you deserve actual.",
  "the way i made this. five days. not because it was easy — because you are worth the specific effort.",
  "the way i feel certain about very few things. you are one of them.",
];

document.getElementById('ten-ways-btn').addEventListener('click', () => {
  const modal = document.getElementById('ten-ways-modal');
  const content = document.getElementById('ten-ways-content');
  content.innerHTML = TEN_WAYS.map((text, i) => `
    <div class="ten-ways-item">
      <div class="ten-ways-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="ten-ways-text">${text}</div>
    </div>
    ${i < 9 ? '<div class="ten-ways-sep"></div>' : ''}
  `).join('') + `
    <div class="ten-ways-signoff">— J</div>
  `;
  modal.classList.add('open');
});

document.getElementById('ten-ways-close').addEventListener('click', () => {
  document.getElementById('ten-ways-modal').classList.remove('open');
});

// 11. Birthday Modal
document.getElementById('ten-ways-btn').addEventListener('click', () => {}); // placeholder

// Petal rating
document.getElementById('modal-petals').addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('modal-petal')) {
    const val = parseInt(e.target.dataset.val);
    document.querySelectorAll('.modal-petal').forEach((p, i) => {
      p.classList.toggle('active', i < val);
    });
  }
});

document.getElementById('modal-petals').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-petal')) {
    const val = parseInt(e.target.dataset.val);
    document.getElementById('field-surprise').value = val;
    document.querySelectorAll('.modal-petal').forEach((p, i) => {
      p.classList.toggle('active', i < val);
    });
  }
});

// Form submission
document.getElementById('modal-submit').addEventListener('click', () => {
  const data = {
    shoeSize: 41,
    dressSize: document.getElementById('field-dress').value,
    somethingToSay: document.getElementById('field-say').value,
    favouriteMemory: document.getElementById('field-memory').value,
    wantToExperience: document.getElementById('field-experience').value,
    placeToGo: document.getElementById('field-place').value,
    songRightNow: document.getElementById('field-song').value,
    surpriseRating: document.getElementById('field-surprise').value,
  };

  localStorage.setItem(LS_KEY_FORM, JSON.stringify(data));

  // Attempt mailto
  const subject = encodeURIComponent('🌸 Yin filled in the form — May 29');
  const body = encodeURIComponent(
    `Shoe Size: ${data.shoeSize}\n` +
    `Dress Size: ${data.dressSize}\n` +
    `Something to Say: ${data.somethingToSay}\n` +
    `Favourite Memory: ${data.favouriteMemory}\n` +
    `Want to Experience: ${data.wantToExperience}\n` +
    `Place to Go: ${data.placeToGo}\n` +
    `Song Right Now: ${data.songRightNow}\n` +
    `Surprise Rating: ${data.surpriseRating}/10`
  );
  window.open(`mailto:${JAE_EMAIL}?subject=${subject}&body=${body}`);

  // Show success
  document.getElementById('modal-form').style.display = 'none';
  document.getElementById('modal-success').classList.add('visible');
});

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('birthday-modal').classList.remove('open');
  localStorage.setItem(LS_KEY_MODAL, '1');
});

// Auto-show birthday modal after 5s on Day 5
function showBirthdayModalAuto() {
  if (localStorage.getItem(LS_KEY_MODAL)) return;
  setTimeout(() => {
    document.getElementById('birthday-modal').classList.add('open');
  }, 5000);
}

// ══════════════════════════════════════════
// 12. ADMIN PANEL
// ══════════════════════════════════════════
let tapCount = 0;
let tapTimer = null;

document.getElementById('home').addEventListener('click', (e) => {
  if (e.clientX < 60 && e.clientY > window.innerHeight - 60) {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => tapCount = 0, 3000);
    if (tapCount >= 5) { tapCount = 0; openAdminPanel(); }
  }
});

document.getElementById('admin-trigger').addEventListener('click', openAdminPanel);

function openAdminPanel() {
  document.getElementById('admin-panel').classList.add('open');
  const existing = localStorage.getItem(LS_KEY_MSG);
  if (existing) document.getElementById('admin-msg').value = existing;
}

document.getElementById('admin-cancel-btn').addEventListener('click', () => {
  document.getElementById('admin-panel').classList.remove('open');
});

document.getElementById('admin-save-btn').addEventListener('click', () => {
  const pw = document.getElementById('admin-pw').value;
  const msg = document.getElementById('admin-msg').value.trim();
  const st = document.getElementById('admin-status');
  if (pw !== ADMIN_PASSWORD) {
    st.textContent = '❌ Wrong password.';
    st.classList.add('visible');
    return;
  }
  if (!msg) {
    st.textContent = '⚠️ Write something first.';
    st.classList.add('visible');
    return;
  }
  localStorage.setItem(LS_KEY_MSG, msg);
  st.textContent = '✅ sent.';
  st.classList.add('visible');
  setTimeout(() => {
    document.getElementById('admin-panel').classList.remove('open');
    st.classList.remove('visible');
    loadLiveMessage(TODAY);
  }, 1200);
});

// ══════════════════════════════════════════
// 12.3 LIVE MESSAGE
// ══════════════════════════════════════════
function loadLiveMessage(day) {
  const msg = localStorage.getItem(LS_KEY_MSG);
  if (!msg) {
    document.getElementById('live-ticker-top').classList.remove('visible');
    document.getElementById('live-home-msg').classList.remove('visible');
    document.getElementById('live-day5').classList.remove('visible');
    return;
  }
  document.getElementById('live-ticker-top').classList.add('visible');
  document.getElementById('live-home-text').textContent = msg;
  document.getElementById('live-home-msg').classList.add('visible');
  if (day === 5) {
    document.getElementById('live-day5-text').textContent = msg;
    document.getElementById('live-day5').classList.add('visible');
  }
}
loadLiveMessage(TODAY);
setInterval(() => loadLiveMessage(TODAY), 30000);

// ══════════════════════════════════════════
// 13. LIGHTBOX
// ══════════════════════════════════════════
const CAPTIONS = [
  'this one. i keep coming back to this one.',
  "you don't know i have this saved.",
  'this is the one that started everything.',
  'i remember exactly where we were.',
  'you look like yourself here. fully.',
  'the last one. for now.',
];

document.getElementById('d5-grid').addEventListener('click', (e) => {
  const photo = e.target.closest('.d5-photo');
  if (!photo) return;
  const idx = parseInt(photo.dataset.idx);
  const img = photo.querySelector('img');
  if (!img) return; // placeholder — no lightbox for placeholders
  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-caption').textContent = CAPTIONS[idx] || '';
  document.getElementById('lightbox').classList.add('open');
});

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

// ══════════════════════════════════════════
// 14. EASTER EGGS
// ══════════════════════════════════════════
function spawnHearts(x, y) {
  const container = document.getElementById('egg-hearts');
  const emojis = ['🌸', '💗', '✨', '💕', '🌷', '💖', '🫶'];
  for (let i = 0; i < 7; i++) {
    const h = document.createElement('div');
    h.className = 'egg-heart';
    h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    h.style.cssText = `left:${x + (Math.random() - 0.5) * 60}px;top:${y}px;animation-delay:${i * 0.08}s;`;
    container.appendChild(h);
    setTimeout(() => h.remove(), 1600);
  }
}

// 14.2 Hidden sixth page
let secretTapCount = 0;
let secretTapTimer = null;
document.getElementById('petal-canvas').addEventListener('click', () => {
  secretTapCount++;
  clearTimeout(secretTapTimer);
  secretTapTimer = setTimeout(() => secretTapCount = 0, 3000);
  if (secretTapCount >= 5) {
    secretTapCount = 0;
    document.getElementById('secret-page').classList.add('open');
  }
});

document.getElementById('secret-page').addEventListener('click', () => {
  document.getElementById('secret-page').classList.remove('open');
});

// ══════════════════════════════════════════
// BACK BUTTONS
// ══════════════════════════════════════════
document.getElementById('day1-back').addEventListener('click', goHome);
document.getElementById('day2-back').addEventListener('click', goHome);
document.getElementById('day3-back').addEventListener('click', goHome);
document.getElementById('day4-back').addEventListener('click', goHome);
document.getElementById('day5-back').addEventListener('click', goHome);

// ══════════════════════════════════════════
// DAY 5 AUTO-MODAL TRIGGER
// ══════════════════════════════════════════
// Watch for bday-content becoming visible
const bdayObserver = new MutationObserver(() => {
  if (document.getElementById('bday-content').classList.contains('visible')) {
    showBirthdayModalAuto();
    bdayObserver.disconnect();
  }
});
bdayObserver.observe(document.getElementById('bday-content'), { attributes: true, attributeFilter: ['class'] });

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
// Page Visibility API — pause petal canvas when hidden
document.addEventListener('visibilitychange', () => {
  // Petals use rAF which auto-pauses when hidden
  // YouTube iframes also auto-pause
});
