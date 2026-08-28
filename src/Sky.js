import * as THREE from 'three';

/**
 * Gwiazdy i chmury są "nieskończenie daleko" — w przeciwieństwie do
 * elementów na ziemi (relikwie, teren) NIE powinny blaknąć w mgle sceny
 * wraz z odległością. `fog: false` na materiale to standardowa, wbudowana
 * właściwość Three.js wyłączająca wpływ `scene.fog` na dany obiekt.
 */

// Bez tekstury WebGL renderuje punkty jako surowe, kanciaste kwadraty —
// ta tekstura zamienia je w kryształowy romb (dwa złączone trójkąty)
// z miękką poświatą wokół, pasujący do motywu kryształu z logo
let starTextureCache = null;

function getStarTexture() {
  if (starTextureCache) return starTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);

  const cx = 32;
  const cy = 32;

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
  glow.addColorStop(0, 'rgba(244, 236, 216, 0.5)');
  glow.addColorStop(1, 'rgba(244, 236, 216, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);

  ctx.beginPath();
  ctx.moveTo(cx, cy - 26);
  ctx.lineTo(cx + 9, cy);
  ctx.lineTo(cx, cy + 26);
  ctx.lineTo(cx - 9, cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(244, 236, 216, 0.95)';
  ctx.fill();

  starTextureCache = new THREE.CanvasTexture(canvas);
  return starTextureCache;
}

function createStars(count, radius, size, opacity) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.85 + Math.random() * 0.15);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    // Spłaszczone i przesunięte w górę — więcej gwiazd nad głową,
    // żadnych marnowanych pod ziemią, gdzie i tak nigdy ich nie zobaczysz
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 20;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xf4ecd8,
    size,
    map: getStarTexture(),
    transparent: true,
    opacity,
    alphaTest: 0.05,
    depthWrite: false,
    sizeAttenuation: true,
    fog: false,
  });

  return new THREE.Points(geometry, material);
}

// Nieregularny, "chmurny" kształt — kilka nałożonych, losowo przesuniętych
// gradientów radialnych zamiast jednego idealnego koła
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);

  for (let i = 0; i < 5; i++) {
    const cx = 90 + Math.random() * 76;
    const cy = 90 + Math.random() * 76;
    const r = 55 + Math.random() * 50;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(244, 236, 216, 0.9)');
    gradient.addColorStop(1, 'rgba(244, 236, 216, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createClouds(count) {
  const group = new THREE.Group();
  const texture = createCloudTexture();

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 80 + Math.random() * 55;
    const height = 25 + Math.random() * 35;
    const size = 40 + Math.random() * 35;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.12 + Math.random() * 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.5), material);
    plane.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    plane.lookAt(0, height, 0);
    group.add(plane);
  }

  return group;
}

/**
 * createSky
 * ----------
 * Dwie warstwy gwiazd (dla wrażenia głębi) + powoli dryfujące chmury.
 * Zwraca `update(delta)` do wywołania w pętli animacji — odpowiada za
 * subtelne migotanie gwiazd i bardzo wolny obrót chmur wokół sceny.
 */
export function createSky(scene) {
  const starsNear = createStars(500, 140, 1.3, 0.8);
  const starsFar = createStars(700, 175, 0.7, 0.5);
  const cloudGroup = createClouds(10);

  scene.add(starsNear, starsFar, cloudGroup);

  let time = 0;
  const baseOpacityNear = starsNear.material.opacity;
  const baseOpacityFar = starsFar.material.opacity;

  // `nightFactor`: 1 = pełna noc (gwiazdy w pełni widoczne), 0 = pełny
  // "dzień" (gwiazdy prawie niewidoczne). Sterowane z zewnątrz przez
  // DayNightCycle.js — Sky.js samo w sobie nie wie, która jest godzina
  function update(delta, nightFactor = 1) {
    time += delta;
    cloudGroup.rotation.y += delta * 0.006; // bardzo powolny dryf — ledwo zauważalny w pojedynczej sesji
    const twinkle = baseOpacityNear + Math.sin(time * 0.3) * 0.1; // subtelne migotanie
    starsNear.material.opacity = twinkle * nightFactor;
    starsFar.material.opacity = baseOpacityFar * nightFactor;
  }

  return { update };
}
