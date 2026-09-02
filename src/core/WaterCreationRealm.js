import * as THREE from 'three';

function glowMaterial(color, opacity = 0.22) {
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
  g.addColorStop(0, 'rgba(210,250,255,0.95)');
  g.addColorStop(0.45, 'rgba(100,220,255,0.45)');
  g.addColorStop(1, 'rgba(80,170,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function createWaterCreationRealm(scene, {
  center = new THREE.Vector3(145, 0, 0),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:WodaKreacji';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 12));
  const localEntry = new THREE.Vector3(0, 0, 12);
  const localReturnPortal = new THREE.Vector3(0, 0, 18);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(64, 36, 24),
    new THREE.MeshBasicMaterial({
      color: 0x020a12,
      transparent: true,
      opacity: 0.9,
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
      color: 0x030b12,
      roughness: 0.55,
      metalness: 0.5,
      emissive: 0x041522,
      emissiveIntensity: 0.18,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  root.add(floor);

  const waterGeo = new THREE.CircleGeometry(13, 96);
  const waterBase = Float32Array.from(waterGeo.attributes.position.array);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0b5d78,
    roughness: 0.08,
    metalness: 0.62,
    transparent: true,
    opacity: 0.74,
    emissive: 0x073d55,
    emissiveIntensity: 0.52,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.04;
  root.add(water);

  const shore = new THREE.Mesh(
    new THREE.RingGeometry(13.1, 13.55, 96),
    glowMaterial(0x8deaff, 0.2)
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = 0.055;
  root.add(shore);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(18.5, 18.65, 112),
    glowMaterial(0x4abfe8, 0.08)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.03;
  root.add(outerRing);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.78, 2),
    new THREE.MeshBasicMaterial({
      color: 0xd7fbff,
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  core.position.y = 1.55;
  root.add(core);

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 20, 20),
    glowMaterial(0x55dfff, 0.15)
  );
  coreGlow.position.copy(core.position);
  root.add(coreGlow);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.7, 7.5, 18, 1, true),
    glowMaterial(0x8eeaff, 0.11)
  );
  beam.position.y = 3.7;
  root.add(beam);

  const coreRingA = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.028, 8, 72),
    glowMaterial(0xa9f0ff, 0.24)
  );
  coreRingA.position.y = 1.55;
  coreRingA.rotation.x = Math.PI / 2.4;
  root.add(coreRingA);

  const coreRingB = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.018, 8, 90),
    glowMaterial(0x6acfff, 0.12)
  );
  coreRingB.position.y = 1.5;
  coreRingB.rotation.set(Math.PI / 2.8, 0.35, 0.12);
  root.add(coreRingB);

  const particleCount = 170;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.sqrt(Math.random()) * 18;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.2 + Math.random() * 8;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds[i] = 0.12 + Math.random() * 0.28;
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeo,
    new THREE.PointsMaterial({
      map: createSoftTexture(),
      color: 0xaeefff,
      size: 0.12,
      transparent: true,
      opacity: 0.42,
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
      color: 0xd9f6ff,
      emissive: 0x5fd7ff,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.35,
      transparent: true,
      opacity: 0.86,
    })
  );
  returnRing.position.y = 1.5;
  returnRing.rotation.y = Math.PI / 2;
  returnPortal.add(returnRing);

  const returnFill = new THREE.Mesh(
    new THREE.CircleGeometry(1.34, 40),
    glowMaterial(0x83ddff, 0.1)
  );
  returnFill.position.y = 1.5;
  returnFill.rotation.y = Math.PI / 2;
  returnPortal.add(returnFill);

  const returnLight = new THREE.PointLight(0x71d9ff, 0.65, 7, 2);
  returnLight.position.y = 1.5;
  returnPortal.add(returnLight);

  const localPrompt = document.createElement('canvas');
  localPrompt.width = 640;
  localPrompt.height = 128;
  const ctx = localPrompt.getContext('2d');
  ctx.font = '600 34px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#6ddfff';
  ctx.fillStyle = '#d9f8ff';
  ctx.fillText('WEJDŹ W BRAMĘ, ABY WRÓCIĆ', 320, 64);
  const promptTexture = new THREE.CanvasTexture(localPrompt);
  const promptMaterial = new THREE.SpriteMaterial({
    map: promptTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const prompt = new THREE.Sprite(promptMaterial);
  prompt.position.set(0, 3.7, 0);
  prompt.scale.set(4.8, 0.95, 1);
  prompt.renderOrder = 1150;
  returnPortal.add(prompt);

  let time = 0;
  let returnNear = false;
  let promptOpacity = 0;

  function update(delta, avatarPosition = null, active = false) {
    time += delta;

    const pos = waterGeo.attributes.position;
    for (let i = 1; i < pos.count; i++) {
      const bx = waterBase[i * 3];
      const by = waterBase[i * 3 + 1];
      const dist = Math.hypot(bx, by);
      const ripple =
        Math.sin(dist * 1.6 - time * 1.2) * 0.07 +
        Math.sin((bx + by) * 0.8 + time * 0.7) * 0.025;
      pos.setZ(i, ripple * Math.min(1, dist / 4));
    }
    pos.needsUpdate = true;
    waterGeo.computeVertexNormals();

    core.rotation.y += delta * 0.45;
    core.rotation.x += delta * 0.12;
    core.position.y = 1.55 + Math.sin(time * 1.05) * 0.08;
    coreGlow.position.y = core.position.y;
    const pulse = 1 + Math.sin(time * 1.35) * 0.06;
    coreGlow.scale.setScalar(pulse);
    coreRingA.rotation.z += delta * 0.15;
    coreRingB.rotation.z -= delta * 0.09;
    beam.material.opacity = 0.08 + Math.sin(time * 1.2) * 0.025;
    shore.material.opacity = 0.16 + Math.sin(time * 0.8) * 0.04;
    outerRing.rotation.z += delta * 0.018;

    const p = particles.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + speeds[i] * delta;
      let x = p.getX(i) + Math.sin(time * 0.7 + i * 0.19) * delta * 0.025;
      let z = p.getZ(i) + Math.cos(time * 0.55 + i * 0.13) * delta * 0.025;
      if (y > 8.5) y = 0.15;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    particles.rotation.y += delta * 0.012;

    returnRing.rotation.z += delta * 0.18;
    returnFill.material.opacity = 0.07 + Math.sin(time * 1.3) * 0.04;
    returnLight.intensity = 0.5 + Math.sin(time * 1.1) * 0.16;

    returnNear = false;
    if (active && avatarPosition) {
      const worldPortal = center.clone().add(localReturnPortal);
      returnNear = Math.hypot(
        avatarPosition.x - worldPortal.x,
        avatarPosition.z - worldPortal.z
      ) <= 4.2;
    }
    const targetPrompt = returnNear ? 0.82 : 0;
    promptOpacity += (targetPrompt - promptOpacity) * Math.min(1, delta * 4);
    promptMaterial.opacity = promptOpacity;
  }

  function isNearReturn(avatarPosition = null) {
    if (avatarPosition) {
      const worldPortal = center.clone().add(localReturnPortal);
      return Math.hypot(
        avatarPosition.x - worldPortal.x,
        avatarPosition.z - worldPortal.z
      ) <= 4.2;
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
    localEntry,
    update,
    isNearReturn,
    dispose,
  };
}
