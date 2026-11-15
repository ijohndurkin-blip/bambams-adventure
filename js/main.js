import * as THREE from 'three';
import { createBamBam } from './bambam.js';
import { buildWorld, ZONES, ISLAND_RADIUS } from './world.js';
import { makeQuestions } from './quests.js';
import { makeOrb, updateOrb, makeStarMesh } from './orbs.js';
import { createSound } from './audio.js';
import { makeSkyTexture, pick, mulberry32 } from './util.js';

const $ = (id) => document.getElementById(id);

// =====================================================================
// Save data (kept on this device only)
// =====================================================================
const SAVE_KEY = 'bambams-adventures-v1';
const HAT_GOALS = [10, 30, 60, 100];
const HAT_NAMES = ['party hat', 'explorer hat', 'crown', 'wizard hat'];
const QUEST_LENGTH = 5;
const BREAK_AFTER_SECONDS = 20 * 60;

function freshSave() {
  const s = { stars: 0, hat: 0, age: 0, music: true, voice: true, levels: {}, badges: {} };
  ZONES.forEach((z) => { s.levels[z.id] = 1; s.badges[z.id] = [false, false, false]; });
  return s;
}
function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && typeof raw.stars === 'number') {
      const s = freshSave();
      Object.assign(s, raw);
      ZONES.forEach((z) => {
        s.levels[z.id] = Math.min(3, Math.max(1, s.levels[z.id] || 1));
        if (!Array.isArray(s.badges[z.id])) s.badges[z.id] = [false, false, false];
      });
      return s;
    }
  } catch (e) { /* storage unavailable: play without saving */ }
  return freshSave();
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
}
let save = loadSave();

// =====================================================================
// Scene
// =====================================================================
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = makeSkyTexture();
scene.fog = new THREE.Fog(0xcfeeff, 70, 230);

const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 600);

scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c9b0, 1.3));
const sun = new THREE.DirectionalLight(0xfff1d0, 1.9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -26; sun.shadow.camera.right = 26;
sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0015;
scene.add(sun, sun.target);

const world = buildWorld(scene);
const bam = createBamBam();
scene.add(bam.group);
bam.setHat(save.hat);

const sound = createSound();

// where-to-walk marker
const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.75, 28),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }),
);
marker.rotation.x = -Math.PI / 2; marker.position.y = 0.08; marker.visible = false;
scene.add(marker);

// ---------- sparkles ----------
const sparkGeo = new THREE.OctahedronGeometry(0.22);
const sparks = [];
const SPARK_COLORS = [0xffd23f, 0xff6b8b, 0x5ec8f2, 0x7ee081, 0xffffff, 0xE8833A];
for (let i = 0; i < 70; i++) {
  const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: SPARK_COLORS[i % SPARK_COLORS.length] }));
  m.visible = false;
  scene.add(m);
  sparks.push({ mesh: m, life: 0, vx: 0, vy: 0, vz: 0 });
}
function burst(x, y, z, count = 18, power = 7) {
  let n = 0;
  for (const s of sparks) {
    if (s.life > 0) continue;
    const a = Math.random() * Math.PI * 2, up = 0.4 + Math.random() * 0.9;
    s.vx = Math.cos(a) * power * (0.4 + Math.random() * 0.6);
    s.vz = Math.sin(a) * power * (0.4 + Math.random() * 0.6);
    s.vy = power * up;
    s.life = 0.8 + Math.random() * 0.5;
    s.mesh.position.set(x, y, z);
    s.mesh.visible = true;
    if (++n >= count) break;
  }
}

// ---------- stars to find around the island ----------
const pickups = [];
{
  const rand = mulberry32(77);
  let guard = 0;
  while (pickups.length < 14 && guard++ < 500) {
    const a = rand() * Math.PI * 2, r = 10 + rand() * 42;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (world.obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + 1.5)) continue;
    if (ZONES.some((zn) => Math.hypot(zn.x - x, zn.z - z) < 9)) continue;
    if (pickups.some((p) => Math.hypot(p.x - x, p.z - z) < 8)) continue;
    const mesh = makeStarMesh();
    mesh.position.set(x, 1.4, z);
    scene.add(mesh);
    pickups.push({ mesh, x, z, respawn: 0 });
  }
}

