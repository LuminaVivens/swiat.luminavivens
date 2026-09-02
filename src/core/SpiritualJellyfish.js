import * as THREE from 'three';

const JELLYFISH_PALETTE = [
  { body: 0xffd7f1, glow: 0xff97dc, accent: 0xfff1a8 },
  { body: 0xc9e5ff, glow: 0x79c8ff, accent: 0xf8f2b6 },
  { body: 0xe1d2ff, glow: 0xb18dff, accent: 0xffd7a8 },
  { body: 0xd8ffe9, glow: 0x78ffc8, accent: 0xc7e9ff },
  { body: 0xffe2bf, glow: 0xffaf68, accent: 0xff8fd7 },
];

function createSoftTexture(inner = 'rgba(255,255,255,0.9)', outer = 'rgba(255,255,255,0)') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createParticleField(colorHex, count = 22, radius = 2.6) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = -1.2 + Math.random() * 3.2;
    positions[i * 3 + 2] = Math.sin(theta) * r;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: colorHex,
    size: 0.07,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    map: createSoftTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'),
    alphaTest: 0.02,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.spin = (Math.random() - 0.5) * 0.2;
  return points;
}

function createTentacle(length, colorHex, width = 0.05, opacity = 0.42) {
  const segmentCount = 18;
  const positions = new Float32Array((segmentCount + 1) * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  line.userData = {
    segmentCount,
    length,
    width,
    swayOffset: Math.random() * Math.PI * 2,
    swaySpeed: 0.8 + Math.random() * 0.9,
    sidePhase: Math.random() * Math.PI * 2,
    curl: 0.12 + Math.random() * 0.18,
  };

  return line;
}

function populateTentacle(line, time, origin, driftFactor = 1) {
  const positions = line.geometry.getAttribute('position');
  const { segmentCount, length, swayOffset, swaySpeed, sidePhase, curl } = line.userData;

  for (let i = 0; i <= segmentCount; i++) {
    const t = i / segmentCount;
    const y = -t * length;
    const swayX = Math.sin(time * swaySpeed + swayOffset + t * 3.8) * (0.08 + t * 0.28) * driftFactor;
    const swayZ = Math.cos(time * (swaySpeed * 0.78) + sidePhase + t * 4.5) * (0.05 + t * 0.18) * driftFactor;
    const curlBias = Math.sin(t * Math.PI) * curl;

    positions.setXYZ(
      i,
      origin.x + swayX + curlBias,
      origin.y + y,
      origin.z + swayZ
    );
  }

  positions.needsUpdate = true;
}

function createJellyfish(index) {
  const palette = JELLYFISH_PALETTE[index % JELLYFISH_PALETTE.length];
  const group = new THREE.Group();
  group.name = `SpiritualJellyfish:${index + 1}`;

  const radius = 1.05 + Math.random() * 1.2;
  const height = radius * (0.72 + Math.random() * 0.18);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshBasicMaterial({
      color: palette.body,
      transparent: true,
      opacity: 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  dome.scale.y = 0.78;
  dome.position.y = 0.2;
  group.add(dome);

  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.7, 22, 18),
    new THREE.MeshBasicMaterial({
      color: palette.glow,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  innerGlow.scale.set(1, 0.68, 1);
  innerGlow.position.y = 0.12;
  group.add(innerGlow);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(radius * 0.24, 0),
    new THREE.MeshBasicMaterial({
      color: palette.accent,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  core.position.y = -0.18;
  group.add(core);

  const skirt = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.82, radius * 0.085, 10, 48),
    new THREE.MeshBasicMaterial({
      color: palette.glow,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  skirt.rotation.x = Math.PI / 2;
  skirt.position.y = -height * 0.18;
  group.add(skirt);

  const ringCount = 2 + Math.floor(Math.random() * 2);
  const auraRings = [];
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * (1.15 + i * 0.22), 0.018 + i * 0.008, 8, 52),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? palette.glow : palette.accent,
        transparent: true,
        opacity: 0.12 - i * 0.02,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ring.rotation.x = Math.PI / (2 + i * 0.35);
    ring.rotation.z = Math.random() * Math.PI * 2;
    ring.position.y = 0.15 + i * 0.18;
    group.add(ring);
    auraRings.push(ring);
  }

  const tentacles = [];
  const tentacleCount = 8 + Math.floor(Math.random() * 8);
  for (let i = 0; i < tentacleCount; i++) {
    const ang = (i / tentacleCount) * Math.PI * 2 + Math.random() * 0.12;
    const origin = new THREE.Vector3(
      Math.cos(ang) * radius * (0.2 + Math.random() * 0.35),
      -height * 0.22,
      Math.sin(ang) * radius * (0.2 + Math.random() * 0.35)
    );
    const lengthBase = 2.3 + Math.random() * 3.5;
    const color = i % 3 === 0 ? palette.accent : i % 2 === 0 ? palette.glow : palette.body;
    const line = createTentacle(lengthBase, color, 0.05, 0.36 + Math.random() * 0.2);
    line.userData.origin = origin;
    group.add(line);
    tentacles.push(line);
  }

  const oralArms = [];
  const oralCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < oralCount; i++) {
    const ang = (i / oralCount) * Math.PI * 2 + Math.random() * 0.25;
    const origin = new THREE.Vector3(
      Math.cos(ang) * radius * 0.18,
      -height * 0.1,
      Math.sin(ang) * radius * 0.18
    );
    const line = createTentacle(1.4 + Math.random() * 1.6, palette.body, 0.08, 0.22);
    line.userData.origin = origin;
    group.add(line);
    oralArms.push(line);
  }

  const particles = createParticleField(palette.glow, 18 + Math.floor(Math.random() * 12), radius * 1.8);
  group.add(particles);

  group.userData.motion = {
    anchor: new THREE.Vector3(),
    bobOffset: Math.random() * Math.PI * 2,
    bobSpeed: 0.35 + Math.random() * 0.3,
    bobAmplitude: 0.35 + Math.random() * 0.55,
    driftOffset: Math.random() * Math.PI * 2,
    driftSpeed: 0.06 + Math.random() * 0.08,
    driftRadius: 0.6 + Math.random() * 1.4,
    yawSpeed: (Math.random() - 0.5) * 0.18,
    pulseOffset: Math.random() * Math.PI * 2,
  };

  group.userData.parts = {
    dome,
    innerGlow,
    core,
    skirt,
    auraRings,
    tentacles,
    oralArms,
    particles,
  };

  return group;
}

export function createSpiritualJellyfish({ count = 8, spread = 34, minHeight = 7, maxHeight = 22 } = {}) {
  const root = new THREE.Group();
  root.name = 'SpiritualJellyfishField';

  const jellyfish = [];
  const driftState = {
    position: new THREE.Vector3(0, 0, 0),
    target: new THREE.Vector3((Math.random() - 0.5) * 18, 0, (Math.random() - 0.5) * 18),
    retargetTimer: 8,
  };

  for (let i = 0; i < count; i++) {
    const jelly = createJellyfish(i);
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.7;
    const radius = 8 + Math.sqrt((i + 0.5) / count) * spread;
    const height = minHeight + Math.random() * (maxHeight - minHeight);

    jelly.userData.motion.anchor.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    jelly.position.copy(jelly.userData.motion.anchor);
    jelly.rotation.y = Math.random() * Math.PI * 2;
    root.add(jelly);
    jellyfish.push(jelly);
  }

  function updateDrift(delta) {
    driftState.retargetTimer -= delta;
    if (driftState.retargetTimer <= 0 || driftState.position.distanceToSquared(driftState.target) < 1.5) {
      driftState.target.set((Math.random() - 0.5) * 38, 0, (Math.random() - 0.5) * 38);
      driftState.retargetTimer = 10 + Math.random() * 10;
    }
    driftState.position.lerp(driftState.target, Math.min(1, delta * 0.1));
    root.position.x = driftState.position.x;
    root.position.z = driftState.position.z;
  }

  function update(delta) {
    const time = performance.now() * 0.001;
    updateDrift(delta);

    for (const jelly of jellyfish) {
      const motion = jelly.userData.motion;
      const parts = jelly.userData.parts;

      const bob = Math.sin(time * motion.bobSpeed + motion.bobOffset) * motion.bobAmplitude;
      const driftX = Math.cos(time * motion.driftSpeed + motion.driftOffset) * motion.driftRadius;
      const driftZ = Math.sin(time * motion.driftSpeed * 1.17 + motion.driftOffset) * motion.driftRadius;
      const pulse = 0.92 + Math.sin(time * 2.2 + motion.pulseOffset) * 0.12;

      jelly.position.x = motion.anchor.x + driftX;
      jelly.position.y = motion.anchor.y + bob;
      jelly.position.z = motion.anchor.z + driftZ;
      jelly.rotation.y += delta * motion.yawSpeed;
      jelly.rotation.z = Math.sin(time * motion.bobSpeed + motion.bobOffset) * 0.06;

      parts.dome.scale.y = 0.74 + Math.sin(time * 3 + motion.pulseOffset) * 0.06;
      parts.innerGlow.scale.set(1.0 * pulse, 0.68 * pulse, 1.0 * pulse);
      parts.core.rotation.y += delta * 0.8;
      parts.core.rotation.x += delta * 0.24;
      parts.skirt.scale.setScalar(0.96 + Math.sin(time * 3.2 + motion.pulseOffset) * 0.05);
      parts.particles.rotation.y += delta * (parts.particles.userData.spin || 0.08);

      parts.auraRings.forEach((ring, index) => {
        ring.rotation.z += delta * (0.08 + index * 0.04);
        ring.material.opacity = 0.08 + Math.sin(time * 1.4 + motion.pulseOffset + index * 0.5) * 0.03;
      });

      parts.tentacles.forEach((line, index) => {
        const origin = line.userData.origin;
        populateTentacle(line, time + index * 0.09, origin, 1);
        line.material.opacity = 0.26 + Math.sin(time * 1.7 + index * 0.3 + motion.pulseOffset) * 0.08;
      });

      parts.oralArms.forEach((line, index) => {
        const origin = line.userData.origin;
        populateTentacle(line, time + index * 0.13, origin, 0.55);
        line.material.opacity = 0.16 + Math.sin(time * 1.4 + index * 0.4 + motion.pulseOffset) * 0.05;
      });
    }
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isPoints && !node.isLine) return;
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return { root, update, dispose };
}
