// Jednorazowy skrypt generujący 4 przykładowe "relikwie" (po jednej na
// świat) jako prawdziwe pliki .glb — czysto proceduralnie, z prostych
// brył Three.js, żeby mieć konkretny, działający przykład całego
// łańcucha: model -> public/models/ -> manifest.json -> scena.
//
// Uruchomienie: node scripts/export-relics.mjs
// (wymaga `npm install` w projekcie — korzysta z tego samego `three`,
// które już jest zależnością)

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { writeFile, mkdir } from 'fs/promises';

// GLTFExporter w trybie binarnym (.glb) korzysta z przeglądarkowego
// FileReader do scalenia buforów — Node.js go nie ma, więc podstawiamy
// minimalny polyfill oparty o Blob.arrayBuffer() (dostępne w Node 18+)
class NodeFileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
globalThis.FileReader = NodeFileReaderPolyfill;

const OUT_DIR = new URL('../public/models/', import.meta.url);
await mkdir(OUT_DIR, { recursive: true });

const exporter = new GLTFExporter();

function exportGroup(group, filename) {
  return new Promise((resolve, reject) => {
    exporter.parse(
      group,
      async (result) => {
        const buffer = Buffer.from(result);
        await writeFile(new URL(filename, OUT_DIR), buffer);
        console.log(`Zapisano: public/models/${filename} (${buffer.byteLength} bajtów)`);
        resolve();
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

// ---------------------------------------------------------------------
// Świat fizyczny — klaster krystaliczny, gęsty, blisko ziemi
// ---------------------------------------------------------------------
function buildFizyczny() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xd97b4f,
    emissive: 0xd97b4f,
    emissiveIntensity: 0.2,
    flatShading: true,
    roughness: 0.6,
    metalness: 0.15,
  });

  const mainCrystal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), material);
  mainCrystal.position.y = 0.35;
  group.add(mainCrystal);

  const positions = [
    [0.28, 0.18, 0.1, 0.6],
    [-0.25, 0.22, -0.15, 0.5],
    [0.05, 0.15, 0.3, 0.45],
  ];
  for (const [x, y, z, scale] of positions) {
    const shard = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), material);
    shard.position.set(x, y, z);
    shard.scale.setScalar(scale);
    shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    group.add(shard);
  }

  return group;
}

// ---------------------------------------------------------------------
// Świat energetyczny — struktura sieciowa, pierścienie orbitujące wokół
// jasnego rdzenia
// ---------------------------------------------------------------------
function buildEnergetyczny() {
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x7fb8ff,
    emissive: 0x7fb8ff,
    emissiveIntensity: 0.8,
    wireframe: true,
  });
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfe0ff,
    emissive: 0xbfe0ff,
    emissiveIntensity: 1.2,
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), coreMaterial);
  group.add(core);

  const ringAngles = [0, Math.PI / 3, (Math.PI * 2) / 3];
  for (const angle of ringAngles) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 6, 24), ringMaterial);
    ring.rotation.x = angle;
    ring.rotation.y = angle * 0.6;
    group.add(ring);
  }

  return group;
}

// ---------------------------------------------------------------------
// Świat pustki — klatka/sześcian, niemal ciemny, z ledwo dostrzegalną
// iskrą w środku
// ---------------------------------------------------------------------
function buildPustka() {
  const group = new THREE.Group();

  const cageMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    emissive: 0x111111,
    emissiveIntensity: 0.3,
    wireframe: true,
  });
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), cageMaterial);
  group.add(cage);

  const sparkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3355ff,
    emissive: 0x3355ff,
    emissiveIntensity: 1.5,
  });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), sparkMaterial);
  group.add(spark);

  return group;
}

// ---------------------------------------------------------------------
// Świat duchowy — promienisty rdzeń z iglicami skierowanymi na zewnątrz
// ---------------------------------------------------------------------
function buildDuchowy() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffe9b8,
    emissive: 0xffe9b8,
    emissiveIntensity: 1.0,
    roughness: 0.2,
    metalness: 0.05,
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), material);
  group.add(core);

  const spikeCount = 8;
  for (let i = 0; i < spikeCount; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 6), material);
    const phi = Math.acos(1 - (2 * (i + 0.5)) / spikeCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );

    spike.position.copy(dir).multiplyScalar(0.32);
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(spike);
  }

  return group;
}

await exportGroup(buildFizyczny(), 'relikwia-fizyczny.glb');
await exportGroup(buildEnergetyczny(), 'relikwia-energetyczny.glb');
await exportGroup(buildPustka(), 'relikwia-pustka.glb');
await exportGroup(buildDuchowy(), 'relikwia-duchowy.glb');

console.log('Gotowe — 4 modele w public/models/');