// =====================================================================
// Game state
// =====================================================================
const player = { x: 0, y: 0, z: 3, vy: 0, heading: 0, speed: 0 };
const keys = new Set();
let moveTarget = null;
let mode = 'title'; // title | play
let quest = null;
let gatesArmed = true;
let playSeconds = 0;
let clock = 0;
const camPos = new THREE.Vector3(6, 4, 12);
const camLook = new THREE.Vector3(0, 2.4, 0);

// =====================================================================
// UI helpers
// =====================================================================
let hintTimer = 0;
function hint(text, seconds = 6) { $('hint').textContent = text; hintTimer = seconds; }

function toast(text) {
  const el = $('toast');
  el.hidden = true;
  void el.offsetWidth; // restart the animation
  el.textContent = text;
  el.hidden = false;
}

function unlockedHats() { return HAT_GOALS.filter((g) => save.stars >= g).length; }

function addStars(n) {
  const before = unlockedHats();
  save.stars += n;
  $('star-count').textContent = save.stars;
  const pill = $('stars');
  pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop');
  const after = unlockedHats();
  if (after > before) {
    save.hat = after;
    bam.setHat(save.hat);
    setTimeout(() => {
      toast(`New hat! 🎉`);
      sound.speak(`Wow! You unlocked the ${HAT_NAMES[after - 1]}!`, { queue: true });
      burst(player.x, 4.5, player.z, 24, 8);
    }, 1200);
  }
  persist();
}

function refreshGateSigns() {
  world.gates.forEach((g) => g.redraw(save.levels[g.zone.id]));
}

function refreshToggles() {
  $('btn-music').classList.toggle('off', !save.music);
  $('btn-voice').classList.toggle('off', !save.voice);
}

// =====================================================================
// Quests
// =====================================================================
const PRAISE = ['Brilliant!', 'Well done!', 'Super!', 'You got it!', 'Amazing!', 'Fantastic!', 'Great job!'];
const ENCOURAGE = ['Not quite. Try again!', 'Nearly! Have another go.', 'Oops! Try a different one.'];

function startQuest(zone) {
  const level = save.levels[zone.id];
  quest = {
    zone, level, index: -1, firstTry: 0, earned: 0, orbs: [], accepting: false, missed: false,
    questions: makeQuestions(zone.id, level, QUEST_LENGTH), timer: null,
  };
  const gate = world.gates.find((g) => g.zone === zone);
  gate.beam.visible = false; gate.sprite.visible = false;
  $('question').hidden = false;
  $('question').style.setProperty('--zone', zone.color);
  $('q-zone').textContent = `${zone.name} · Level ${level}`;
  $('btn-leave').hidden = false;
  $('result').hidden = true;
  sound.sfx.enter();
  hint('Walk Bam Bam into the right bubble!', 5);
  nextQuestion();
}

function clearOrbs() {
  if (!quest) return;
  quest.orbs.forEach((o) => { if (o.dying < 0) o.dying = 0; o.alive = false; });
}

function nextQuestion() {
  quest.index++;
  if (quest.index >= quest.questions.length) { finishQuest(); return; }
  const q = quest.questions[quest.index];
  quest.missed = false;
  quest.accepting = true;
  $('q-text').textContent = q.prompt;
  const pips = $('q-pips');
  pips.innerHTML = '';
  quest.questions.forEach((_, i) => {
    const s = document.createElement('span');
    if (i < quest.index) s.className = 'done';
    else if (i === quest.index) s.className = 'now';
    pips.appendChild(s);
  });
  sound.speak(q.say, { queue: true });

  // Put the answer bubbles in a ring, turned so none lands on top of Bam Bam.
  const n = q.options.length;
  const R = 7;
  let best = 0, bestD = -1;
  for (let k = 0; k < 12; k++) {
    const off = (k / 12) * (Math.PI * 2 / n);
    let minD = Infinity;
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2;
      minD = Math.min(minD, Math.hypot(quest.zone.x + Math.cos(a) * R - player.x, quest.zone.z + Math.sin(a) * R - player.z));
    }
    if (minD > bestD) { bestD = minD; best = off; }
  }
  q.options.forEach((opt, i) => {
    const a = best + (i / n) * Math.PI * 2;
    const orb = makeOrb(opt, quest.zone.color);
    orb.index = i;
    orb.group.position.set(quest.zone.x + Math.cos(a) * R, 0, quest.zone.z + Math.sin(a) * R);
    scene.add(orb.group);
    quest.orbs.push(orb);
  });
}

