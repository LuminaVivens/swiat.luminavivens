import * as THREE from 'three';

function createSoftNodeMaterial(color, opacity = 0.75) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createLineMaterial(color, opacity) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function buildLineGeometry(axis, offset, halfSize, segments) {
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const span = -halfSize + t * (halfSize * 2);
    const x = axis === 'x' ? span : offset;
    const z = axis === 'z' ? span : offset;
    positions[i * 3] = x;
    positions[i * 3 + 1] = 0.04;
    positions[i * 3 + 2] = z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function createPulse(color = 0xbef6ff) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), material);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 10),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  mesh.add(glow);
  mesh.userData.glow = glow;
  return mesh;
}

function createBurstParticleMaterial() {
  return new THREE.PointsMaterial({
    color: 0xeafcff,
    size: 0.11,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
}

function createHexPatternTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const size = 26;
  const dx = Math.sqrt(3) * size;
  const dy = size * 1.5;

  ctx.strokeStyle = 'rgba(230,250,255,0.9)';
  ctx.lineWidth = 2.4;
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(140, 230, 255, 0.7)';

  function drawHex(cx, cy) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 6 + i * (Math.PI / 3);
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  for (let row = -2; row < 16; row++) {
    for (let col = -2; col < 16; col++) {
      const x = col * dx + (row % 2) * (dx / 2);
      const y = row * dy;
      drawHex(x, y);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.6, 1.6);
  texture.needsUpdate = true;
  return texture;
}

export function createEnergeticFlowField({ gridRadius = 6, cellSize = 5.5 } = {}) {
  const root = new THREE.Group();
  root.name = 'EnergeticFlowField';

  const halfSize = gridRadius * cellSize;
  const segments = gridRadius * 2;
  const lines = [];
  const nodes = [];
  const pulseDescriptors = [];
  const bursts = [];
  const pulseLayer = new THREE.Group();
  const burstLayer = new THREE.Group();
  root.add(pulseLayer);
  root.add(burstLayer);

  const SHIELD_RADIUS = 3.25;
  const SHIELD_MARGIN = 0.9;
  const SHIELD_FLASH_DURATION = 1.0;
  const shieldState = {
    impact: 0,
    flash: 0,
    lastImpactAt: 0,
  };
  const baseRingAColor = new THREE.Color(0x62dbff);
  const baseRingBColor = new THREE.Color(0xc1f5ff);
  const hitRingColor = new THREE.Color(0xfff2b5);
  const baseDomeColor = new THREE.Color(0x9adfff);
  const brightDomeColor = new THREE.Color(0xf6f8ff);

  // Główna siatka X/Z
  for (let i = -gridRadius; i <= gridRadius; i++) {
    const offset = i * cellSize;

    const xLine = new THREE.Line(
      buildLineGeometry('x', offset, halfSize, segments * 4),
      createLineMaterial(i === 0 ? 0xbef6ff : 0x59d7ff, i === 0 ? 0.34 : 0.18)
    );
    xLine.userData = {
      axis: 'x',
      offset,
      baseOpacity: xLine.material.opacity,
      waveOffset: Math.random() * Math.PI * 2,
      emphasis: i === 0 ? 1.4 : 1,
    };
    root.add(xLine);
    lines.push(xLine);

    const zLine = new THREE.Line(
      buildLineGeometry('z', offset, halfSize, segments * 4),
      createLineMaterial(i === 0 ? 0xd8fbff : 0x3fc2ff, i === 0 ? 0.32 : 0.16)
    );
    zLine.userData = {
      axis: 'z',
      offset,
      baseOpacity: zLine.material.opacity,
      waveOffset: Math.random() * Math.PI * 2,
      emphasis: i === 0 ? 1.35 : 1,
    };
    root.add(zLine);
    lines.push(zLine);
  }

  // Węzły na skrzyżowaniach — omijają środek pola avatara.
  for (let gx = -gridRadius; gx <= gridRadius; gx++) {
    for (let gz = -gridRadius; gz <= gridRadius; gz++) {
      const px = gx * cellSize;
      const pz = gz * cellSize;
      if (Math.hypot(px, pz) < SHIELD_RADIUS + 0.55) continue;

      const major = gx === 0 || gz === 0;
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(major ? 0.16 : 0.1, 10, 10),
        createSoftNodeMaterial(major ? 0xe8fdff : 0x8ceeff, major ? 0.62 : 0.38)
      );
      node.position.set(px, 0.06, pz);
      node.userData = {
        baseY: 0.06,
        pulseOffset: Math.random() * Math.PI * 2,
        major,
      };
      root.add(node);
      nodes.push(node);
    }
  }

  // Pole avatara reagujące na kontakt energii.
  const centerRingA = new THREE.Mesh(
    new THREE.RingGeometry(3.2, 3.7, 80),
    new THREE.MeshBasicMaterial({
      color: 0x62dbff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  centerRingA.rotation.x = -Math.PI / 2;
  centerRingA.position.y = 0.02;
  root.add(centerRingA);

  const centerRingB = new THREE.Mesh(
    new THREE.RingGeometry(7.4, 7.75, 96),
    new THREE.MeshBasicMaterial({
      color: 0xc1f5ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  centerRingB.rotation.x = -Math.PI / 2;
  centerRingB.position.y = 0.018;
  root.add(centerRingB);

  const shieldDome = new THREE.Mesh(
    new THREE.SphereGeometry(SHIELD_RADIUS * 1.05, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshBasicMaterial({
      color: 0x9adfff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  shieldDome.position.y = 0.02;
  root.add(shieldDome);

  const shieldHexDome = new THREE.Mesh(
    new THREE.SphereGeometry(SHIELD_RADIUS * 1.052, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshBasicMaterial({
      color: 0xf6fbff,
      map: createHexPatternTexture(),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  shieldHexDome.position.y = 0.025;
  root.add(shieldHexDome);

  const shieldHalo = new THREE.Mesh(
    new THREE.RingGeometry(SHIELD_RADIUS * 0.98, SHIELD_RADIUS * 1.04, 72),
    new THREE.MeshBasicMaterial({
      color: 0xf2fbff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  shieldHalo.rotation.x = -Math.PI / 2;
  shieldHalo.position.y = 0.03;
  root.add(shieldHalo);

  function triggerShieldImpact(localPos) {
    shieldState.impact = Math.min(1.25, shieldState.impact + 0.48);
    shieldState.flash = 1;
    shieldState.lastImpactAt = performance.now() * 0.001;

    const particleCount = 12 + Math.floor(Math.random() * 6);
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = localPos.x;
      positions[i * 3 + 1] = 0.12 + Math.random() * 0.24;
      positions[i * 3 + 2] = localPos.z;

      const angle = Math.atan2(localPos.z, localPos.x) + (Math.random() - 0.5) * 1.3;
      const speed = 0.8 + Math.random() * 1.5;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        0.3 + Math.random() * 0.6,
        Math.sin(angle) * speed
      ));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, createBurstParticleMaterial());
    burstLayer.add(points);
    bursts.push({ points, velocities, life: 0.55 + Math.random() * 0.18, age: 0 });
  }

  // Ruchome impulsy po siatce
  const pulseCount = 18;
  for (let i = 0; i < pulseCount; i++) {
    const pulse = createPulse(i % 3 === 0 ? 0xe5fcff : i % 2 === 0 ? 0x88ebff : 0xbaf4ff);
    pulseLayer.add(pulse);

    const horizontal = Math.random() > 0.5;
    pulseDescriptors.push({
      mesh: pulse,
      axis: horizontal ? 'x' : 'z',
      lane: (-gridRadius + Math.floor(Math.random() * (gridRadius * 2 + 1))) * cellSize,
      t: Math.random(),
      speed: 0.05 + Math.random() * 0.08,
      dir: Math.random() > 0.5 ? 1 : -1,
      offset: Math.random() * Math.PI * 2,
      cooldown: 0,
    });
  }

  function retargetPulse(descriptor) {
    const horizontal = Math.random() > 0.5;
    descriptor.axis = horizontal ? 'x' : 'z';
    descriptor.lane = (-gridRadius + Math.floor(Math.random() * (gridRadius * 2 + 1))) * cellSize;
    descriptor.t = descriptor.dir > 0 ? 0 : 1;
    descriptor.speed = 0.05 + Math.random() * 0.08;
    descriptor.offset = Math.random() * Math.PI * 2;
  }

  function popPulse(descriptor, localPos) {
    descriptor.cooldown = 0.22 + Math.random() * 0.24;
    descriptor.mesh.visible = false;
    triggerShieldImpact(localPos);
    descriptor.dir = Math.random() > 0.5 ? 1 : -1;
    retargetPulse(descriptor);
  }

  function updateLines(time) {
    for (const line of lines) {
      const pos = line.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const span = line.userData.axis === 'x' ? x : z;
        const wave = Math.sin(time * 1.3 + span * 0.18 + line.userData.waveOffset) * 0.06;
        const shimmer = Math.cos(time * 1.8 + span * 0.1 + line.userData.waveOffset) * 0.03;
        pos.setY(i, 0.035 + wave + shimmer);
      }
      pos.needsUpdate = true;
      line.material.opacity = line.userData.baseOpacity + Math.sin(time * 1.7 + line.userData.waveOffset) * 0.04 * line.userData.emphasis;
    }
  }

  function updateNodes(time) {
    for (const node of nodes) {
      const amp = node.userData.major ? 0.08 : 0.04;
      const pulse = 1 + Math.sin(time * (node.userData.major ? 1.9 : 1.3) + node.userData.pulseOffset) * (node.userData.major ? 0.35 : 0.18);
      node.position.y = node.userData.baseY + Math.sin(time * 1.1 + node.userData.pulseOffset) * amp;
      node.scale.setScalar(pulse);
      node.material.opacity = (node.userData.major ? 0.48 : 0.28) + Math.sin(time * 1.5 + node.userData.pulseOffset) * 0.08;
    }
  }

  function updateBursts(delta) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i];
      burst.age += delta;
      const t = burst.age / burst.life;
      const positions = burst.points.geometry.getAttribute('position');

      for (let p = 0; p < burst.velocities.length; p++) {
        const velocity = burst.velocities[p];
        positions.setXYZ(
          p,
          positions.getX(p) + velocity.x * delta,
          positions.getY(p) + velocity.y * delta,
          positions.getZ(p) + velocity.z * delta
        );
        velocity.multiplyScalar(0.985);
        velocity.y -= 0.8 * delta;
      }
      positions.needsUpdate = true;
      burst.points.material.opacity = Math.max(0, 0.95 * (1 - t));
      burst.points.scale.setScalar(1 + t * 0.6);

      if (t >= 1) {
        burstLayer.remove(burst.points);
        burst.points.geometry.dispose();
        burst.points.material.dispose();
        bursts.splice(i, 1);
      }
    }
  }

  function updateShield(time, delta) {
    shieldState.impact = Math.max(0, shieldState.impact - delta * 1.25);
    shieldState.flash = Math.max(0, shieldState.flash - delta / SHIELD_FLASH_DURATION);

    const impact = shieldState.impact;
    const flash = shieldState.flash;

    centerRingA.rotation.z += delta * 0.08;
    centerRingB.rotation.z -= delta * 0.045;

    centerRingA.material.opacity = 0.14 + Math.sin(time * 1.2) * 0.04 - impact * 0.05;
    centerRingB.material.opacity = 0.07 + Math.sin(time * 0.9 + 0.7) * 0.025 + impact * 0.05;
    centerRingA.material.color.copy(baseRingAColor).lerp(hitRingColor, Math.min(1, impact * 0.75));
    centerRingB.material.color.copy(baseRingBColor).lerp(hitRingColor, Math.min(1, impact * 0.45));

    shieldHalo.material.opacity = flash * 0.16;
    shieldHalo.material.color.copy(baseRingAColor).lerp(hitRingColor, Math.min(1, impact));

    shieldDome.material.opacity = flash * 0.15;
    shieldDome.material.color.copy(baseDomeColor).lerp(brightDomeColor, Math.min(1, impact * 0.8));

    shieldHexDome.material.opacity = flash * 0.22;
    shieldHexDome.material.color.copy(baseDomeColor).lerp(brightDomeColor, Math.min(1, 0.45 + impact * 0.55));

    const domeScale = 1 + impact * 0.05 + Math.sin(time * 5) * impact * 0.01;
    shieldDome.scale.set(domeScale, domeScale * (1 + impact * 0.05), domeScale);
    shieldHexDome.scale.set(domeScale * 1.002, domeScale * (1 + impact * 0.05) * 1.002, domeScale * 1.002);
  }

  function updatePulses(delta, time) {
    for (const descriptor of pulseDescriptors) {
      if (descriptor.cooldown > 0) {
        descriptor.cooldown -= delta;
        if (descriptor.cooldown <= 0) descriptor.mesh.visible = true;
        continue;
      }

      descriptor.t += descriptor.speed * delta * descriptor.dir;
      if (descriptor.t > 1 || descriptor.t < 0) {
        descriptor.dir *= -1;
        retargetPulse(descriptor);
      }

      const span = -halfSize + descriptor.t * (halfSize * 2);
      let x = 0;
      let z = 0;
      if (descriptor.axis === 'x') {
        x = span;
        z = descriptor.lane;
      } else {
        x = descriptor.lane;
        z = span;
      }

      const dist = Math.hypot(x, z);
      if (dist < SHIELD_RADIUS + SHIELD_MARGIN) {
        const norm = new THREE.Vector2(x, z).normalize();
        const impactPoint = new THREE.Vector3(
          norm.lengthSq() < 0.0001 ? SHIELD_RADIUS : norm.x * SHIELD_RADIUS,
          0.08,
          norm.lengthSq() < 0.0001 ? 0 : norm.y * SHIELD_RADIUS
        );
        popPulse(descriptor, impactPoint);
        continue;
      }

      const y = 0.1 + Math.sin(time * 4 + descriptor.offset + span * 0.12) * 0.06;
      descriptor.mesh.position.set(x, y, z);
      const pulseScale = 0.8 + Math.sin(time * 2.8 + descriptor.offset) * 0.18;
      descriptor.mesh.scale.setScalar(pulseScale);
      descriptor.mesh.material.opacity = 0.64 + Math.sin(time * 3.1 + descriptor.offset) * 0.12;
      const glow = descriptor.mesh.userData.glow;
      if (glow) glow.material.opacity = 0.18 + Math.sin(time * 2.6 + descriptor.offset) * 0.07;
    }
  }

  function update(delta, focusPosition = null) {
    const time = performance.now() * 0.001;

    if (focusPosition) {
      root.position.x = focusPosition.x;
      root.position.z = focusPosition.z;
    }

    updateShield(time, delta);
    updateLines(time);
    updateNodes(time);
    updatePulses(delta, time);
    updateBursts(delta);
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isLine && !node.isPoints) return;
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return { root, update, dispose };
}
