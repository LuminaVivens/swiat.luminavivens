import * as THREE from 'three';

// Proste, proceduralne pasy na kuli — canvas-generowany gradient, bez
// żadnych zewnętrznych obrazków (ten sam duch co scripts/export-relics.mjs,
// zero wątpliwości co do praw autorskich)
function createBandedTexture(baseColorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const base = new THREE.Color(baseColorHex);
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const shade = base.clone().multiplyScalar(0.6 + Math.random() * 0.55);
    ctx.fillStyle = `rgb(${Math.round(shade.r * 255)}, ${Math.round(shade.g * 255)}, ${Math.round(shade.b * 255)})`;
    ctx.fillRect(0, (i / bands) * canvas.height, canvas.width, canvas.height / bands + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Gradient przezroczystości od środka do krawędzi pierścienia — bez tego
// wyglądałby jak twardy, płaski dysk zamiast delikatnej wstęgi pyłu
function createRingAlphaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.15, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(0.85, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 4);
  return new THREE.CanvasTexture(canvas);
}

/**
 * createPlanet
 * ------------
 * Planeta widoczna na niebie — ponieważ to zwykły obiekt sceny (nie
 * jakaś specjalna warstwa), automatycznie odbija się też w MirrorFloor,
 * bez żadnego dodatkowego podpinania. Styl "saturnowy": kula z pasami
 * + przechylony pierścień pyłu.
 *
 * `position` i `colorHex` przychodzą z journeys.json — każda "podróż"
 * dostaje swoją planetę, w swoim miejscu na niebie, w swoim kolorze.
 */
export function createPlanet(position = [50, 34, -70], colorHex = 0xd4af37) {
  const group = new THREE.Group();
  group.position.set(...position);

  const bodyGeometry = new THREE.SphereGeometry(6, 48, 48);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: createBandedTexture(colorHex),
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.35,
    roughness: 0.7,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  const ringGeometry = new THREE.RingGeometry(8.5, 13, 96);
  // RingGeometry ma domyślne UV nieprzystosowane do promienistego gradientu —
  // przemapowujemy je tak, żeby U szło od wewnętrznej do zewnętrznej krawędzi
  const uv = ringGeometry.attributes.uv;
  const pos = ringGeometry.attributes.position;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radius = v3.length();
    uv.setXY(i, (radius - 8.5) / (13 - 8.5), 0.5);
  }

  const ringMaterial = new THREE.MeshBasicMaterial({
    map: createRingAlphaTexture(),
    color: colorHex,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.8,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2.4; // przechył jak u Saturna, nie płasko na wprost kamery
  ring.rotation.z = 0.3;
  group.add(ring);

  let t = 0;
  return {
    group,
    update(delta) {
      t += delta;
      body.rotation.y += delta * 0.05;
      ring.rotation.z = 0.3 + Math.sin(t * 0.02) * 0.02; // ledwie zauważalne "oddychanie"
    },
  };
}
