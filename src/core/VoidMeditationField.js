import * as THREE from 'three';

function createGlowMaterial(color, opacity = 0.2) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function createSpriteTexture(inner = 'rgba(255,255,255,0.9)', outer = 'rgba(255,255,255,0)') {
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

function createRisingParticles() {
  const count = 120;
  const positions = new Float32Array(count * 3);
  const speeds = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 5.8;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.1 + Math.random() * 4.8;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds.push(0.15 + Math.random() * 0.35);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x9fe7ff,
    size: 0.08,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    map: createSpriteTexture('rgba(200,240,255,0.95)', 'rgba(200,240,255,0)'),
    alphaTest: 0.02,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.speeds = speeds;
  return points;
}

export function createVoidMeditationField() {
  const root = new THREE.Group();
  root.name = 'VoidMeditationField';

  const skyGroup = new THREE.Group();
  skyGroup.name = 'VoidDarkSky';
  root.add(skyGroup);

  const darkDome = new THREE.Mesh(
    new THREE.SphereGeometry(185, 36, 28),
    new THREE.MeshBasicMaterial({
      color: 0x020305,
      transparent: true,
      opacity: 0.96,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  skyGroup.add(darkDome);

  const innerHaze = new THREE.Mesh(
    new THREE.SphereGeometry(150, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0x09111b,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
  );
  skyGroup.add(innerHaze);

  const centerGroup = new THREE.Group();
  centerGroup.name = 'VoidCenterField';
  root.add(centerGroup);

  const floorAura = new THREE.Mesh(
    new THREE.CircleGeometry(6.8, 72),
    new THREE.MeshBasicMaterial({
      color: 0x0a1623,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  floorAura.rotation.x = -Math.PI / 2;
  floorAura.position.y = 0.01;
  centerGroup.add(floorAura);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(5.6, 6.15, 72),
    createGlowMaterial(0x1c79c9, 0.18)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.02;
  centerGroup.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.55, 56),
    createGlowMaterial(0x67d4ff, 0.28)
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.03;
  centerGroup.add(innerRing);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshBasicMaterial({
      color: 0x80d8ff,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  crystal.position.y = 1.6;
  crystal.scale.set(1, 1.45, 1);
  centerGroup.add(crystal);

  const crystalCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshBasicMaterial({
      color: 0xe6fbff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  crystalCore.position.copy(crystal.position);
  centerGroup.add(crystalCore);

  const glowShell = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 18, 18),
    createGlowMaterial(0x61cfff, 0.14)
  );
  glowShell.position.set(0, 1.55, 0);
  glowShell.scale.set(1, 1.4, 1);
  centerGroup.add(glowShell);

  const verticalBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.52, 7.5, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x70d8ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  verticalBeam.position.y = 3.2;
  centerGroup.add(verticalBeam);

  const beamCap = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 28),
    createGlowMaterial(0xb7f0ff, 0.18)
  );
  beamCap.rotation.x = -Math.PI / 2;
  beamCap.position.y = 0.05;
  centerGroup.add(beamCap);

  const haloA = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.03, 8, 56),
    createGlowMaterial(0x7dd7ff, 0.24)
  );
  haloA.position.y = 1.65;
  haloA.rotation.set(Math.PI / 2.2, 0, 0);
  centerGroup.add(haloA);

  const haloB = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.022, 8, 64),
    createGlowMaterial(0xc7efff, 0.12)
  );
  haloB.position.y = 1.8;
  haloB.rotation.set(Math.PI / 2.75, 0.4, 0.2);
  centerGroup.add(haloB);

  const particles = createRisingParticles();
  centerGroup.add(particles);

  let time = 0;

  function update(delta, focusPosition = null) {
    time += delta;

    if (focusPosition) {
      skyGroup.position.x = focusPosition.x;
      skyGroup.position.z = focusPosition.z;
    }

    darkDome.material.opacity = 0.94 + Math.sin(time * 0.12) * 0.015;
    innerHaze.material.opacity = 0.14 + Math.sin(time * 0.2 + 0.7) * 0.03;

    crystal.rotation.y += delta * 0.58;
    crystal.rotation.x += delta * 0.12;
    crystal.position.y = 1.55 + Math.sin(time * 1.1) * 0.08;
    crystalCore.position.copy(crystal.position);
    crystalCore.rotation.y -= delta * 0.82;
    glowShell.position.y = crystal.position.y;

    const pulse = 1 + Math.sin(time * 1.65) * 0.08;
    glowShell.scale.set(1.0 * pulse, 1.4 * pulse, 1.0 * pulse);
    verticalBeam.material.opacity = 0.11 + Math.sin(time * 1.25 + 1.3) * 0.03;
    outerRing.material.opacity = 0.14 + Math.sin(time * 1.05) * 0.03;
    innerRing.material.opacity = 0.22 + Math.sin(time * 1.45 + 0.4) * 0.05;
    haloA.rotation.z += delta * 0.18;
    haloB.rotation.z -= delta * 0.11;

    const positions = particles.geometry.getAttribute('position');
    const speeds = particles.userData.speeds;
    for (let i = 0; i < positions.count; i++) {
      let x = positions.getX(i);
      let y = positions.getY(i);
      let z = positions.getZ(i);
      const speed = speeds[i];
      y += delta * speed;
      x += Math.sin(time * 0.9 + i * 0.13) * delta * 0.04;
      z += Math.cos(time * 0.7 + i * 0.11) * delta * 0.04;
      if (y > 5.8) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 5.8;
        x = Math.cos(angle) * radius;
        y = 0.12;
        z = Math.sin(angle) * radius;
      }
      positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
    particles.material.opacity = 0.28 + Math.sin(time * 0.9) * 0.04;
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isPoints) return;
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return { root, update, dispose };
}
