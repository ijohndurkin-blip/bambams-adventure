import * as THREE from 'three';
import { mulberry32, makeSignTexture, makeLabelTexture } from './util.js';

export const ISLAND_RADIUS = 56;

export const ZONES = [
  { id: 'math', name: 'Number Meadow', icon: '🔢', subject: 'Numbers', x: 0, z: -34, color: '#E8833A', ground: 0xb7e36a },
  { id: 'letters', name: 'Letter Forest', icon: '🔤', subject: 'Letters', x: 34, z: 0, color: '#1F9E96', ground: 0x4faf5a },
  { id: 'shapes', name: 'Shape Shore', icon: '🔺', subject: 'Shapes', x: 0, z: 34, color: '#2FA8E0', ground: 0xf3dfa2 },
  { id: 'world', name: 'Wonder Cove', icon: '🔍', subject: 'Our World', x: -34, z: 0, color: '#A07AA0', ground: 0xcdb8e0 },
];

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });

function shadow(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return obj;
}

function tree(rand, leafColor = 0x3d9b4a) {
  const g = new THREE.Group();
  const h = 2.2 + rand() * 1.2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, h, 8), std(0x8a5a35));
  trunk.position.y = h / 2;
  g.add(trunk);
  const leaf = std(leafColor);
  [[0, h + 0.9, 0, 1.9], [0.9, h + 0.3, 0.3, 1.3], [-0.8, h + 0.4, -0.4, 1.4], [0.1, h + 1.9, -0.2, 1.2]].forEach(([x, y, z, r]) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf);
    b.position.set(x, y, z);
    g.add(b);
  });
  return shadow(g);
}

function pine(rand) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 8), std(0x7a4e2c));
  trunk.position.y = 0.8;
  g.add(trunk);
  const leaf = std(0x2f7d4f);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.9 - i * 0.45, 2.1, 9), leaf);
    c.position.y = 2.2 + i * 1.25;
    g.add(c);
  }
  g.scale.setScalar(0.9 + rand() * 0.5);
  return shadow(g);
}

function palm(rand) {
  const g = new THREE.Group();
  const trunkMat = std(0xa9793f);
  let y = 0, x = 0;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.85, 8), trunkMat);
    seg.position.set(x, y + 0.42, 0);
    seg.rotation.z = -0.12;
    g.add(seg);
    y += 0.8; x += 0.12;
  }
  const leafMat = std(0x3fae5a, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), leafMat);
    leaf.scale.set(1.5, 0.12, 0.42);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(x + Math.cos(a) * 1.25, y - 0.1, Math.sin(a) * 1.25);
    leaf.rotation.set(0, -a, -0.35);
    g.add(leaf);
  }
  const coco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), std(0x5a3a1c));
  coco.position.set(x + 0.2, y - 0.25, 0.2);
  g.add(coco);
  g.rotation.y = rand() * Math.PI * 2;
  return shadow(g);
}

function flower(rand) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), std(0x3d9b4a));
  stem.position.y = 0.3;
  const colors = [0xff6b8b, 0xffd23f, 0xffffff, 0xff9f43, 0xb388eb, 0x5ec8f2];
  const petal = std(colors[Math.floor(rand() * colors.length)]);
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), petal);
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.16, 0.62, Math.sin(a) * 0.16);
    p.scale.y = 0.5;
    g.add(p);
  }
  const mid = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), std(0xffc93c));
  mid.position.y = 0.64;
  g.add(stem, mid);
  g.scale.setScalar(0.9 + rand() * 0.7);
  return g;
}

function mushroom(rand) {
  const g = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.7, 10), std(0xfff3df));
  stalk.position.y = 0.35;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xe5484d));
  cap.position.y = 0.6;
  g.add(stalk, cap);
  for (let i = 0; i < 5; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), std(0xffffff));
    const a = (i / 5) * Math.PI * 2 + 0.3;
    dot.position.set(Math.cos(a) * 0.4, 0.98, Math.sin(a) * 0.4);
    g.add(dot);
  }
  g.scale.setScalar(0.8 + rand() * 1.2);
  return shadow(g);
}

function rock(rand, color = 0x8f8fa3) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), std(color, { flatShading: true }));
  m.scale.set(0.8 + rand() * 1.2, 0.6 + rand() * 0.9, 0.8 + rand() * 1.2);
  m.position.y = m.scale.y * 0.5;
  m.rotation.y = rand() * 6;
  m.castShadow = true;
  return m;
}

function crystal(rand) {
  const colors = [0x9b5de5, 0x00bbf9, 0xf15bb5, 0x00f5d4];
  const c = colors[Math.floor(rand() * colors.length)];
  const g = new THREE.Group();
  const m = std(c, { emissive: c, emissiveIntensity: 0.35, roughness: 0.2, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const h = 1.2 + rand() * 1.8;
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.35 + rand() * 0.2, h, 5), m);
    s.position.set((rand() - 0.5) * 0.9, h / 2, (rand() - 0.5) * 0.9);
    s.rotation.set((rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5);
    g.add(s);
  }
  return shadow(g);
}

