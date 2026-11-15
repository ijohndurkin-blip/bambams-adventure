import * as THREE from 'three';

// Bam Bam — built from simple shapes to match the Animates character:
// a chunky panda in a white suit with navy trim.

const WHITE = 0xfbf8f1, BLACK = 0x26262b, NAVY = 0x23408f;

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02, ...extra });
}

function ball(r, material, sx = 1, sy = 1, sz = 1, seg = 24) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), material);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

function buildHats() {
  const hats = [];

  // 1: party hat
  const party = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 20), mat(0xE8833A));
  cone.position.y = 0.45;
  const pom = ball(0.13, mat(0xffffff)); pom.position.y = 0.95;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 20), mat(0x2FA8E0));
  band.rotation.x = Math.PI / 2; band.position.y = 0.04;
  party.add(cone, pom, band);
  hats.push(party);

  // 2: explorer hat
  const explorer = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.07, 24), mat(0xC07A4B));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, 0.42, 24), mat(0xC07A4B));
  top.position.y = 0.22;
  const eband = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.12, 24), mat(0x1F9E96));
  eband.position.y = 0.1;
  explorer.add(brim, top, eband);
  hats.push(explorer);

  // 3: crown
  const crown = new THREE.Group();
  const gold = mat(0xFFC93C, { metalness: 0.5, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.3, 24, 1, true), gold);
  ring.material.side = THREE.DoubleSide;
  ring.position.y = 0.15;
  crown.add(ring);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 4), gold);
    spike.position.set(Math.cos(a) * 0.47, 0.44, Math.sin(a) * 0.47);
    const gem = ball(0.06, mat([0xE8833A, 0x2FA8E0, 0xEB5E8A][i % 3], { emissive: 0x331111 }), 1, 1, 1, 8);
    gem.position.set(Math.cos(a) * 0.5, 0.17, Math.sin(a) * 0.5);
    crown.add(spike, gem);
  }
  hats.push(crown);

  // 4: wizard hat
  const wizard = new THREE.Group();
  const wbrim = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 24), mat(0x5B3FA6));
  const wcone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 20), mat(0x5B3FA6));
  wcone.position.y = 0.66;
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), mat(0xFFE066, { emissive: 0x665500 }));
  star.position.set(0, 0.55, 0.36);
  wizard.add(wbrim, wcone, star);
  hats.push(wizard);

  hats.forEach((h) => {
    h.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    h.visible = false;
  });
  return hats;
}