function answer(orb) {
  const q = quest.questions[quest.index];
  const p = orb.group.position;
  if (orb.index === q.answer) {
    quest.accepting = false;
    const gain = quest.missed ? 1 : 2;
    if (!quest.missed) quest.firstTry++;
    quest.earned += gain;
    addStars(gain);
    sound.sfx.correct();
    burst(p.x, 2.4, p.z, 22, 8);
    bam.cheer(1.3);
    const word = pick(PRAISE);
    toast(`${word} ${'⭐'.repeat(gain)}`);
    sound.speak(word);
    clearOrbs();
    moveTarget = null;
    quest.timer = setTimeout(() => { if (quest) nextQuestion(); }, 1500);
  } else {
    quest.missed = true;
    orb.alive = false; orb.dying = 0;
    sound.sfx.wrong();
    const word = pick(ENCOURAGE);
    hint(word, 3);
    sound.speak(word);
  }
}

function finishQuest() {
  const { zone, level, firstTry, earned } = quest;
  save.badges[zone.id][level - 1] = true;
  let levelUp = false;
  if (firstTry >= QUEST_LENGTH - 1 && level < 3) { save.levels[zone.id] = level + 1; levelUp = true; }
  persist();
  refreshGateSigns();
  sound.sfx.fanfare();
  bam.cheer(3);
  burst(player.x, 4, player.z, 40, 10);

  $('r-medal').textContent = ['🥉', '🥈', '🥇'][level - 1];
  $('r-title').textContent = levelUp ? 'Level up!' : pick(['Quest complete!', 'You did it!', 'Super work!']);
  let text = `You answered ${QUEST_LENGTH} questions in ${zone.name} and won ${earned} stars! ⭐`;
  if (levelUp) text += `\nBam Bam thinks you are ready for Level ${level + 1}.`;
  else if (level === 3 && firstTry >= QUEST_LENGTH - 1) text += '\nYou are a champion of the top level!';
  $('r-text').textContent = text;
  sound.speak(levelUp ? `Level up! You won ${earned} stars!` : `Well done! You won ${earned} stars!`, { queue: true });
  const z = zone;
  endQuest();
  $('result').hidden = false;
  $('r-again').onclick = () => { $('result').hidden = true; startQuest(z); };
}

function endQuest() {
  if (!quest) return;
  clearTimeout(quest.timer);
  const gate = world.gates.find((g) => g.zone === quest.zone);
  gate.beam.visible = true; gate.sprite.visible = true;
  clearOrbs();
  dyingOrbs.push(...quest.orbs);
  quest = null;
  gatesArmed = false;
  $('question').hidden = true;
  $('btn-leave').hidden = true;
}
const dyingOrbs = [];

