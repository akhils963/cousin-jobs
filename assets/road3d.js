// 3D traffic scene drawn behind Arjun's page. Exposes window.boostCar() for the apply celebration.
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("road3d");
const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  canvas.remove();
  throw e;
}
document.body.classList.add("has-3d");
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const sky = dark ? 0x0d1117 : 0xdfe8f1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(sky);
scene.fog = new THREE.Fog(sky, 30, 85);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

scene.add(new THREE.HemisphereLight(dark ? 0x6b7a99 : 0xffffff, dark ? 0x1a1a1a : 0x8a8f7a, dark ? 1.1 : 1.1));
const sun = new THREE.DirectionalLight(dark ? 0x9fb4ff : 0xfff3e0, dark ? 1.4 : 2.2);
sun.position.set(-12, 22, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 20, bottom: -20, near: 1, far: 70 });
scene.add(sun);

// Ground, road and lane markings
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 120),
  new THREE.MeshStandardMaterial({ color: dark ? 0x1b2a1f : 0x7fa86a, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 15),
  new THREE.MeshStandardMaterial({ color: dark ? 0x22252b : 0x3b3f46, roughness: 0.9 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;
road.receiveShadow = true;
scene.add(road);

const paint = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
const yellow = new THREE.MeshBasicMaterial({ color: 0xffc928 });
for (const z of [-7.2, 7.2]) {
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(240, 0.25), paint);
  edge.rotation.x = -Math.PI / 2;
  edge.position.set(0, 0.02, z);
  scene.add(edge);
}
const centre = new THREE.Mesh(new THREE.PlaneGeometry(240, 0.3), yellow);
centre.rotation.x = -Math.PI / 2;
centre.position.set(0, 0.02, 0);
scene.add(centre);
const dashes = new THREE.Group();
for (const z of [-3.6, 3.6]) {
  for (let x = -120; x < 120; x += 6) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.2), paint);
    d.rotation.x = -Math.PI / 2;
    d.position.set(x, 0.02, z);
    dashes.add(d);
  }
}
scene.add(dashes);

// Roadside trees and distant buildings
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f });
const leafMats = [0x2f7d32, 0x3e8e41, 0x4caf50].map((c) => new THREE.MeshStandardMaterial({ color: dark ? 0x1f4d26 : c, roughness: 0.8 }));
function tree(x, z) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.4), trunkMat);
  trunk.position.y = 0.7;
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 8), leafMats[Math.floor(Math.random() * 3)]);
  leaves.position.y = 2.6;
  for (const m of [trunk, leaves]) { m.castShadow = true; t.add(m); }
  t.position.set(x, 0, z);
  t.scale.setScalar(0.8 + Math.random() * 0.6);
  scene.add(t);
}
for (let x = -70; x < 70; x += 7 + Math.random() * 5) {
  tree(x, -10 - Math.random() * 4);
  if (Math.random() > 0.4) tree(x + 3, 11 + Math.random() * 6);
}
const buildingMat = new THREE.MeshStandardMaterial({ color: dark ? 0x2a3140 : 0xb8c4d2, roughness: 0.7 });
const windowMat = new THREE.MeshBasicMaterial({ color: dark ? 0xffd27a : 0xe9f1fa });
for (let x = -90; x < 90; x += 9 + Math.random() * 6) {
  const h = 6 + Math.random() * 16;
  const b = new THREE.Mesh(new THREE.BoxGeometry(6, h, 6), buildingMat);
  b.position.set(x, h / 2, -30 - Math.random() * 12);
  scene.add(b);
  for (let y = 2; y < h - 1; y += 2.2) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.7), windowMat);
    w.position.set(b.position.x, y, b.position.z + 3.01);
    scene.add(w);
  }
}

// Cars: extruded side profile with glass, lights and spinning wheels
const profile = new THREE.Shape();
profile.moveTo(-2.3, 0.35);
profile.lineTo(-2.3, 0.85);
profile.quadraticCurveTo(-2.25, 1.05, -1.6, 1.1);
profile.lineTo(-1.0, 1.15);
profile.quadraticCurveTo(-0.55, 1.75, 0.15, 1.78);
profile.lineTo(0.75, 1.78);
profile.quadraticCurveTo(1.3, 1.72, 1.65, 1.2);
profile.lineTo(2.15, 1.05);
profile.quadraticCurveTo(2.4, 0.95, 2.4, 0.7);
profile.lineTo(2.4, 0.35);
profile.closePath();
const bodyGeo = new THREE.ExtrudeGeometry(profile, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3, curveSegments: 10 });
bodyGeo.translate(0, 0, -0.85);

