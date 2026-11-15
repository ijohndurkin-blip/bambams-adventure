import * as THREE from 'three';
import { makeLabelTexture } from './util.js';

// Answer bubbles: a see-through bubble holding either a word/number/emoji or a real 3D shape.

function polygon(n, r, rot = 0) {
  const s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function flatShape(name) {
  switch (name) {
    case 'circle': { const s = new THREE.Shape(); s.absarc(0, 0, 0.8, 0, Math.PI * 2); return s; }
    case 'square': return polygon(4, 1.0, Math.PI / 4);
    case 'triangle': return polygon(3, 0.95, Math.PI / 2);
    case 'pentagon': return polygon(5, 0.88, Math.PI / 2);
    case 'hexagon': return polygon(6, 0.88, 0);
    case 'octagon': return polygon(8, 0.88, Math.PI / 8);
    case 'rectangle': {
      const s = new THREE.Shape();
      s.moveTo(-0.95, -0.5); s.lineTo(0.95, -0.5); s.lineTo(0.95, 0.5); s.lineTo(-0.95, 0.5); s.closePath();
      return s;
    }
    case 'star': {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
        const r = i % 2 === 0 ? 0.95 : 0.42;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
      s.closePath();
      return s;
    }
    case 'heart': {
      const s = new THREE.Shape();
      s.moveTo(0, -0.8);
      s.bezierCurveTo(-1.5, 0.1, -0.75, 1.15, 0, 0.42);
      s.bezierCurveTo(0.75, 1.15, 1.5, 0.1, 0, -0.8);
      return s;
    }
    default: return null;
  }
}

export function makeShapeMesh(name, color) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
  let geo, spins = true;
  switch (name) {
    case 'cube': geo = new THREE.BoxGeometry(1.15, 1.15, 1.15); break;
    case 'sphere': geo = new THREE.SphereGeometry(0.78, 24, 18); break;
    case 'cone': geo = new THREE.ConeGeometry(0.7, 1.4, 28); break;
    case 'cylinder': geo = new THREE.CylinderGeometry(0.6, 0.6, 1.3, 28); break;
    case 'pyramid': geo = new THREE.ConeGeometry(0.9, 1.25, 4); break;
    default: {
      geo = new THREE.ExtrudeGeometry(flatShape(name), { depth: 0.28, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 20 });
      geo.center();
      spins = false;
    }
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.userData.spins = spins;
  mesh.scale.setScalar(1.2);
  if (name === 'cube' || name === 'pyramid') mesh.rotation.x = 0.25;
  return mesh;
}

const bubbleGeo = new THREE.SphereGeometry(1.55, 28, 20);
const rimGeo = new THREE.TorusGeometry(1.6, 0.1, 8, 36);
const shadowGeo = new THREE.CircleGeometry(1.1, 20);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false });

export function makeOrb(option, tint) {
  const group = new THREE.Group();
  const float = new THREE.Group();
  float.position.y = 2.1;
  group.add(float);

  const bubble = new THREE.Mesh(bubbleGeo, new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false,
    emissive: 0xffffff, emissiveIntensity: 0.35,
  }));
  float.add(bubble);
  const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.5 }));
  rim.rotation.x = Math.PI / 2;
  float.add(rim);

  let content;
  if (option.shape) {
    content = makeShapeMesh(option.shape, option.color);
  } else {
    const tex = makeLabelTexture(option.label);
    content = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    content.scale.set(2.6, 2.6, 1);
    content.renderOrder = 2;
  }
  float.add(content);

  const blob = new THREE.Mesh(shadowGeo, shadowMat);
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.06;
  group.add(blob);

  return { group, float, content, bubble, option, age: 0, dying: -1, alive: true, phase: Math.random() * 6 };
}

export function updateOrb(orb, dt, t) {
  orb.age += dt;
  let s = Math.min(1, orb.age / 0.45);
  s = 1 - Math.pow(1 - s, 3);
  if (orb.dying >= 0) {
    orb.dying += dt;
    s = Math.max(0, 1 - orb.dying / 0.25);
  }
  orb.float.scale.setScalar(Math.max(0.001, s));
  orb.float.position.y = 2.1 + Math.sin(t * 2 + orb.phase) * 0.22;
  if (orb.content.isMesh) {
    if (orb.content.userData.spins) orb.content.rotation.y += dt * 1.2;
    else orb.content.rotation.y = Math.sin(t * 1.5 + orb.phase) * 0.45;
  }
  return !(orb.dying >= 0.25);
}

export function makeStarMesh() {
  const geo = new THREE.ExtrudeGeometry(flatShape('star'), { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  geo.center();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffa800, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.3 }));
  m.scale.setScalar(0.75);
  m.castShadow = true;
  return m;
}
