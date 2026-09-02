import * as THREE from 'three';

export const WORLD_LAYERS = Object.freeze({
  PHYSICAL: 'physical',
  ENERGETIC: 'energetic',
  VOID: 'void',
  SPIRITUAL: 'spiritual',
  DARK_SPIRITUAL: 'dark_spiritual',
});

export const WORLD_LAYER_ORDER = Object.freeze([
  WORLD_LAYERS.PHYSICAL,
  WORLD_LAYERS.ENERGETIC,
  WORLD_LAYERS.VOID,
  WORLD_LAYERS.SPIRITUAL,
  WORLD_LAYERS.DARK_SPIRITUAL,
]);

const DEFAULT_LAYER_META = Object.freeze({
  [WORLD_LAYERS.PHYSICAL]: { label: 'Fizyczna', symbol: '◉' },
  [WORLD_LAYERS.ENERGETIC]: { label: 'Energetyczna', symbol: '✦' },
  [WORLD_LAYERS.VOID]: { label: 'Pustka', symbol: '○' },
  [WORLD_LAYERS.SPIRITUAL]: { label: 'Duchowa', symbol: '◇' },
  [WORLD_LAYERS.DARK_SPIRITUAL]: { label: 'Ciemność Duchowa', symbol: '☾' },
});

/**
 * WorldManager
 * ------------
 * Zarządza warstwami jednej rzeczywistości. Warstwa nie jest osobną mapą:
 * pozycja gracza, kamera i stan sesji pozostają bez zmian. Zmienia się tylko
 * zestaw obiektów przypisanych do danej warstwy.
 *
 * Na etapie 02 grupy warstw są puste. Obecna zawartość sceny pozostaje
 * wspólna, dzięki czemu wdrożenie nie zmienia wyglądu istniejącego świata.
 * Kolejne elementy będziemy przenosić do grup stopniowo.
 */
export class WorldManager {
  constructor(scene, { initialLayer = WORLD_LAYERS.PHYSICAL, onChange = null } = {}) {
    if (!(scene instanceof THREE.Scene)) {
      throw new Error('[WorldManager] Wymagana jest instancja THREE.Scene.');
    }

    this.scene = scene;
    this.currentLayer = initialLayer;
    this.onChange = onChange;
    this.listeners = new Set();
    this.groups = new Map();

    for (const layerId of WORLD_LAYER_ORDER) {
      const group = new THREE.Group();
      group.name = `LuminaLayer:${layerId}`;
      group.userData.luminaLayer = layerId;
      group.visible = layerId === initialLayer;
      scene.add(group);
      this.groups.set(layerId, group);
    }
  }

  hasLayer(layerId) {
    return this.groups.has(layerId);
  }

  getLayerGroup(layerId) {
    const group = this.groups.get(layerId);
    if (!group) throw new Error(`[WorldManager] Nieznana warstwa: ${layerId}`);
    return group;
  }

  getCurrentLayer() {
    return this.currentLayer;
  }

  getCurrentMeta() {
    return DEFAULT_LAYER_META[this.currentLayer];
  }

  /** Dodaje obiekt tylko do wskazanej warstwy. */
  addToLayer(layerId, object3D) {
    this.getLayerGroup(layerId).add(object3D);
    return object3D;
  }

  /**
   * Przenosi istniejący obiekt sceny do konkretnej warstwy bez zmiany jego
   * transformacji w świecie.
   */
  moveToLayer(layerId, object3D) {
    if (!object3D) return null;
    object3D.updateMatrixWorld(true);
    this.getLayerGroup(layerId).attach(object3D);
    return object3D;
  }

  setLayer(layerId, { silent = false } = {}) {
    if (!this.hasLayer(layerId)) {
      console.warn(`[WorldManager] Pominięto nieznaną warstwę: ${layerId}`);
      return false;
    }
    if (layerId === this.currentLayer) return false;

    const previousLayer = this.currentLayer;
    this.currentLayer = layerId;

    for (const [id, group] of this.groups) {
      group.visible = id === layerId;
    }

    const detail = {
      previousLayer,
      layer: layerId,
      meta: DEFAULT_LAYER_META[layerId],
    };

    if (!silent) {
      this.onChange?.(detail);
      for (const listener of this.listeners) listener(detail);
    }

    return true;
  }

  cycle(direction = 1) {
    const currentIndex = WORLD_LAYER_ORDER.indexOf(this.currentLayer);
    const nextIndex = (currentIndex + direction + WORLD_LAYER_ORDER.length) % WORLD_LAYER_ORDER.length;
    this.setLayer(WORLD_LAYER_ORDER[nextIndex]);
    return this.currentLayer;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose() {
    for (const group of this.groups.values()) {
      group.removeFromParent();
    }
    this.groups.clear();
    this.listeners.clear();
  }
}