const glassShape = new THREE.Shape();
glassShape.moveTo(-0.85, 1.18);
glassShape.quadraticCurveTo(-0.45, 1.66, 0.15, 1.68);
glassShape.lineTo(0.72, 1.68);
glassShape.quadraticCurveTo(1.18, 1.62, 1.5, 1.2);
glassShape.closePath();
const glassGeo = new THREE.ExtrudeGeometry(glassShape, { depth: 1.86, bevelEnabled: false });
glassGeo.translate(0, 0, -0.93);
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c2733, metalness: 0.9, roughness: 0.1 });

const tyreGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 20);
tyreGeo.rotateX(Math.PI / 2);
const tyreMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 6);
rimGeo.rotateX(Math.PI / 2);
const rimMat = new THREE.MeshStandardMaterial({ color: 0xd0d4da, metalness: 0.9, roughness: 0.25 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c2, emissiveIntensity: dark ? 2 : 0.6 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0x990000, emissive: 0xff2020, emissiveIntensity: dark ? 1.6 : 0.5 });
const lightGeo = new THREE.BoxGeometry(0.08, 0.16, 0.38);

const colours = [0xe53935, 0x1e88e5, 0xfdd835, 0xffffff, 0x212121, 0x43a047, 0xfb8c00, 0x8e24aa, 0x90a4ae];

function makeCar(colour) {
  const car = new THREE.Group();
  const paintMat = new THREE.MeshPhysicalMaterial({ color: colour, metalness: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.castShadow = true;
  car.add(body, new THREE.Mesh(glassGeo, glassMat));
  car.wheels = [];
  for (const x of [-1.45, 1.5]) {
    for (const z of [-0.88, 0.88]) {
      const w = new THREE.Group();
      w.add(new THREE.Mesh(tyreGeo, tyreMat), new THREE.Mesh(rimGeo, rimMat));
      w.position.set(x, 0.42, z);
      w.children[0].castShadow = true;
      car.add(w);
      car.wheels.push(w);
    }
  }
  for (const z of [-0.6, 0.6]) {
    const h = new THREE.Mesh(lightGeo, headMat);
    h.position.set(2.5, 0.78, z);
    const t = new THREE.Mesh(lightGeo, tailMat);
    t.position.set(-2.4, 0.85, z);
    car.add(h, t);
  }
  scene.add(car);
  return car;
}

const lanes = [
  { z: 5.4, dir: 1 }, { z: 1.8, dir: 1 },
  { z: -1.8, dir: -1 }, { z: -5.4, dir: -1 },
];
const cars = [];
function spawn(lane, x, speed, colour) {
  const car = makeCar(colour ?? colours[Math.floor(Math.random() * colours.length)]);
  car.lane = lane;
  car.speed = speed;
  car.position.set(x, 0, lane.z);
  car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
  cars.push(car);
  return car;
}
lanes.forEach((lane, i) => {
  for (let k = 0; k < 3; k++) spawn(lane, -60 + k * 42 + Math.random() * 20, 7 + i * 1.5 + Math.random() * 3);
});

window.boostCar = function () {
  const lane = lanes[0];
  const car = spawn(lane, -55, 55, 0xff1744);
  car.boost = true;
  car.scale.setScalar(1.15);
};

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const portrait = h > w;
  camera.fov = portrait ? 55 : 38;
  camera.position.set(0, portrait ? 13 : 11, portrait ? 30 : 24);
  camera.lookAt(0, 0, -2);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
let running = !still;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    c.position.x += c.lane.dir * c.speed * dt;
    for (const w of c.wheels) w.children.forEach((m) => (m.rotation.z -= (c.speed * dt) / 0.42));
    if (Math.abs(c.position.x) > 65) {
      if (c.boost) {
        scene.remove(c);
        cars.splice(i, 1);
        continue;
      }
      c.position.x = -c.lane.dir * 65;
    }
  }
  renderer.render(scene, camera);
  if (running) requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", () => {
  const wasRunning = running;
  running = !document.hidden && !still;
  if (running && !wasRunning) { clock.getDelta(); requestAnimationFrame(frame); }
});
frame();