// =====================================================================
// Sticker book
// =====================================================================
function openBook() {
  const grid = $('book-grid');
  grid.innerHTML = '';
  ZONES.forEach((z) => {
    const div = document.createElement('div');
    div.className = 'book-zone';
    div.style.background = z.color;
    const h = document.createElement('h3');
    h.textContent = `${z.icon} ${z.name}`;
    const badges = document.createElement('div');
    badges.className = 'badges';
    ['🥉', '🥈', '🥇'].forEach((m, i) => {
      const s = document.createElement('span');
      const got = save.badges[z.id][i];
      s.textContent = got ? m : '🔒';
      if (got) s.className = 'got';
      badges.appendChild(s);
    });
    div.append(h, badges);
    grid.appendChild(div);
  });
  const next = HAT_GOALS.find((g) => save.stars < g);
  $('book-hats').textContent = `⭐ ${save.stars} stars · 🎩 ${unlockedHats()} of ${HAT_GOALS.length} hats`
    + (next ? ` · next hat at ${next} stars` : ' · you have every hat!');
  resetArmed = false;
  $('book-reset').textContent = 'Grown-ups: start again from the beginning';
  $('book').hidden = false;
}
let resetArmed = false;

// =====================================================================
// Input
// =====================================================================
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
let dragging = false;

function pointToGround(ev) {
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (!raycaster.ray.intersectPlane(groundPlane, hitPoint)) return;
  const d = Math.hypot(hitPoint.x, hitPoint.z);
  const max = ISLAND_RADIUS;
  const k = d > max ? max / d : 1;
  moveTarget = { x: hitPoint.x * k, z: hitPoint.z * k };
  marker.position.set(moveTarget.x, 0.08, moveTarget.z);
  marker.visible = true;
}
canvas.addEventListener('pointerdown', (ev) => {
  if (mode !== 'play') return;
  dragging = true;
  canvas.setPointerCapture?.(ev.pointerId);
  pointToGround(ev);
});
canvas.addEventListener('pointermove', (ev) => { if (dragging && mode === 'play') pointToGround(ev); });
['pointerup', 'pointercancel'].forEach((n) => canvas.addEventListener(n, () => { dragging = false; }));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
window.addEventListener('keydown', (e) => {
  if (mode !== 'play') return;
  if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
  if (e.code === 'Space') { jump(); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); });
window.addEventListener('blur', () => keys.clear());

function jump() {
  if (player.y <= 0.001) { player.vy = 12.5; sound.sfx.jump(); }
}