function cloud(rand) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const n = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(2 + rand() * 2, 10, 8), m);
    b.position.set(i * 2.6 - n * 1.3, rand() * 1.2, rand() * 2);
    b.scale.y = 0.65;
    g.add(b);
  }
  return g;
}

function numberBlock(n, color) {
  const tex = makeLabelTexture(String(n), { color: '#ffffff' });
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.8, 1.8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, map: null }),
  );
  const faceMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  [[0, 0, 0.91, 0], [0.91, 0, 0, Math.PI / 2], [-0.91, 0, 0, -Math.PI / 2], [0, 0, -0.91, Math.PI]].forEach(([x, y, z, ry]) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), faceMat);
    f.position.set(x, y, z); f.rotation.y = ry;
    m.add(f);
  });
  m.castShadow = true;
  return m;
}

function house() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 3, 20), std(0xfff3df));
  base.position.y = 1.5;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.6, 20), std(0x23408f));
  roof.position.y = 4.3;
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.2), std(0xE8833A));
  door.position.set(0, 0.95, 2.7);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), std(0xFFC93C));
  knob.position.set(0.35, 0.95, 2.84);
  const win = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16), std(0x9ad8ff, { emissive: 0x335566 }));
  win.rotation.x = Math.PI / 2;
  win.position.set(1.75, 2.0, 2.0); win.rotation.z = -0.7;
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), std(0xffffff));
  flagPole.position.y = 6.2;
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.04), std(0xE8833A));
  flag.position.set(0.48, 6.7, 0);
  g.add(base, roof, door, knob, win, flagPole, flag);
  return shadow(g);
}

