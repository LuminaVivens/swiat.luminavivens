import * as THREE from 'three';
import { createGLTFLoader } from './DracoGLTFLoader.js';

const STORAGE_KEY = 'luminaVivens.collectedPieces';

const WORLD_STYLES = {
  fizyczny: {
    geometry: () => new THREE.DodecahedronGeometry(0.4, 0),
    color: 0xd97b4f,
    emissiveIntensity: 0.25,
    wireframe: false,
    heightOffset: 0,
    pulseSpeed: 0,
  },
  energetyczny: {
    geometry: () => new THREE.OctahedronGeometry(0.42, 0),
    color: 0x7fb8ff,
    emissiveIntensity: 0.8,
    wireframe: true,
    heightOffset: 1.1,
    pulseSpeed: 2.2,
  },
  pustka: {
    geometry: () => new THREE.BoxGeometry(0.22, 0.22, 0.22),
    color: 0x0a0a0a,
    emissiveColor: 0x3355ff,
    emissiveIntensity: 0.9,
    wireframe: false,
    heightOffset: 0,
    pulseSpeed: 0.6,
  },
  duchowy: {
    geometry: () => new THREE.ConeGeometry(0.26, 0.95, 6),
    color: 0xffe9b8,
    emissiveIntensity: 1.0,
    wireframe: false,
    heightOffset: 1.8,
    pulseSpeed: 1.4,
  },
};

function getStyle(world) {
  return WORLD_STYLES[world] ?? WORLD_STYLES.fizyczny;
}

// Aury na ziemi — jedna tekstura na kolor świata, reużywana dla
// wszystkich skupisk tego samego świata (nie ma sensu generować
// tego samego gradientu wielokrotnie)
const auraTextureCache = new Map();

function getAuraTexture(colorHex) {
  if (auraTextureCache.has(colorHex)) return auraTextureCache.get(colorHex);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(colorHex);
  const rgb = `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, `rgba(${rgb}, 0.5)`);
  gradient.addColorStop(0.55, `rgba(${rgb}, 0.16)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  auraTextureCache.set(colorHex, texture);
  return texture;
}

export class PuzzleManager {
  constructor(scene, { onCollect = () => {}, onLayerComplete = () => {} } = {}) {
    this.scene = scene;
    this.onCollect = onCollect;
    this.onLayerComplete = onLayerComplete;

    this.loader = createGLTFLoader();
    this._tmpDist = new THREE.Vector3();

    this._allPieces = [];
    this.activePieces = [];
    this.currentLayer = null;
  }