// ---------- buttons ----------
$('btn-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
$('btn-music').onclick = () => { save.music = !save.music; sound.setMusic(save.music); refreshToggles(); persist(); };
$('btn-voice').onclick = () => {
  save.voice = !save.voice; sound.setVoice(save.voice); refreshToggles(); persist();
  if (save.voice) sound.speak('Hello!');
};
$('btn-hat').onclick = () => {
  const n = unlockedHats();
  if (n === 0) {
    hint(`Collect ${HAT_GOALS[0]} stars to win Bam Bam's first hat!`, 4);
    sound.speak(`Collect ${HAT_GOALS[0]} stars to win my first hat!`);
    return;
  }
  save.hat = (save.hat + 1) % (n + 1);
  bam.setHat(save.hat);
  sound.sfx.pop();
  persist();
};
$('btn-book').onclick = openBook;
$('book-close').onclick = () => { $('book').hidden = true; };
$('book-reset').onclick = () => {
  if (!resetArmed) { resetArmed = true; $('book-reset').textContent = 'Tap again to wipe all stars and stickers'; return; }
  const keep = { music: save.music, voice: save.voice };
  save = Object.assign(freshSave(), keep);
  persist();
  bam.setHat(0);
  $('star-count').textContent = 0;
  refreshGateSigns();
  $('book').hidden = true;
};
$('btn-leave').onclick = () => { endQuest(); hint('Back to exploring!', 3); };
$('r-explore').onclick = () => { $('result').hidden = true; hint('Find another glowing circle, or hunt for stars!', 5); };
$('q-speak').onclick = () => { if (quest) sound.speak(quest.questions[quest.index].say); };
$('break-ok').onclick = () => { $('break').hidden = true; playSeconds = 0; };

// ---------- title screen ----------
const ageButtons = [...document.querySelectorAll('.ages button')];
function showAge() { ageButtons.forEach((b) => b.classList.toggle('on', Number(b.dataset.age) === save.age)); }
ageButtons.forEach((b) => {
  b.onclick = () => { save.age = Number(b.dataset.age); showAge(); };
});
showAge();

$('play').onclick = () => {
  // older children start one level up; nobody is ever moved down
  const base = save.age >= 7 ? 2 : 1;
  ZONES.forEach((z) => { save.levels[z.id] = Math.max(save.levels[z.id], base); });
  persist();
  refreshGateSigns();
  sound.setVoice(save.voice);
  sound.setMusic(save.music);
  sound.startMusic();
  $('title').hidden = true;
  $('hud').hidden = false;
  $('star-count').textContent = save.stars;
  refreshToggles();
  mode = 'play';
  bam.wave(3);
  const touch = matchMedia('(pointer: coarse)').matches;
  hint(touch ? 'Tap where you want Bam Bam to go!' : 'Click where you want Bam Bam to go, or use the arrow keys!', 9);
  sound.speak("Hi! I'm Bam Bam! Tap where you want me to go. Walk into a glowing circle to play a learning game!");
};

// =====================================================================
// Main loop
// =====================================================================
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 62 : 50;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const SPEED = 9.5;
const want = new THREE.Vector3(), look = new THREE.Vector3();

function updatePlayer(dt) {
  let mx = 0, mz = 0, speed = SPEED;
  if (keys.size) {
    if (keys.has('up')) mz -= 1;
    if (keys.has('down')) mz += 1;
    if (keys.has('left')) mx -= 1;
    if (keys.has('right')) mx += 1;
    const l = Math.hypot(mx, mz);
    if (l) { mx /= l; mz /= l; moveTarget = null; marker.visible = false; }
  } else if (moveTarget) {
    const dx = moveTarget.x - player.x, dz = moveTarget.z - player.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.3) { moveTarget = null; marker.visible = false; }
    else { mx = dx / d; mz = dz / d; speed = Math.min(SPEED, d / dt); }
  }

  const moving = mx !== 0 || mz !== 0;
  if (moving) {
    player.x += mx * speed * dt;
    player.z += mz * speed * dt;
    const targetHeading = Math.atan2(mx, mz);
    let diff = targetHeading - player.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.heading += diff * Math.min(1, dt * 12);
  }
  player.speed = moving ? speed : 0;

  // trees, rocks and the house are solid
  for (const o of world.obstacles) {
    const dx = player.x - o.x, dz = player.z - o.z;
    const d = Math.hypot(dx, dz), min = o.r + 0.9;
    if (d < min && d > 0.0001) {
      player.x = o.x + (dx / d) * min;
      player.z = o.z + (dz / d) * min;
      if (moveTarget && Math.hypot(moveTarget.x - o.x, moveTarget.z - o.z) < min) { moveTarget = null; marker.visible = false; }
    }
  }
  // stay on the island
  const r = Math.hypot(player.x, player.z);
  if (r > ISLAND_RADIUS) { player.x *= ISLAND_RADIUS / r; player.z *= ISLAND_RADIUS / r; }

  // jumping
  if (player.y > 0 || player.vy > 0) {
    player.vy -= 32 * dt;
    player.y += player.vy * dt;
    if (player.y <= 0) { player.y = 0; player.vy = 0; }
  }

  bam.group.position.set(player.x, player.y, player.z);
  bam.group.rotation.y = player.heading;
}

function updateCamera(dt, snap = false) {
  const portrait = camera.aspect < 1;
  if (mode === 'title') {
    const a = clock * 0.15;
    want.set(Math.sin(a) * 2.5 + (portrait ? 0 : -3.6), portrait ? 3.4 : 3.2, player.z + (portrait ? 13 : 9.5));
    look.set(portrait ? 0 : -3.6, portrait ? 0.4 : 2.1, player.z);
  } else if (quest) {
    const cx = (player.x + quest.zone.x) / 2, cz = (player.z + quest.zone.z) / 2;
    want.set(cx, portrait ? 24 : 15, cz + (portrait ? 24 : 18.5));
    look.set(cx, 1.5, cz - 1);
  } else {
    want.set(player.x, portrait ? 17 : 11.5, player.z + (portrait ? 21 : 15.5));
    look.set(player.x, 2.2, player.z - 2);
  }
  const k = snap ? 1 : Math.min(1, dt * 3.2);
  camPos.lerp(want, k);
  camLook.lerp(look, k);
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  sun.position.set(player.x + 16, 32, player.z + 12);
  sun.target.position.set(player.x, 0, player.z);
}

