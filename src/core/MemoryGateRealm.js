import * as THREE from 'three';

function glowMaterial(color, opacity = 0.2) {
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
  g.addColorStop(0, 'rgba(255,244,225,0.95)');
  g.addColorStop(0.32, 'rgba(194,160,255,0.55)');
  g.addColorStop(1, 'rgba(110,80,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createPrompt(text, color = '#e6d8ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 32px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#ba8cff';
  ctx.fillStyle = color;
  ctx.fillText(text, 384, 64);

  const texture = new THREE.CanvasTexture(canvas);
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

function createMemoryShard(colorA, colorB) {
  const group = new THREE.Group();

  const shard = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.1 + Math.random() * 0.8, 0.06),
    new THREE.MeshStandardMaterial({
      color: colorA,
      emissive: colorB,
      emissiveIntensity: 0.22,
      roughness: 0.18,
      metalness: 0.52,
      transparent: true,
      opacity: 0.78,
    })
  );
  group.add(shard);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, shard.geometry.parameters.height + 0.14, 0.02),
    new THREE.MeshBasicMaterial({
      color: colorB,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(frame);

  group.userData.shard = shard;
  group.userData.frame = frame;
  return group;
}

export function createMemoryGateRealm(scene, {
  center = new THREE.Vector3(0, 0, 145),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:BramaPamieci';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 12));
  const localReturnPortal = new THREE.Vector3(0, 0, 18);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(64, 36, 24),
    new THREE.MeshBasicMaterial({
      color: 0x05030a,
      transparent: true,
      opacity: 0.95,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  dome.position.y = 9;
  root.add(dome);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 72),
    new THREE.MeshStandardMaterial({
      color: 0x090710,
      roughness: 0.68,
      metalness: 0.32,
      emissive: 0x130d22,
      emissiveIntensity: 0.18,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  root.add(floor);

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(8.6, 8.95, 96),
    glowMaterial(0xc293ff, 0.10)
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.03;
  root.add(innerRing);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(17.2, 17.35, 128),
    glowMaterial(0xf3db9c, 0.06)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.025;
  root.add(outerRing);

  const gate = new THREE.Group();
  gate.position.set(0, 0, -2.8);
  root.add(gate);

  const archRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.1, 16, 90),
    new THREE.MeshStandardMaterial({
      color: 0xf4e2b1,
      emissive: 0xc397ff,
      emissiveIntensity: 0.6,
      roughness: 0.24,
      metalness: 0.44,
      transparent: true,
      opacity: 0.9,
    })
  );
  archRing.position.y = 2.8;
  archRing.rotation.y = Math.PI / 2;
  gate.add(archRing);

  const archFill = new THREE.Mesh(
    new THREE.CircleGeometry(2.45, 48),
    glowMaterial(0xae8dff, 0.08)
  );
  archFill.position.y = 2.8;
  archFill.rotation.y = Math.PI / 2;
  gate.add(archFill);

  const pillarGeometry = new THREE.CylinderGeometry(0.12, 0.18, 3.6, 10);
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9c086,
    emissive: 0x7c59b7,
    emissiveIntensity: 0.2,
    roughness: 0.42,
    metalness: 0.36,
  });
  const pillarLeft = new THREE.Mesh(pillarGeometry, pillarMaterial);
  pillarLeft.position.set(0, 1.55, -2.55);
  pillarLeft.position.x = 0;
  pillarLeft.position.z = -2.55;
  pillarLeft.position.y = 1.55;
  pillarLeft.position.x = 0;
  pillarLeft.rotation.z = 0;
  pillarLeft.position.x = 0;
  gate.add(pillarLeft);

  const pillarRight = pillarLeft.clone();
  pillarLeft.position.x = -0.95;
  pillarRight.position.x = 0.95;
  gate.add(pillarRight);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.45, 7.8, 18, 1, true),
    glowMaterial(0xcf9fff, 0.08)
  );
  beam.position.set(0, 3.9, 0);
  root.add(beam);

  const memoryHalo = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 24, 24),
    glowMaterial(0xbb95ff, 0.06)
  );
  memoryHalo.position.set(0, 2.8, -2.8);
  memoryHalo.scale.set(1, 1.1, 1);
  root.add(memoryHalo);

  const orbitA = new THREE.Mesh(
    new THREE.TorusGeometry(3.7, 0.025, 8, 84),
    glowMaterial(0xe8d48f, 0.18)
  );
  orbitA.position.set(0, 2.8, -2.8);
  orbitA.rotation.set(Math.PI / 2.45, 0.28, 0.12);
  root.add(orbitA);

  const orbitB = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 0.018, 8, 96),
    glowMaterial(0xc291ff, 0.11)
  );
  orbitB.position.set(0, 2.8, -2.8);
  orbitB.rotation.set(Math.PI / 2.92, -0.35, 0.4);
  root.add(orbitB);

  const shards = [];
  for (let i = 0; i < 12; i++) {
    const shard = createMemoryShard(i % 3 === 0 ? 0xf3deb0 : 0xd0b0ff, i % 2 === 0 ? 0xbb8eff : 0xf3d37a);
    const angle = (i / 12) * Math.PI * 2;
    const radius = 4.2 + Math.random() * 3.4;
    shard.position.set(Math.cos(angle) * radius, 1.8 + Math.random() * 3.0, -2.8 + Math.sin(angle) * (1.8 + Math.random() * 2.6));
    shard.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.35);
    shard.userData.base = shard.position.clone();
    shard.userData.phase = Math.random() * Math.PI * 2;
    shard.userData.speed = 0.45 + Math.random() * 0.55;
    shard.userData.amp = 0.12 + Math.random() * 0.2;
    shards.push(shard);
    root.add(shard);
  }

  const particleCount = 140;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.sqrt(Math.random()) * 20;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.2 + Math.random() * 8.5;
    positions[i * 3 + 2] = -2.5 + Math.sin(angle) * radius * 0.42;
    speeds[i] = 0.06 + Math.random() * 0.16;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      map: createSoftTexture(),
      color: 0xe5d1ff,
      size: 0.12,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.02,
    })
  );
  particles.userData.speeds = speeds;
  root.add(particles);

  const returnPortal = new THREE.Group();
  returnPortal.position.copy(localReturnPortal);
  root.add(returnPortal);

  const returnRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.075, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0xefe5ff,
      emissive: 0xb98cff,
      emissiveIntensity: 0.7,
      roughness: 0.24,
      metalness: 0.4,
      transparent: true,
      opacity: 0.88,
    })
  );
  returnRing.position.y = 1.5;
  returnRing.rotation.y = Math.PI / 2;
  returnPortal.add(returnRing);

  const returnFill = new THREE.Mesh(
    new THREE.CircleGeometry(1.34, 40),
    glowMaterial(0xc39cff, 0.1)
  );
  returnFill.position.y = 1.5;
  returnFill.rotation.y = Math.PI / 2;
  returnPortal.add(returnFill);

  const returnLight = new THREE.PointLight(0xb98cff, 0.62, 7, 2);
  returnLight.position.y = 1.5;
  returnPortal.add(returnLight);

  const { sprite: prompt, material: promptMaterial } = createPrompt('WEJDŹ W BRAMĘ, ABY WRÓCIĆ');
  prompt.position.set(0, 3.7, 0);
  returnPortal.add(prompt);

  let time = 0;
  let returnNear = false;
  let promptOpacity = 0;

  function update(delta, avatarPosition = null, active = false) {
    time += delta;

    archRing.rotation.z += delta * 0.15;
    memoryHalo.scale.setScalar(1 + Math.sin(time * 1.15) * 0.04);
    orbitA.rotation.z += delta * 0.11;
    orbitB.rotation.z -= delta * 0.07;
    beam.material.opacity = 0.06 + Math.sin(time * 0.9) * 0.025;
    innerRing.material.opacity = 0.08 + Math.sin(time * 0.82) * 0.028;
    outerRing.rotation.z -= delta * 0.01;

    shards.forEach((shard, i) => {
      const d = shard.userData;
      shard.position.y = d.base.y + Math.sin(time * d.speed + d.phase) * d.amp;
      shard.rotation.y += delta * (0.16 + (i % 4) * 0.025);
      shard.rotation.x = Math.sin(time * 0.5 + d.phase) * 0.12;
      d.shard.material.opacity = 0.62 + Math.sin(time * 1.2 + d.phase) * 0.1;
      d.frame.material.opacity = 0.14 + Math.sin(time * 0.95 + d.phase) * 0.04;
    });

    const p = particles.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + speeds[i] * delta;
      let x = p.getX(i) + Math.sin(time * 0.45 + i * 0.2) * delta * 0.02;
      let z = p.getZ(i) + Math.cos(time * 0.4 + i * 0.17) * delta * 0.02;
      if (y > 8.8) y = 0.12;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;

    returnRing.rotation.z -= delta * 0.16;
    returnFill.material.opacity = 0.07 + Math.sin(time * 1.25) * 0.035;
    returnLight.intensity = 0.5 + Math.sin(time * 1.0) * 0.14;

    returnNear = false;
    if (active && avatarPosition) {
      const worldPortal = new THREE.Vector3();
      returnPortal.getWorldPosition(worldPortal);
      const dx = avatarPosition.x - worldPortal.x;
      const dz = avatarPosition.z - worldPortal.z;
      returnNear = Math.hypot(dx, dz) <= 5.6;
    }

    const targetPrompt = returnNear ? 0.84 : 0;
    promptOpacity += (targetPrompt - promptOpacity) * Math.min(1, delta * 4);
    promptMaterial.opacity = promptOpacity;
  }

  function isNearReturn(avatarPosition = null) {
    if (avatarPosition) {
      const worldPortal = new THREE.Vector3();
      returnPortal.getWorldPosition(worldPortal);
      const dx = avatarPosition.x - worldPortal.x;
      const dz = avatarPosition.z - worldPortal.z;
      return Math.hypot(dx, dz) <= 5.6;
    }
    return returnNear;
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isPoints && !node.isSprite) return;
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
