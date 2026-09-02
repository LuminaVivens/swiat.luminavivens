import * as THREE from 'three';

function glowMaterial(color, opacity = 0.14) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function makeSoftTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,245,225,0.95)');
  grad.addColorStop(0.35, 'rgba(190,215,245,0.42)');
  grad.addColorStop(1, 'rgba(120,150,180,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makePrompt(text, color = '#efe4c4') {
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

function createStoneMaterial({ color = 0x7c878f, emissive = 0x11161a, emissiveIntensity = 0.08 } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0.1,
    emissive,
    emissiveIntensity,
  });
}

function createStoneBuilding(width, height, depth, topScale = 0.88) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    createStoneMaterial({ color: 0x75818b, emissive: 0x10161c, emissiveIntensity: 0.06 })
  );
  base.position.y = height / 2;
  group.add(base);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(width * topScale, 0.6, depth * topScale),
    createStoneMaterial({ color: 0x8a949c, emissive: 0x131a21, emissiveIntensity: 0.08 })
  );
  cap.position.y = height + 0.3;
  group.add(cap);

  const crackCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < crackCount; i++) {
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, height * (0.35 + Math.random() * 0.45), 0.03),
      glowMaterial(i % 2 === 0 ? 0xc2e4ff : 0xf2d6a1, 0.16)
    );
    crack.position.set(
      (Math.random() - 0.5) * width * 0.7,
      height * (0.35 + Math.random() * 0.25),
      depth / 2 + 0.02
    );
    crack.rotation.z = (Math.random() - 0.5) * 0.28;
    group.add(crack);
  }

  return group;
}

function createArchway() {
  const group = new THREE.Group();
  const legMat = createStoneMaterial({ color: 0x818c93, emissive: 0x14191f, emissiveIntensity: 0.08 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6.4, 1.2), legMat);
  left.position.set(-1.6, 3.2, 0);
  group.add(left);
  const right = left.clone();
  right.position.x = 1.6;
  group.add(right);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.0, 1.4), legMat);
  beam.position.set(0, 6.1, 0);
  group.add(beam);
  const innerGlow = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.05, 8, 64),
    glowMaterial(0xbfe0ff, 0.12)
  );
  innerGlow.rotation.y = Math.PI / 2;
  innerGlow.position.y = 3.3;
  group.add(innerGlow);
  return group;
}

function createReturnPortal() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.08, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0xf0e7d1,
      emissive: 0x9ddaff,
      emissiveIntensity: 0.7,
      roughness: 0.22,
      metalness: 0.42,
      transparent: true,
      opacity: 0.9,
    })
  );
  ring.position.y = 1.5;
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(1.42, 40),
    glowMaterial(0x9ad6ff, 0.11)
  );
  fill.position.y = 1.5;
  fill.rotation.y = Math.PI / 2;
  group.add(fill);

  const light = new THREE.PointLight(0x9fdcff, 0.72, 7, 2);
  light.position.y = 1.5;
  group.add(light);

  return { group, ring, fill, light };
}