function frame(dt) {
  clock += dt;

  if (mode === 'play') {
    updatePlayer(dt);
    playSeconds += dt;
    if (playSeconds > BREAK_AFTER_SECONDS && !quest && $('break').hidden && $('result').hidden) {
      $('break').hidden = false;
      sound.speak('Time for a wiggle break!');
    }

    // gates
    if (!quest) {
      let near = false;
      for (const g of world.gates) {
        const d = Math.hypot(player.x - g.zone.x, player.z - g.zone.z);
        if (d < 5.5) near = true;
        if (d < 2.8 && gatesArmed && $('result').hidden) { startQuest(g.zone); break; }
      }
      if (!near) gatesArmed = true;
    }

    // answer bubbles
    if (quest) {
      for (const orb of quest.orbs) {
        if (!orb.alive || !quest.accepting || orb.age < 0.7) continue;
        const p = orb.group.position;
        if (Math.hypot(p.x - player.x, p.z - player.z) < 1.9 && player.y < 2.6) { answer(orb); break; }
      }
      if (quest) {
        quest.orbs = quest.orbs.filter((o) => {
          const keep = updateOrb(o, dt, clock);
          if (!keep) scene.remove(o.group);
          return keep;
        });
      }
    }

    // stars to find
    for (const p of pickups) {
      if (p.respawn > 0) {
        p.respawn -= dt;
        if (p.respawn <= 0) p.mesh.visible = true;
        continue;
      }
      p.mesh.rotation.y += dt * 2;
      p.mesh.position.y = 1.4 + Math.sin(clock * 2.5 + p.x) * 0.25;
      if (Math.hypot(p.x - player.x, p.z - player.z) < 1.7) {
        p.mesh.visible = false; p.respawn = 75;
        burst(p.x, 1.6, p.z, 10, 5);
        sound.sfx.star();
        addStars(1);
      }
    }

    if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) $('hint').textContent = ''; }
    if (marker.visible) marker.scale.setScalar(1 + Math.sin(clock * 8) * 0.12);
  } else {
    // title screen: Bam Bam waves hello
    bam.group.position.set(player.x, 0, player.z);
    bam.group.rotation.y = 0.25 + Math.sin(clock * 0.6) * 0.2;
    if (Math.floor(clock) % 5 === 0) bam.wave(2);
  }

  for (let i = dyingOrbs.length - 1; i >= 0; i--) {
    if (!updateOrb(dyingOrbs[i], dt, clock)) { scene.remove(dyingOrbs[i].group); dyingOrbs.splice(i, 1); }
  }

  for (const s of sparks) {
    if (s.life <= 0) continue;
    s.life -= dt;
    s.vy -= 16 * dt;
    s.mesh.position.x += s.vx * dt; s.mesh.position.y += s.vy * dt; s.mesh.position.z += s.vz * dt;
    s.mesh.rotation.x += dt * 6; s.mesh.rotation.y += dt * 5;
    s.mesh.scale.setScalar(Math.max(0.01, Math.min(1, s.life * 2)));
    if (s.life <= 0 || s.mesh.position.y < 0) { s.life = 0; s.mesh.visible = false; }
  }

  bam.update(dt, { speed: player.speed, airborne: player.y > 0.05 });
  world.update(dt, clock);
  updateCamera(dt);
  renderer.render(scene, camera);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frame(dt);
  requestAnimationFrame(loop);
}

refreshGateSigns();
updateCamera(0, true);
$('loading').hidden = true;
requestAnimationFrame(loop);

// Handy for testing from the browser console.
window.__bambam = { player, get quest() { return quest; }, get save() { return save; }, frame };