export function createBamBam() {
  const root = new THREE.Group();
  const body = new THREE.Group(); // everything that bobs / squashes
  root.add(body);

  const white = mat(WHITE), black = mat(BLACK), navy = mat(NAVY);

  // ---------- torso ----------
  const torso = ball(1, white, 1.05, 1.1, 0.95, 32);
  torso.position.y = 1.55;
  body.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.12, 10, 28), navy);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 2.38;
  collar.castShadow = true;
  body.add(collar);

  // chest plate + pockets (slightly raised panels)
  const panelMat = mat(0xe6e0d2);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.06), panelMat);
  plate.position.set(0, 2.0, 0.86); plate.rotation.x = -0.38;
  body.add(plate);
  [-1, 1].forEach((s) => {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.06), panelMat);
    pocket.position.set(0.47 * s, 1.5, 0.85);
    pocket.rotation.y = 0.48 * s;
    body.add(pocket);
  });

  // ---------- legs ----------
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group();
    hip.position.set(0.45 * s, 0.95, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.7, 18), white);
    leg.position.y = -0.3; leg.castShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.09, 8, 22), navy);
    ring.rotation.x = Math.PI / 2; ring.position.y = -0.5;
    const boot = ball(0.42, white, 1.0, 0.72, 1.25, 18);
    boot.position.set(0, -0.72, 0.1);
    hip.add(leg, ring, boot);
    body.add(hip);
    return hip;
  });

  // ---------- arms ----------
  const arms = [-1, 1].map((s) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.92 * s, 2.15, 0);
    const pad = ball(0.36, navy, 0.75, 1.0, 1.0, 16);
    pad.position.set(-0.08 * s, 0.02, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.7, 6, 14), white);
    arm.position.set(0.12 * s, -0.5, 0); arm.rotation.z = 0.22 * s; arm.castShadow = true;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.085, 8, 20), navy);
    cuff.position.set(0.22 * s, -0.95, 0); cuff.rotation.set(Math.PI / 2, 0.22 * s, 0);
    const mitt = ball(0.31, black, 1, 1.05, 1, 16);
    mitt.position.set(0.26 * s, -1.2, 0);
    shoulder.add(pad, arm, cuff, mitt);
    body.add(shoulder);
    return shoulder;
  });

  // ---------- head ----------
  const head = new THREE.Group();
  head.position.y = 3.05;
  body.add(head);

  const skull = ball(0.98, white, 1.06, 0.95, 0.95, 32);
  head.add(skull);

  [-1, 1].forEach((s) => {
    const ear = ball(0.33, black, 1, 1, 0.55, 18);
    ear.position.set(0.76 * s, 0.72, -0.05);
    head.add(ear);

    const patch = ball(0.36, black, 0.92, 1.12, 0.4, 20);
    patch.position.set(0.4 * s, 0.1, 0.78);
    patch.rotation.set(0, 0.42 * s, 0.38 * s);
    head.add(patch);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 4, 8), black);
    brow.position.set(0.36 * s, 0.56, 0.8);
    brow.rotation.set(0.3, 0, (Math.PI / 2) - 0.25 * s);
    head.add(brow);
  });

  const eyeWhite = mat(0xffffff, { roughness: 0.25 });
  const iris = mat(0x6a3a1c, { roughness: 0.3 });
  const pupilMat = mat(0x111111, { roughness: 0.2 });
  const glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = [-1, 1].map((s) => {
    const eye = new THREE.Group();
    eye.position.set(0.36 * s, 0.12, 0.86);
    eye.rotation.y = 0.2 * s;
    const w = ball(0.19, eyeWhite, 1, 1, 0.6, 18);
    const i = ball(0.12, iris, 1, 1, 0.5, 14); i.position.z = 0.08;
    const p = ball(0.07, pupilMat, 1, 1, 0.5, 12); p.position.z = 0.12;
    const g = ball(0.035, glint, 1, 1, 0.5, 8); g.position.set(0.05, 0.05, 0.15);
    [w, i, p, g].forEach((m) => { m.castShadow = false; });
    eye.add(w, i, p, g);
    head.add(eye);
    return eye;
  });

  const muzzle = ball(0.44, white, 1.12, 0.82, 0.75, 22);
  muzzle.position.set(0, -0.24, 0.7);
  head.add(muzzle);

  const nose = ball(0.2, black, 1.05, 0.68, 0.7, 16);
  nose.position.set(0, -0.03, 1.02);
  head.add(nose);

  const mouth = ball(0.24, mat(0x7a1f2b), 1.05, 0.72, 0.4, 18);
  mouth.position.set(0, -0.36, 0.95);
  head.add(mouth);
  const tongue = ball(0.15, mat(0xf08a9a), 1.1, 0.5, 0.4, 14);
  tongue.position.set(0, -0.44, 0.99);
  head.add(tongue);

  // ---------- hats ----------
  const hats = buildHats();
  const hatMount = new THREE.Group();
  hatMount.position.set(0, 0.88, 0);
  head.add(hatMount);
  hats.forEach((h) => hatMount.add(h));

  // ---------- animation ----------
  let t = 0, blinkT = 2 + Math.random() * 2, cheerT = 0, walkPhase = 0, waveT = 0;

  function update(dt, { speed = 0, airborne = false } = {}) {
    t += dt;
    const moving = speed > 0.5;
    if (moving) walkPhase += dt * 11; else walkPhase *= 0.85;

    const swing = moving ? Math.sin(walkPhase) * 0.75 : 0;
    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;

    let armL = -swing * 0.9, armR = swing * 0.9, armZL = 0, armZR = 0;

    // idle breathing & bob
    const breathe = Math.sin(t * 2.2) * 0.012;
    body.scale.set(1 - breathe, 1 + breathe, 1 - breathe);
    body.position.y = moving ? Math.abs(Math.sin(walkPhase)) * 0.14 : 0;
    body.rotation.z = moving ? Math.sin(walkPhase) * 0.05 : 0;
    head.rotation.z = Math.sin(t * 1.3) * 0.04;
    head.rotation.x = 0;

    if (airborne) { armZL = -1.9; armZR = 1.9; armL = armR = 0; legs[0].rotation.x = 0.5; legs[1].rotation.x = -0.4; }

    if (cheerT > 0) {
      cheerT -= dt;
      const k = Math.sin(t * 16);
      armZL = -2.4 + k * 0.3; armZR = 2.4 - k * 0.3; armL = armR = 0;
      head.rotation.x = -0.18;
      body.rotation.z = k * 0.07;
    } else if (waveT > 0) {
      waveT -= dt;
      armZR = 2.3 + Math.sin(t * 10) * 0.35; armR = 0;
    }

    arms[0].rotation.x += (armL - arms[0].rotation.x) * Math.min(1, dt * 14);
    arms[1].rotation.x += (armR - arms[1].rotation.x) * Math.min(1, dt * 14);
    arms[0].rotation.z += (armZL - arms[0].rotation.z) * Math.min(1, dt * 12);
    arms[1].rotation.z += (armZR - arms[1].rotation.z) * Math.min(1, dt * 12);

    // blink
    blinkT -= dt;
    const closed = blinkT < 0.12;
    eyes.forEach((e) => { e.scale.y = closed ? 0.12 : 1; });
    if (blinkT < 0) blinkT = 2 + Math.random() * 3;
  }

  function setHat(index) { hats.forEach((h, i) => { h.visible = i === index - 1; }); }
  function cheer(seconds = 1.2) { cheerT = seconds; }
  function wave(seconds = 2.5) { waveT = seconds; }

  return { group: root, update, setHat, cheer, wave, hatCount: hats.length };
}
