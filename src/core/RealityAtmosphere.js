import * as THREE from 'three';
import { WORLD_LAYERS } from './WorldManager.js';
import { createSpiritualJellyfish } from './SpiritualJellyfish.js';
import { createSpiritualSky } from './SpiritualSky.js';
import { createLayerAnchors } from './LayerAnchors.js';
import { createEnergeticFlowField } from './EnergeticFlowField.js';
import { createVoidMeditationField } from './VoidMeditationField.js';
import { createDarkSpiritualField } from './DarkSpiritualField.js';

const LAYER_STYLE = Object.freeze({
  [WORLD_LAYERS.PHYSICAL]: {
    color: 0xd4af37,
    count: 34,
    size: 0.035,
    opacity: 0.16,
    speed: 0.018,
  },
  [WORLD_LAYERS.ENERGETIC]: {
    color: 0x55dfff,
    count: 120,
    size: 0.055,
    opacity: 0.42,
    speed: 0.11,
  },
  [WORLD_LAYERS.VOID]: {
    color: 0x8e7cff,
    count: 24,
    size: 0.07,
    opacity: 0.16,
    speed: -0.012,
  },
  [WORLD_LAYERS.SPIRITUAL]: {
    color: 0xf2e8ff,
    count: 80,
    size: 0.045,
    opacity: 0.34,
    speed: 0.045,
  },
  [WORLD_LAYERS.DARK_SPIRITUAL]: {
    color: 0xc4b6ff,
    count: 0,
    size: 0.05,
    opacity: 0.0,
    speed: 0.0,
  },
});

function createField(style, radius = 46) {
  const positions = new Float32Array(style.count * 3);

  for (let i = 0; i < style.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 7 + Math.sqrt(Math.random()) * radius;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = 0.4 + Math.random() * 11;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: style.color,
    size: style.size,
    transparent: true,
    opacity: style.opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/**
 * Delikatna sygnatura wizualna warstw. Nie zmienia mapy ani pozycji gracza.
 * Każda warstwa dostaje własne pole świetlnych punktów, przypięte do grup
 * WorldManagera. To bezpieczny pierwszy krok przed przenoszeniem geometrii.
 */
export function createRealityAtmosphere(worldManager) {
  const fields = new Map();
  const spiritualJellyfish = createSpiritualJellyfish();
  const spiritualSky = createSpiritualSky();
  const layerAnchors = createLayerAnchors();
  const energeticFlowField = createEnergeticFlowField();
  const voidMeditationField = createVoidMeditationField();
  const darkSpiritualField = createDarkSpiritualField();
  worldManager.addToLayer(WORLD_LAYERS.SPIRITUAL, spiritualSky.root);
  worldManager.addToLayer(WORLD_LAYERS.SPIRITUAL, spiritualJellyfish.root);
  worldManager.addToLayer(WORLD_LAYERS.SPIRITUAL, layerAnchors.spiritualPoint.group);
  worldManager.addToLayer(WORLD_LAYERS.ENERGETIC, layerAnchors.energeticPoint.group);
  worldManager.addToLayer(WORLD_LAYERS.ENERGETIC, energeticFlowField.root);
  worldManager.addToLayer(WORLD_LAYERS.VOID, voidMeditationField.root);
  worldManager.addToLayer(WORLD_LAYERS.DARK_SPIRITUAL, darkSpiritualField.root);
  let time = 0;

  for (const [layerId, style] of Object.entries(LAYER_STYLE)) {
    const field = createField(style);
    field.name = `RealityAtmosphere:${layerId}`;
    worldManager.addToLayer(layerId, field);
    fields.set(layerId, { field, style });
  }

  function update(delta, focusPosition = null) {
    time += delta;

    for (const { field, style } of fields.values()) {
      field.rotation.y += delta * style.speed;
      field.position.y = Math.sin(time * 0.22) * 0.08;

      // Pole podąża tylko w poziomie za graczem, więc jego granica nie jest
      // widoczna podczas dalszej wędrówki po mapie.
      if (focusPosition) {
        field.position.x = focusPosition.x;
        field.position.z = focusPosition.z;
      }
    }

    spiritualSky.update(delta);
    spiritualJellyfish.update(delta, focusPosition);
    energeticFlowField.update(delta, focusPosition);
    voidMeditationField.update(delta, focusPosition);
    darkSpiritualField.update(delta, focusPosition);
    layerAnchors.update(delta);
  }

  function dispose() {
    for (const { field } of fields.values()) {
      field.geometry.dispose();
      field.material.dispose();
      field.removeFromParent();
    }
    spiritualSky.dispose();
    spiritualJellyfish.dispose();
    energeticFlowField.dispose();
    voidMeditationField.dispose();
    darkSpiritualField.dispose();
    layerAnchors.dispose();
    fields.clear();
  }

  return { update, dispose };
}
