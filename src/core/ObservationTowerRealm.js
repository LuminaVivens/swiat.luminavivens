import * as THREE from 'three';

function glowMaterial(color, opacity = 0.18) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function createSoftTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,248,232,0.95)');
  g.addColorStop(0.38, 'rgba(173,212,255,0.48)');
  g.addColorStop(1, 'rgba(90,140,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPrompt(text, color = '#f2e8c5') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 32px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillText(text, 384, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.2, 0.9, 1);
  sprite.renderOrder = 1150;
  return { sprite, material };
}

function createObservationGlyph(radius, color) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.03, 8, 64),
    glowMaterial(color, 0.2)
  );
  group.add(ring);

  const markerMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), markerMat);
    const angle = (i / 4) * Math.PI * 2;
    marker.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    marker.rotation.z = Math.PI / 2;
    group.add(marker);
  }
  return group;
}

export function createObservationTowerRealm(scene, {
  center = new THREE.Vector3(-145, 0, 145),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:WiezaObserwacji';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 12));
  const localReturnPortal = new THREE.Vector3(-12, 0, 10);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(68, 40, 26),
    new THREE.MeshBasicMaterial({
      color: 0x04070d,
      transparent: true,
      opacity: 0.95,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  dome.position.y = 10;
  root.add(dome);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(31, 88),
    new THREE.MeshStandardMaterial({
      color: 0x070c13,
      roughness: 0.62,
      metalness: 0.34,
      emissive: 0x101d28,
      emissiveIntensity: 0.12,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  floor.receiveShadow = true;
  root.add(floor);

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(6.6, 6.9, 96),
    glowMaterial(0x9ad7ff, 0.08)
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.03;
  root.add(baseRing);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(18.5, 18.65, 128),
    glowMaterial(0xf4e6b8, 0.05)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.02;
  root.add(outerRing);

  const towerGroup = new THREE.Group();
  towerGroup.position.set(0, 0, -2);
  root.add(towerGroup);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.4, 1.0, 8),
    new THREE.MeshStandardMaterial({
      color: 0x2c3540,
      emissive: 0x18232f,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.4,
    })
  );
  pedestal.position.y = 0.48;
  towerGroup.add(pedestal);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 1.15, 14.5, 9),
    new THREE.MeshStandardMaterial({
      color: 0xd8dddf,
      emissive: 0x78bfff,
      emissiveIntensity: 0.16,
      roughness: 0.28,
      metalness: 0.58,
    })
  );
  shaft.position.y = 7.6;
  towerGroup.add(shaft);

  const coreBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.52, 20, 18, 1, true),
    glowMaterial(0xbde8ff, 0.1)
  );
  coreBeam.position.y = 10;
  towerGroup.add(coreBeam);

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 3.4, 8),
    new THREE.MeshStandardMaterial({
      color: 0xf0e0b7,
      emissive: 0x7fb8ff,
      emissiveIntensity: 0.28,
      roughness: 0.22,
      metalness: 0.52,
    })
  );
  spire.position.y = 16.5;
  towerGroup.add(spire);

  const crown = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.12, 8, 72),
    new THREE.MeshStandardMaterial({
      color: 0xf6eabf,
      emissive: 0x9dd7ff,
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.45,
      transparent: true,
      opacity: 0.88,
    })
  );
  crown.position.y = 14.6;
  crown.rotation.x = Math.PI / 2;
  towerGroup.add(crown);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 18, 18),
    glowMaterial(0xaedfff, 0.06)
  );
  halo.position.y = 14.6;
  halo.scale.set(1, 0.7, 1);
  towerGroup.add(halo);

  const platforms = [];
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0xced6db,
    emissive: 0x6ea9cf,
    emissiveIntensity: 0.18,
    roughness: 0.4,
    metalness: 0.45,
  });
  const levels = [3.2, 6.2, 9.5, 12.7];
  levels.forEach((height, i) => {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2 - i * 0.28, 3.5 - i * 0.28, 0.18, 7),
      platformMaterial
    );
    platform.position.y = height;
    platform.rotation.y = i * 0.45;
    towerGroup.add(platform);
    platforms.push(platform);

    const rail = new THREE.Mesh(
      new THREE.TorusGeometry(3.15 - i * 0.28, 0.05, 8, 72),
      glowMaterial(i % 2 === 0 ? 0x9ad7ff : 0xf1dfad, 0.16)
    );
    rail.position.y = height + 0.14;
    rail.rotation.x = Math.PI / 2;
    towerGroup.add(rail);
    platforms.push(rail);
  });

  const observationGlyphs = [];
  for (let i = 0; i < 5; i++) {
    const glyph = createObservationGlyph(1.1 + i * 0.2, i % 2 === 0 ? 0xbce8ff : 0xf2e4b9);
    glyph.position.set(0, 4 + i * 2.6, -2);
    glyph.rotation.x = Math.PI / 2;
    root.add(glyph);
    observationGlyphs.push(glyph);
  }

  const beaconLight = new THREE.SpotLight(0xc8ebff, 1.35, 55, Math.PI / 6, 0.6, 1.2);
  beaconLight.position.set(0, 17.2, -2);
  beaconLight.target.position.set(0, 2.0, -2);
  root.add(beaconLight);
  root.add(beaconLight.target);

  const sideBeams = [];
  [-1, 1].forEach((dir, idx) => {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.28, 10.5, 16, 1, true),
      glowMaterial(idx === 0 ? 0x93d8ff : 0xf1ddb0, 0.05)
    );
    beam.position.set(dir * 5.4, 6.4, 1.6);
    beam.rotation.z = dir * 0.72;
    root.add(beam);
    sideBeams.push(beam);
  });

  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.sqrt(Math.random()) * 18;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.4 + Math.random() * 17.5;
    positions[i * 3 + 2] = -2 + Math.sin(angle) * radius;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      map: createSoftTexture(),
      color: 0xe8f3ff,
      size: 0.14,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.02,
    })
  );
  particles.userData.phases = phases;
  root.add(particles);

  const returnPortal = new THREE.Group();
  returnPortal.position.copy(localReturnPortal);
  root.add(returnPortal);

  const returnRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.08, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0xf3ebff,
      emissive: 0x93d8ff,
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.42,
      transparent: true,
      opacity: 0.9,
    })
  );
  returnRing.position.y = 1.5;
  returnRing.rotation.y = Math.PI / 2;
  returnPortal.add(returnRing);

  const returnFill = new THREE.Mesh(
    new THREE.CircleGeometry(1.42, 40),
    glowMaterial(0x8ed9ff, 0.11)
  );
  returnFill.position.y = 1.5;
  returnFill.rotation.y = Math.PI / 2;
  returnPortal.add(returnFill);

  const returnLight = new THREE.PointLight(0xa8e5ff, 0.68, 7, 2);
  returnLight.position.y = 1.5;
  returnPortal.add(returnLight);

  const { sprite: prompt, material: promptMaterial } = createPrompt('WEJDŹ W BRAMĘ, ABY WRÓCIĆ', '#e8e0be');
  prompt.position.set(0, 3.7, 0);
  returnPortal.add(prompt);

  let time = 0;
  let returnNear = false;
  let promptOpacity = 0;
  const portalWorldPosition = new THREE.Vector3();

  function update(delta, avatarPosition = null, active = false) {
    time += delta;

    crown.rotation.z += delta * 0.24;
    halo.scale.setScalar(1 + Math.sin(time * 1.1) * 0.04);
    coreBeam.material.opacity = 0.08 + Math.sin(time * 1.6) * 0.025;
    baseRing.rotation.z += delta * 0.03;
    outerRing.rotation.z -= delta * 0.016;

    platforms.forEach((platform, i) => {
      if (platform.geometry.type === 'TorusGeometry') {
        platform.rotation.z += delta * (0.08 + i * 0.004);
      }
    });

    observationGlyphs.forEach((glyph, i) => {
      glyph.rotation.z += delta * (0.08 + i * 0.02);
      glyph.position.y += Math.sin(time * 0.9 + i) * delta * 0.08;
    });

    sideBeams.forEach((beam, i) => {
      beam.material.opacity = 0.04 + Math.sin(time * 1.2 + i) * 0.015;
    });

    const p = particles.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const phase = phases[i];
      const x = p.getX(i) + Math.sin(time * 0.35 + phase) * delta * 0.025;
      let y = p.getY(i) + (0.06 + ((i % 7) * 0.008)) * delta;
      const z = p.getZ(i) + Math.cos(time * 0.3 + phase) * delta * 0.02;
      if (y > 19.5) y = 0.25;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;

    returnRing.rotation.z -= delta * 0.16;
    returnFill.material.opacity = 0.08 + Math.sin(time * 1.4) * 0.03;
    returnLight.intensity = 0.55 + Math.sin(time * 1.2) * 0.15;

    returnNear = false;
    if (active && avatarPosition) {
      returnPortal.getWorldPosition(portalWorldPosition);
      returnNear = Math.hypot(
        avatarPosition.x - portalWorldPosition.x,
        avatarPosition.z - portalWorldPosition.z
      ) <= 5.2;
    }

    const targetPrompt = returnNear ? 0.86 : 0;
    promptOpacity += (targetPrompt - promptOpacity) * Math.min(1, delta * 4.2);
    promptMaterial.opacity = promptOpacity;
  }

  function isNearReturn(avatarPosition = null) {
    returnPortal.getWorldPosition(portalWorldPosition);
    if (avatarPosition) {
      return Math.hypot(
        avatarPosition.x - portalWorldPosition.x,
        avatarPosition.z - portalWorldPosition.z
      ) <= 5.2;
    }
    return returnNear;
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isPoints && !node.isSprite && !node.isLine) return;
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return {
    root,
    center,
    entryPoint,
    update,
    isNearReturn,
    dispose,
  };
}