export function buildWorld(scene) {
  const rand = mulberry32(20261115);
  const obstacles = [];
  const animated = { clouds: [], gates: [], water: null, crystals: [] };

  // ---------- sea, sand, grass ----------
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(400, 48),
    new THREE.MeshStandardMaterial({ color: 0x2f9de0, roughness: 0.25, metalness: 0.1 }),
  );
  water.rotation.x = -Math.PI / 2; water.position.y = -1.1;
  scene.add(water);
  animated.water = water;

  const sand = new THREE.Mesh(new THREE.CylinderGeometry(66, 72, 3, 64), std(0xf5e2ae));
  sand.position.y = -1.75; sand.receiveShadow = true;
  scene.add(sand);

  const grass = new THREE.Mesh(new THREE.CylinderGeometry(60, 61, 3, 64), std(0x7ed068));
  grass.position.y = -1.5; grass.receiveShadow = true;
  scene.add(grass);

  // lighter grass blobs for variety
  for (let i = 0; i < 40; i++) {
    const a = rand() * Math.PI * 2, r = rand() * 55;
    const blob = new THREE.Mesh(new THREE.CircleGeometry(2 + rand() * 4, 14), std(rand() > 0.5 ? 0x8fdc74 : 0x70c45c));
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(Math.cos(a) * r, 0.005 + i * 0.0002, Math.sin(a) * r);
    blob.receiveShadow = true;
    scene.add(blob);
  }

  // ---------- plaza & paths ----------
  const pathMat = std(0xf1d9a0);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), pathMat);
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.03; plaza.receiveShadow = true;
  scene.add(plaza);
  ZONES.forEach((z) => {
    const len = 24;
    const path = new THREE.Mesh(new THREE.PlaneGeometry(4, len), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = Math.atan2(z.x, z.z);
    path.position.set(z.x * 0.5, 0.025, z.z * 0.5);
    path.receiveShadow = true;
    scene.add(path);
  });

  // Bam Bam's house
  const home = house();
  home.position.set(-11, 0, -11);
  home.rotation.y = Math.PI / 4;
  scene.add(home);
  obstacles.push({ x: -11, z: -11, r: 3.6 });

  // ---------- zones ----------
  ZONES.forEach((z) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(13, 40), std(z.ground));
    patch.rotation.x = -Math.PI / 2; patch.position.set(z.x, 0.04, z.z); patch.receiveShadow = true;
    scene.add(patch);

    const gate = new THREE.Group();
    gate.position.set(z.x, 0, z.z);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.22, 10, 40),
      new THREE.MeshStandardMaterial({ color: z.color, emissive: z.color, emissiveIntensity: 0.6 }),
    );
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.25;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 7, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    );
    beam.position.y = 3.5;
    const sign = makeSignTexture(z.icon, z.name, z.color);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sign.texture, transparent: true, depthWrite: false }));
    sprite.scale.set(9, 4.5, 1);
    sprite.position.y = 8.2;
    gate.add(ring, beam, sprite);
    scene.add(gate);
    animated.gates.push({ zone: z, group: gate, ring, beam, sprite, redraw: sign.redraw });
  });

  const place = (obj, x, z, r = 0) => {
    obj.position.x = x; obj.position.z = z;
    scene.add(obj);
    if (r) obstacles.push({ x, z, r });
    return obj;
  };
  const around = (zone, count, rMin, rMax, make, collide = 0, skipToward = true) => {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 400) {
      const a = rand() * Math.PI * 2, r = rMin + rand() * (rMax - rMin);
      const x = zone.x + Math.cos(a) * r, z = zone.z + Math.sin(a) * r;
      if (Math.hypot(x, z) > ISLAND_RADIUS - 2) continue;
      // keep the path back to the plaza clear
      if (skipToward) {
        const toC = Math.atan2(-zone.z, -zone.x);
        let d = Math.abs(a - toC) % (Math.PI * 2); if (d > Math.PI) d = Math.PI * 2 - d;
        if (d < 0.5) continue;
      }
      // nothing tall between the camera and the answer bubbles
      if (collide && Math.sin(a) > 0.35) continue;
      if (collide && obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + collide + 0.8)) continue;
      place(make(), x, z, collide);
      placed++;
    }
  };
  const [meadow, forest, shore, cove] = ZONES;

  // Number Meadow: flowers and giant number blocks
  around(meadow, 70, 4, 16, () => flower(rand), 0, false);
  const blockColors = [0xE8833A, 0x2FA8E0, 0x1F9E96, 0xEB5E8A, 0x3F5AA6];
  [[-12, -6, 1], [-14.2, -5.4, 2], [-12.8, -5.6, 3, 1.85], [12, -7, 4], [14.1, -6, 5]].forEach(([dx, dz, n, y], i) => {
    const b = numberBlock(n, blockColors[i]);
    b.position.y = y ? y + 0.9 : 0.9;
    b.rotation.y = (rand() - 0.5) * 0.6;
    place(b, meadow.x + dx, meadow.z + dz, y ? 0 : 1.5);
  });
  around(meadow, 4, 14, 18, () => tree(rand, 0x6cc24a), 1.2);

  // Letter Forest: trees, pines, mushrooms
  around(forest, 9, 11.5, 18, () => pine(rand), 1.3);
  around(forest, 7, 11.5, 19, () => tree(rand), 1.3);
  around(forest, 10, 9.5, 17, () => mushroom(rand), 0, false);

  // Shape Shore: palms, beach ball, sandcastle
  around(shore, 7, 11.5, 17, () => palm(rand), 0.9);
  const beachBall = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), std(0xff5d73));
  beachBall.position.y = 1.1; beachBall.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 8, 24), std(0xffffff));
  beachBall.add(stripe);
  place(beachBall, shore.x + 11, shore.z + 4, 1.3);
  const castle = new THREE.Group();
  const sandMat = std(0xe8c97a);
  const keep = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), sandMat); keep.position.y = 0.8;
  castle.add(keep);
  [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([x, z]) => {
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 2.3, 10), sandMat); tw.position.set(x, 1.15, z);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 10), std(0xE8833A)); top.position.set(x, 2.7, z);
    castle.add(tw, top);
  });
  shadow(castle);
  place(castle, shore.x - 11, shore.z + 5, 2.4);

  // Wonder Cove: rocks and glowing crystals
  around(cove, 9, 11.5, 18, () => rock(rand, 0x8d86a8), 1.6);
  around(cove, 8, 10.5, 17, () => { const c = crystal(rand); animated.crystals.push(c); return c; }, 0.9);

  // Scatter between zones
  const anywhere = { x: 0, z: 0 };
  const farFromZones = (make, count, collide) => {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 600) {
      const a = rand() * Math.PI * 2, r = 12 + rand() * 42;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (ZONES.some((zn) => Math.hypot(zn.x - x, zn.z - z) < 19)) continue;
      if (Math.abs(x) < 4 || Math.abs(z) < 4) continue; // paths
      if (collide && obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + collide + 1)) continue;
      place(make(), x, z, collide);
      placed++;
    }
  };
  farFromZones(() => tree(rand, [0x3d9b4a, 0x58b368, 0x6cc24a][Math.floor(rand() * 3)]), 16, 1.3);
  farFromZones(() => rock(rand), 8, 1.4);
  farFromZones(() => flower(rand), 60, 0);
  void anywhere;

  // clouds
  for (let i = 0; i < 9; i++) {
    const c = cloud(rand);
    c.position.set((rand() - 0.5) * 240, 32 + rand() * 18, -40 - rand() * 120);
    c.userData.speed = 0.6 + rand() * 1.2;
    scene.add(c);
    animated.clouds.push(c);
  }

  function update(dt, t) {
    animated.clouds.forEach((c) => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 140) c.position.x = -140;
    });
    animated.gates.forEach((g, i) => {
      g.ring.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.05);
      g.sprite.position.y = 8.2 + Math.sin(t * 1.6 + i) * 0.35;
      g.beam.material.opacity = 0.13 + Math.sin(t * 2 + i) * 0.05;
    });
    animated.water.position.y = -1.1 + Math.sin(t * 0.8) * 0.12;
    animated.crystals.forEach((c, i) => {
      c.children.forEach((m) => { m.material.emissiveIntensity = 0.3 + Math.sin(t * 2 + i) * 0.2; });
    });
  }

  return { obstacles, gates: animated.gates, update };
}
