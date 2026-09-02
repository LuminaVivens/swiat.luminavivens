import * as THREE from 'three';

const HEIGHT_FACTOR = 0.869; // obniżenie o ok. 13.1%
const RAINBOW_COLORS = [
  0xff5f6d,
  0xff9f43,
  0xffe66d,
  0x62f29a,
  0x5ad7ff,
  0x6f8dff,
  0xd79bff,
];

function vecLerp(a, b, t) {
  return new THREE.Vector3().copy(a).lerp(b, t);
}

function quadraticBezier(p0, p1, p2, t) {
  const a = vecLerp(p0, p1, t);
  const b = vecLerp(p1, p2, t);
  return a.lerp(b, t);
}

function createRainbowWaterfall(baseRadius) {
  const group = new THREE.Group();
  group.name = 'RainbowWaterfall';
  const width = 0.3 + Math.random() * 0.16;
  const height = 2.1 + Math.random() * 1.6;
  const stripGap = width / (RAINBOW_COLORS.length + 2);
  const strips = [];

  RAINBOW_COLORS.forEach((hex, index) => {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(stripGap * 1.7, height),
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    strip.userData.baseX = (index - (RAINBOW_COLORS.length - 1) / 2) * stripGap;
    strip.position.x = strip.userData.baseX;
    strip.position.y = -height * 0.5;
    strip.rotation.y = (Math.random() - 0.5) * 0.25;
    group.add(strip);
    strips.push(strip);
  });

  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.7, height * 1.04),
    new THREE.MeshBasicMaterial({
      color: 0xf3f2ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  veil.position.y = -height * 0.5;
  group.add(veil);

  group.position.set(baseRadius * (0.15 + Math.random() * 0.2), 0.1, 0);
  group.rotation.y = Math.random() * Math.PI * 2;

  group.userData = {
    strips,
    veil,
    flowOffset: Math.random() * Math.PI * 2,
    swayOffset: Math.random() * Math.PI * 2,
  };

  return group;
}

function createEnergyBridge() {
  const group = new THREE.Group();
  const stripes = [];
  const segmentCount = 44;

  RAINBOW_COLORS.forEach((hex, index) => {
    const positions = new Float32Array((segmentCount + 1) * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.userData.bandOffset = (index - (RAINBOW_COLORS.length - 1) / 2) * 0.1;
    line.userData.baseOpacity = material.opacity;
    stripes.push(line);
    group.add(line);
  });

  const haloPositions = new Float32Array((segmentCount + 1) * 3);
  const haloGeometry = new THREE.BufferGeometry();
  haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
  const halo = new THREE.Line(
    haloGeometry,
    new THREE.LineBasicMaterial({
      color: 0xf7efff,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.frustumCulled = false;
  halo.userData.baseOpacity = halo.material.opacity;
  group.add(halo);

  group.userData = {
    stripes,
    halo,
    segmentCount,
    shimmerOffset: Math.random() * Math.PI * 2,
  };

  return group;
}

function createIsland(index) {
  const group = new THREE.Group();
  group.name = `SpiritualIsland:${index}`;

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x3a3148,
    roughness: 0.98,
    metalness: 0.01,
    emissive: 0x10091a,
    emissiveIntensity: 0.18,
    flatShading: true,
  });
  const upperRockMat = new THREE.MeshStandardMaterial({
    color: 0x6f677e,
    roughness: 0.95,
    metalness: 0.02,
    emissive: 0x140e20,
    emissiveIntensity: 0.1,
    flatShading: true,
  });
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xc9cbb8,
    roughness: 0.92,
    metalness: 0.02,
    emissive: 0x51446a,
    emissiveIntensity: 0.04,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xf1e9ff,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x6c5a95,
    roughness: 0.98,
    metalness: 0,
    emissive: 0x201332,
    emissiveIntensity: 0.14,
  });

  const baseRadius = 1.55 + Math.random() * 1.7;
  const topRadius = baseRadius * (0.72 + Math.random() * 0.12);
  const height = 1.05 + Math.random() * 1.45;

  const lowerRock = new THREE.Mesh(
    new THREE.ConeGeometry(baseRadius * 1.02, height * 2.7, 7, 4),
    rockMat
  );
  lowerRock.position.y = -0.92;
  lowerRock.scale.set(0.92 + Math.random() * 0.22, 1, 0.92 + Math.random() * 0.22);
  lowerRock.rotation.y = Math.random() * Math.PI;
  lowerRock.castShadow = true;
  group.add(lowerRock);

  const coreMass = new THREE.Mesh(new THREE.DodecahedronGeometry(baseRadius * 0.92, 0), upperRockMat);
  coreMass.position.y = -0.05;
  coreMass.scale.set(1.2, 0.68, 1.15);
  coreMass.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
  coreMass.castShadow = true;
  group.add(coreMass);

  const ridgeCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      new THREE.DodecahedronGeometry(baseRadius * (0.22 + Math.random() * 0.18), 0),
      i % 2 === 0 ? rockMat : upperRockMat
    );
    const ang = (i / ridgeCount) * Math.PI * 2 + Math.random() * 0.35;
    const r = baseRadius * (0.45 + Math.random() * 0.28);
    ridge.position.set(Math.cos(ang) * r, -0.18 + Math.random() * 0.42, Math.sin(ang) * r);
    ridge.scale.set(1.15, 0.7 + Math.random() * 0.22, 1.05);
    ridge.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    ridge.castShadow = true;
    group.add(ridge);
  }

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius * 1.03, topRadius * 0.72, 0.34, 14),
    grassMat
  );
  top.position.y = 0.5;
  top.rotation.y = Math.random() * Math.PI;
  top.castShadow = true;
  group.add(top);

  const topRockPlate = new THREE.Mesh(new THREE.DodecahedronGeometry(topRadius * 1.02, 0), upperRockMat);
  topRockPlate.position.y = 0.3;
  topRockPlate.scale.set(1.18, 0.28, 1.12);
  topRockPlate.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
  topRockPlate.castShadow = true;
  group.add(topRockPlate);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(topRadius * 0.9, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    grassMat
  );
  crown.position.y = 0.52;
  crown.scale.y = 0.22;
  crown.castShadow = true;
  group.add(crown);

  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(baseRadius * 0.62, 10, 10), glowMat);
  coreGlow.position.y = -0.08;
  coreGlow.scale.set(1, 0.46, 1);
  group.add(coreGlow);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(baseRadius * 0.18, 0),
    new THREE.MeshBasicMaterial({
      color: 0xf4eeff,
      transparent: true,
      opacity: 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  crystal.position.y = 0.82;
  group.add(crystal);

  const vineCount = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < vineCount; i++) {
    const vine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.01, 1.0 + Math.random() * 1.8, 5),
      vineMat
    );
    const ang = (i / vineCount) * Math.PI * 2 + Math.random() * 0.3;
    const r = baseRadius * (0.22 + Math.random() * 0.42);
    vine.position.set(Math.cos(ang) * r, -1.18 - Math.random() * 0.45, Math.sin(ang) * r);
    vine.rotation.z = (Math.random() - 0.5) * 0.32;
    vine.rotation.x = (Math.random() - 0.5) * 0.2;
    group.add(vine);
  }

  const waterfalls = [];
  const waterfallCount = Math.random() > 0.35 ? 1 + Math.floor(Math.random() * 2) : 0;
  for (let i = 0; i < waterfallCount; i++) {
    const waterfall = createRainbowWaterfall(baseRadius);
    waterfall.rotation.y += (i / Math.max(1, waterfallCount)) * Math.PI * 1.2;
    group.add(waterfall);
    waterfalls.push(waterfall);
  }

  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius * 1.12, 0.022, 8, 40),
    new THREE.MeshBasicMaterial({
      color: 0xdccfff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  aura.rotation.x = Math.PI / 2;
  aura.position.y = 0.6;
  group.add(aura);

  group.userData.float = {
    bobOffset: Math.random() * Math.PI * 2,
    bobSpeed: 0.28 + Math.random() * 0.2,
    bobAmplitude: 0.22 + Math.random() * 0.28,
    driftOffset: Math.random() * Math.PI * 2,
    driftSpeed: 0.08 + Math.random() * 0.06,
    driftRadius: 0.35 + Math.random() * 0.45,
    yawSpeed: (Math.random() - 0.5) * 0.09,
  };

  group.userData.parts = { aura, crystal, coreGlow, waterfalls };
  group.userData.anchor = new THREE.Vector3();
  group.userData.bridgeAnchor = new THREE.Vector3(0, 0.72, 0);
  return group;
}

export function createSpiritualIslands({ count = 7, radius = 22, minHeight = 9, maxHeight = 18 } = {}) {
  const root = new THREE.Group();
  root.name = 'SpiritualFloatingIslands';

  const islands = [];
  const bridges = [];
  const bridgeRoot = new THREE.Group();
  bridgeRoot.name = 'SpiritualEnergyBridges';
  root.add(bridgeRoot);

  const driftState = {
    position: new THREE.Vector3(0, 0, 0),
    target: new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10),
    retargetTimer: 7,
  };

  let time = 0;

  for (let i = 0; i < count; i++) {
    const island = createIsland(i + 1);
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.55;
    const ring = 7 + Math.sqrt((i + 0.5) / count) * radius;
    const height = (minHeight + Math.random() * (maxHeight - minHeight)) * HEIGHT_FACTOR;

    island.userData.anchor.set(Math.cos(angle) * ring, height, Math.sin(angle) * ring);
    island.position.copy(island.userData.anchor);
    island.rotation.y = Math.random() * Math.PI * 2;

    root.add(island);
    islands.push(island);
  }

  for (let i = 0; i < islands.length; i++) {
    const from = islands[i];
    const to = islands[(i + 1) % islands.length];
    if (Math.random() < 0.15) continue;

    const bridge = createEnergyBridge();
    bridgeRoot.add(bridge);
    bridges.push({
      bridge,
      from,
      to,
      lift: 1.2 + Math.random() * 1.1,
      sway: 0.24 + Math.random() * 0.28,
      timeOffset: Math.random() * Math.PI * 2,
      fadeStart: 22 + Math.random() * 8,
      fadeEnd: 44 + Math.random() * 10,
    });
  }

  function updateDrift(delta) {
    driftState.retargetTimer -= delta;
    if (driftState.retargetTimer <= 0 || driftState.position.distanceToSquared(driftState.target) < 2) {
      driftState.target.set((Math.random() - 0.5) * 26, 0, (Math.random() - 0.5) * 26);
      driftState.retargetTimer = 8 + Math.random() * 8;
    }

    driftState.position.lerp(driftState.target, Math.min(1, delta * 0.12));
    root.position.x = driftState.position.x;
    root.position.z = driftState.position.z;
  }

  function updateBridges(focusPosition = null) {
    const sideVec = new THREE.Vector3();

    for (const descriptor of bridges) {
      const { bridge, from, to, lift, sway, timeOffset, fadeStart, fadeEnd } = descriptor;
      const { segmentCount, stripes, halo, shimmerOffset } = bridge.userData;

      const p0 = new THREE.Vector3().copy(from.position).add(from.userData.bridgeAnchor);
      const p2 = new THREE.Vector3().copy(to.position).add(to.userData.bridgeAnchor);
      const p1 = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
      p1.y += lift + Math.sin(time * 0.8 + timeOffset) * sway;

      const tangentStart = new THREE.Vector3().subVectors(p2, p0).normalize();
      sideVec.crossVectors(tangentStart, new THREE.Vector3(0, 1, 0)).normalize();
      if (sideVec.lengthSq() < 0.001) sideVec.set(1, 0, 0);

      stripes.forEach((stripe) => {
        const positions = stripe.geometry.getAttribute('position');
        const offset = sideVec.clone().multiplyScalar(stripe.userData.bandOffset);

        for (let i = 0; i <= segmentCount; i++) {
          const t = i / segmentCount;
          const p = quadraticBezier(p0, p1, p2, t).add(offset);
          positions.setXYZ(i, p.x, p.y, p.z);
        }
        positions.needsUpdate = true;
      });

      const haloPositions = halo.geometry.getAttribute('position');
      for (let i = 0; i <= segmentCount; i++) {
        const t = i / segmentCount;
        const p = quadraticBezier(p0, p1, p2, t);
        haloPositions.setXYZ(i, p.x, p.y, p.z);
      }
      haloPositions.needsUpdate = true;

      const bridgeMid = quadraticBezier(p0, p1, p2, 0.5).add(root.position);
      let distanceFade = 1;
      if (focusPosition) {
        const dist = bridgeMid.distanceTo(focusPosition);
        distanceFade = THREE.MathUtils.clamp(1 - (dist - fadeStart) / Math.max(1, fadeEnd - fadeStart), 0, 1);
      }

      const shimmer = 0.78 + Math.sin(time * 2.1 + shimmerOffset) * 0.14;
      stripes.forEach((stripe) => {
        stripe.material.opacity = stripe.userData.baseOpacity * shimmer * distanceFade;
      });
      halo.material.opacity = halo.userData.baseOpacity * shimmer * distanceFade;
      bridge.visible = distanceFade > 0.02;
    }
  }

  function update(delta, focusPosition = null) {
    time += delta;
    updateDrift(delta);

    for (const island of islands) {
      const motion = island.userData.float;
      const parts = island.userData.parts;
      const base = island.userData.anchor;
      const bob = Math.sin(time * motion.bobSpeed + motion.bobOffset) * motion.bobAmplitude;
      const driftX = Math.cos(time * motion.driftSpeed + motion.driftOffset) * motion.driftRadius;
      const driftZ = Math.sin(time * motion.driftSpeed * 1.13 + motion.driftOffset) * motion.driftRadius;

      island.position.x = base.x + driftX;
      island.position.y = base.y + bob;
      island.position.z = base.z + driftZ;
      island.rotation.y += delta * motion.yawSpeed;
      island.rotation.z = Math.sin(time * motion.bobSpeed + motion.bobOffset) * 0.018;

      parts.aura.rotation.z += delta * 0.15;
      parts.crystal.rotation.y += delta * 0.7;
      parts.crystal.rotation.x += delta * 0.22;
      const pulse = 0.9 + Math.sin(time * 1.5 + motion.bobOffset) * 0.08;
      parts.coreGlow.scale.set(pulse, 0.46 * pulse, pulse);

      for (const waterfall of parts.waterfalls) {
        const flow = waterfall.userData;
        waterfall.rotation.z = Math.sin(time * 0.75 + flow.swayOffset) * 0.03;
        flow.strips.forEach((strip, index) => {
          strip.material.opacity = 0.18 + Math.sin(time * 2.8 + flow.flowOffset + index * 0.45) * 0.06;
          strip.position.x = strip.userData.baseX + Math.sin(time * 1.4 + index + flow.flowOffset) * 0.012;
        });
        flow.veil.material.opacity = 0.06 + Math.sin(time * 1.5 + flow.flowOffset) * 0.02;
      }
    }

    updateBridges(focusPosition);
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isPoints && !node.isLine) return;
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return { root, update, dispose };
}