export function createStoneCityRealm(scene, {
  center = new THREE.Vector3(-145, 0, -145),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:KamienneMiasto';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 15));
  const localReturnPortal = new THREE.Vector3(0, 0, 22);
  const portalWorldPosition = new THREE.Vector3();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(74, 42, 28),
    new THREE.MeshBasicMaterial({
      color: 0x040506,
      transparent: true,
      opacity: 0.92,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  dome.position.y = 12;
  root.add(dome);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(33, 96),
    createStoneMaterial({ color: 0x2a3238, emissive: 0x0d1114, emissiveIntensity: 0.06 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  root.add(floor);

  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 9.8, 0.8, 8),
    createStoneMaterial({ color: 0x4e5962, emissive: 0x11161a, emissiveIntensity: 0.08 })
  );
  plaza.position.y = 0.32;
  root.add(plaza);

  const plazaRing = new THREE.Mesh(
    new THREE.RingGeometry(7.2, 7.42, 80),
    glowMaterial(0xbbdfff, 0.08)
  );
  plazaRing.rotation.x = -Math.PI / 2;
  plazaRing.position.y = 0.73;
  root.add(plazaRing);

  // Stały korytarz powrotu: żaden budynek nie powinien już zasłonić bramy.
  const returnPath = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.12, 13.5),
    createStoneMaterial({ color: 0x39444c, emissive: 0x101820, emissiveIntensity: 0.08 })
  );
  returnPath.position.set(0, 0.08, 16.4);
  root.add(returnPath);

  const pathGlowLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.035, 13.2),
    glowMaterial(0xaedfff, 0.10)
  );
  pathGlowLeft.position.set(-2.35, 0.16, 16.4);
  root.add(pathGlowLeft);

  const pathGlowRight = pathGlowLeft.clone();
  pathGlowRight.position.x = 2.35;
  root.add(pathGlowRight);

  const centralObelisk = new THREE.Group();
  root.add(centralObelisk);
  const obeliskBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 2.4, 1.2, 6),
    createStoneMaterial({ color: 0x626d76, emissive: 0x151b21, emissiveIntensity: 0.08 })
  );
  obeliskBase.position.y = 1.0;
  centralObelisk.add(obeliskBase);

  const obelisk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.4, 10.5, 6),
    createStoneMaterial({ color: 0x7a868f, emissive: 0x17212a, emissiveIntensity: 0.12 })
  );
  obelisk.position.y = 6.6;
  centralObelisk.add(obelisk);

  const obeliskCap = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 2.2, 6),
    createStoneMaterial({ color: 0x919aa1, emissive: 0x1c2631, emissiveIntensity: 0.16 })
  );
  obeliskCap.position.y = 12.9;
  centralObelisk.add(obeliskCap);

  const coreGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.22, 11.8, 12, 1, true),
    glowMaterial(0xd7eeff, 0.06)
  );
  coreGlow.position.y = 6.8;
  centralObelisk.add(coreGlow);

  const crownRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.05, 8, 72),
    glowMaterial(0xf0ddb5, 0.15)
  );
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.y = 11.8;
  centralObelisk.add(crownRing);

  const archways = [];
  for (let i = 0; i < 4; i++) {
    const arch = createArchway();
    const angle = (i / 4) * Math.PI * 2;
    const radius = 13.5;
    arch.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    arch.rotation.y = -angle + Math.PI / 2;
    root.add(arch);
    archways.push(arch);
  }

  const buildings = [];
  const buildingLayout = [
    [-18, -10, 5.5, 8.2, 6.2],
    [-12, -16, 4.8, 6.2, 5.2],
    [-3, -18, 7.0, 10.8, 6.8],
    [10, -16, 5.6, 7.8, 6.0],
    [18, -10, 6.4, 9.8, 6.5],
    [-18, 10, 6.6, 9.6, 6.8],
    [-9, 17, 5.0, 7.0, 5.2],
    [10, 20, 6.4, 10.2, 7.1],
    [15, 15, 5.4, 8.6, 6.2],
    [21, 4, 7.4, 12.4, 7.8],
    [-22, 2, 7.0, 11.4, 7.0],
  ];
  buildingLayout.forEach(([x, z, w, h, d], index) => {
    const building = createStoneBuilding(w, h, d, 0.84 + (index % 3) * 0.04);
    building.position.set(x, 0, z);
    building.rotation.y = ((index % 5) * Math.PI) / 12;
    root.add(building);
    buildings.push(building);
  });

  const towerCoords = [
    [-25, -22], [25, -22], [-25, 22], [25, 22],
  ];
  const towers = [];
  towerCoords.forEach(([x, z], i) => {
    const tower = createStoneBuilding(4.2, 15 + (i % 2) * 2.8, 4.2, 0.92);
    tower.position.set(x, 0, z);
    root.add(tower);
    towers.push(tower);
  });

  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.sqrt(Math.random()) * 25;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.5 + Math.random() * 12;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      map: makeSoftTexture(),
      color: 0xe7efe8,
      size: 0.14,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.02,
    })
  );
  root.add(particles);

  const { group: returnPortal, ring: returnRing, fill: returnFill, light: returnLight } = createReturnPortal();
  returnPortal.position.copy(localReturnPortal);
  root.add(returnPortal);

  const returnSafeRing = new THREE.Mesh(
    new THREE.RingGeometry(3.1, 3.35, 64),
    glowMaterial(0xbfe7ff, 0.08)
  );
  returnSafeRing.rotation.x = -Math.PI / 2;
  returnSafeRing.position.set(localReturnPortal.x, 0.04, localReturnPortal.z);
  root.add(returnSafeRing);

  const { sprite: prompt, material: promptMaterial } = makePrompt('WEJDŹ W BRAMĘ, ABY WRÓCIĆ');
  prompt.position.set(0, 3.7, 0);
  returnPortal.add(prompt);

  let time = 0;
  let returnNear = false;
  let promptOpacity = 0;

  function update(delta, avatarPosition = null, active = false) {
    time += delta;

    dome.material.opacity = 0.91 + Math.sin(time * 0.1) * 0.01;
    crownRing.rotation.z += delta * 0.18;
    crownRing.material.opacity = 0.12 + Math.sin(time * 1.15) * 0.03;
    coreGlow.material.opacity = 0.05 + Math.sin(time * 1.6) * 0.02;
    plazaRing.rotation.z -= delta * 0.02;

    archways.forEach((arch, i) => {
      const torus = arch.children[3];
      if (torus) {
        torus.rotation.z += delta * (0.08 + i * 0.015);
        torus.material.opacity = 0.08 + Math.sin(time * 1.1 + i) * 0.03;
      }
    });

    buildings.forEach((building, i) => {
      const child = building.children[2];
      if (child?.material) {
        child.material.opacity = 0.1 + Math.sin(time * 0.8 + i) * 0.05;
      }
    });

    towers.forEach((tower, i) => {
      const crack = tower.children[2];
      if (crack?.material) {
        crack.material.opacity = 0.12 + Math.sin(time * 0.9 + i) * 0.05;
      }
    });

    const p = particles.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const phase = phases[i];
      const x = p.getX(i) + Math.sin(time * 0.25 + phase) * delta * 0.02;
      let y = p.getY(i) + (0.03 + (i % 9) * 0.004) * delta;
      const z = p.getZ(i) + Math.cos(time * 0.23 + phase) * delta * 0.016;
      if (y > 13.8) y = 0.25;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;

    returnSafeRing.rotation.z += delta * 0.025;
    returnSafeRing.material.opacity = 0.065 + Math.sin(time * 1.0) * 0.02;
    returnRing.rotation.z -= delta * 0.16;
    returnFill.material.opacity = 0.08 + Math.sin(time * 1.35) * 0.03;
    returnLight.intensity = 0.56 + Math.sin(time * 1.1) * 0.15;

    returnNear = false;
    if (active && avatarPosition) {
      returnPortal.getWorldPosition(portalWorldPosition);
      returnNear = Math.hypot(
        avatarPosition.x - portalWorldPosition.x,
        avatarPosition.z - portalWorldPosition.z
      ) <= 5.2;
    }

    const targetOpacity = returnNear ? 0.86 : 0;
    promptOpacity += (targetOpacity - promptOpacity) * Math.min(1, delta * 4.2);
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