  async loadManifest(url = '/manifest.json') {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[PuzzleManager] Nie udało się wczytać ${url} (status ${response.status})`);
      return;
    }
    const manifest = await response.json();
    this._allPieces = manifest.pieces ?? [];
    this._spawnWorldAuras();
    this._spawnNextAvailableLayer();
  }

  // Delikatna, kolorowa poświata na ziemi w miejscu każdego skupiska —
  // widoczna z daleka, zanim jeszcze dostrzeżesz sam element. Zostaje
  // na stałe, niezależnie od tego czy element już zebrano — to ślad
  // danego świata w krajobrazie, nie wskaźnik postępu.
  _spawnWorldAuras() {
    for (const piece of this._allPieces) {
      const style = getStyle(piece.world);
      const auraColor = style.emissiveColor ?? style.color;
      const [x, , z] = piece.position;

      const aura = new THREE.Mesh(
        new THREE.CircleGeometry(4.5, 32),
        new THREE.MeshBasicMaterial({
          map: getAuraTexture(auraColor),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      aura.rotation.x = -Math.PI / 2;
      aura.position.set(x, 0.015, z);
      this.scene.add(aura);
    }
  }

  _remainingLayers() {
    const collectedIds = this._getCollectedIds();
    const layers = this._allPieces
      .filter((p) => !collectedIds.has(p.id))
      .map((p) => p.layer ?? 1);
    return [...new Set(layers)].sort((a, b) => a - b);
  }

  _spawnNextAvailableLayer() {
    const layers = this._remainingLayers();
    if (layers.length === 0) {
      this.currentLayer = null;
      return;
    }

    this.currentLayer = layers[0];
    const collectedIds = this._getCollectedIds();

    this.activePieces = [];
    for (const piece of this._allPieces) {
      const layer = piece.layer ?? 1;
      if (layer !== this.currentLayer) continue;
      if (collectedIds.has(piece.id)) continue;
      this._spawnPiece(piece);
    }
  }

  _spawnPiece(piece) {
    const style = getStyle(piece.world);
    const [x, y, z] = piece.position;

    const mesh = this._createMesh(piece.world, piece.color);
    mesh.position.set(x, y + style.heightOffset, z);
    this.scene.add(mesh);

    const entry = {
      id: piece.id,
      name: piece.name ?? piece.id,
      world: piece.world,
      mesh,
      radius: piece.pickupRadius ?? 1.3,
      collected: false,
      pulseSpeed: style.pulseSpeed,
      materials: this._collectMaterials(mesh),
    };
    this.activePieces.push(entry);

    if (piece.glbUrl) {
      this.loader.load(
        piece.glbUrl,
        (gltf) => {
          if (entry.collected) return;
          const model = gltf.scene;
          model.position.copy(mesh.position);

          if (piece.scale) model.scale.setScalar(piece.scale);
          if (piece.rotationY) model.rotation.y = piece.rotationY;

          this.scene.remove(mesh);
          this.scene.add(model);
          entry.mesh = model;
          entry.materials = this._collectMaterials(model);
        },
        undefined,
        (error) => console.warn(`[PuzzleManager] Nie udało się wczytać modelu ${piece.glbUrl}`, error)
      );
    }
  }

  _collectMaterials(object) {
    const materials = [];
    object.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (typeof mat.emissiveIntensity === 'number') {
          mat.userData._baseEmissiveIntensity = mat.emissiveIntensity;
          materials.push(mat);
        }
      }
    });
    return materials;
  }

  _createMesh(world, overrideColor) {
    const style = getStyle(world);
    const geometry = style.geometry();
    const material = new THREE.MeshStandardMaterial({
      color: overrideColor ?? style.color,
      emissive: style.emissiveColor ?? overrideColor ?? style.color,
      emissiveIntensity: style.emissiveIntensity,
      wireframe: style.wireframe,
      flatShading: !style.wireframe,
      roughness: 0.5,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = !style.wireframe;
    return mesh;
  }

  update(avatarPosition, delta) {
    const t = performance.now() * 0.001;

    for (const entry of this.activePieces) {
      if (entry.collected) continue;

      entry.mesh.rotation.y += delta * 0.8;

      if (entry.pulseSpeed > 0 && entry.materials?.length) {
        const pulse = 0.5 + 0.5 * Math.sin(t * entry.pulseSpeed);
        const factor = 0.6 + pulse * 0.6;
        for (const mat of entry.materials) {
          mat.emissiveIntensity = mat.userData._baseEmissiveIntensity * factor;
        }
      }

      this._tmpDist.copy(entry.mesh.position).sub(avatarPosition);
      this._tmpDist.y = 0;

      if (this._tmpDist.length() <= entry.radius) {
        this._collect(entry);
      }
    }
  }

  /**
   * collectNear
   * -----------
   * Zbiera element, jeśli jakikolwiek aktywny puzzel znajduje się w
   * promieniu `radius` od podanego punktu — używane przez chwytanie VR
   * (pozycja dłoni), w odróżnieniu od `update()`, który sprawdza odległość
   * od avatara po płaskiej podłodze (X/Z). Tu liczy się prawdziwa
   * odległość 3D, bo dłoń może sięgać w górę do elementów uniesionych
   * nad ziemią (np. świat "duchowy" z heightOffset).
   *
   * Zwraca true jeśli coś zebrano — wywołujący (GrabController) używa
   * tego, żeby jedno przytrzymanie grip nie "zmiotło" kilku elementów
   * leżących blisko siebie naraz.
   */
  collectNear(point, radius = 0.35) {
    for (const entry of this.activePieces) {
      if (entry.collected) continue;
      if (entry.mesh.position.distanceTo(point) <= radius) {
        this._collect(entry);
        return true;
      }
    }
    return false;
  }

  _collect(entry) {
    entry.collected = true;
    this.scene.remove(entry.mesh);
    this._markCollected(entry.id);
    this.onCollect(entry);

    const layerFinished = this.activePieces.every((p) => p.collected);
    if (layerFinished) {
      const finishedLayer = this.currentLayer;
      this.onLayerComplete(finishedLayer);
      setTimeout(() => this._spawnNextAvailableLayer(), 900);
    }
  }

  _getCollectedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  _markCollected(id) {
    const ids = this._getCollectedIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }

  get remainingCount() {
    return this.activePieces.filter((p) => !p.collected).length;
  }
}
