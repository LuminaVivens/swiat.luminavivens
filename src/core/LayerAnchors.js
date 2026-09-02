import * as THREE from 'three';

function createGlowMaterial(color, opacity = 0.22) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createLabelSprite(text, color = '#e6f6ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 40px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.4, 1.35, 1);
  return sprite;
}

function createEnergeticPoint(position = new THREE.Vector3(18, 0, 12)) {
  const group = new THREE.Group();
  group.name = 'EnergeticPoint';
  group.position.copy(position);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.78, 0),
    new THREE.MeshBasicMaterial({
      color: 0x7be7ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  core.position.y = 1.8;
  group.add(core);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 18, 18),
    createGlowMaterial(0x55dfff, 0.16)
  );
  aura.position.copy(core.position);
  aura.scale.set(1, 1.2, 1);
  group.add(aura);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.05, 10, 64),
    createGlowMaterial(0x6be4ff, 0.38)
  );
  ringA.position.y = 1.72;
  ringA.rotation.x = Math.PI / 2.2;
  group.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.04, 10, 64),
    createGlowMaterial(0xc5f8ff, 0.2)
  );
  ringB.position.y = 1.72;
  ringB.rotation.set(Math.PI / 2.7, 0.5, 0);
  group.add(ringB);

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.18, 3.1, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x7fe8ff,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  column.position.y = 1.55;
  group.add(column);

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 2.6, 56),
    new THREE.MeshBasicMaterial({
      color: 0x55dfff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.02;
  group.add(baseRing);

  const label = createLabelSprite('Punkt Energetyczny', '#b8f3ff');
  label.position.set(0, 3.7, 0);
  group.add(label);

  const particleCount = 48;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.1 + Math.random() * 1.9;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.6 + Math.random() * 2.7;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: 0x9cf2ff,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(particles);

  let time = 0;
  function update(delta) {
    time += delta;
    core.rotation.y += delta * 0.7;
    core.rotation.x += delta * 0.22;
    core.position.y = 1.8 + Math.sin(time * 1.5) * 0.08;
    aura.position.y = core.position.y;
    aura.scale.setScalar(1.02 + Math.sin(time * 1.6) * 0.06);
    aura.scale.y *= 1.16;
    ringA.rotation.z += delta * 0.45;
    ringB.rotation.z -= delta * 0.32;
    baseRing.material.opacity = 0.16 + Math.sin(time * 1.2) * 0.05;
    label.material.opacity = 0.72 + Math.sin(time * 1.3) * 0.14;
    particles.rotation.y += delta * 0.12;
    column.material.opacity = 0.1 + Math.sin(time * 1.8) * 0.04;
  }

  function dispose() {
    group.traverse((node) => {
      if (!node.isMesh && !node.isPoints && !node.isSprite) return;
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    group.removeFromParent();
  }

  return { group, update, dispose };
}

function createSpiritualPoint(position = new THREE.Vector3(-18, 0, -10)) {
  const group = new THREE.Group();
  group.name = 'SpiritualPoint';
  group.position.copy(position);

  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.65, 0),
    new THREE.MeshBasicMaterial({
      color: 0xf3e8ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orb.position.y = 2.0;
  group.add(orb);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 18, 18),
    createGlowMaterial(0xe1c7ff, 0.15)
  );
  glow.position.copy(orb.position);
  glow.scale.set(1.1, 1.28, 1.1);
  group.add(glow);

  const haloA = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.04, 10, 64),
    createGlowMaterial(0xdcc2ff, 0.26)
  );
  haloA.position.y = 1.95;
  haloA.rotation.set(Math.PI / 2, 0, 0);
  group.add(haloA);

  const haloB = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.03, 10, 64),
    createGlowMaterial(0xffe9b8, 0.18)
  );
  haloB.position.y = 1.95;
  haloB.rotation.set(Math.PI / 2.6, 0.4, 0.2);
  group.add(haloB);

  const lotusBase = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 24),
    new THREE.MeshBasicMaterial({
      color: 0xedd7ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  lotusBase.rotation.x = -Math.PI / 2;
  lotusBase.position.y = 0.02;
  group.add(lotusBase);

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 2.8, 56),
    new THREE.MeshBasicMaterial({
      color: 0xe8d1ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.025;
  group.add(baseRing);

  const label = createLabelSprite('Punkt Duchowy', '#f1e5ff');
  label.position.set(0, 4.0, 0);
  group.add(label);

  const petalGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const petal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 1.35),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf2d8ff : 0xffefb8,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const angle = (i / 8) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.9, 0.45, Math.sin(angle) * 0.9);
    petal.rotation.y = -angle;
    petal.rotation.x = -Math.PI / 3.2;
    petalGroup.add(petal);
  }
  group.add(petalGroup);

  let time = 0;
  function update(delta) {
    time += delta;
    orb.rotation.y += delta * 0.55;
    orb.rotation.x += delta * 0.16;
    orb.position.y = 2.0 + Math.sin(time * 1.1) * 0.11;
    glow.position.y = orb.position.y;
    glow.scale.setScalar(1.04 + Math.sin(time * 1.4) * 0.06);
    glow.scale.y *= 1.14;
    haloA.rotation.z += delta * 0.18;
    haloB.rotation.z -= delta * 0.12;
    petalGroup.rotation.y += delta * 0.12;
    baseRing.material.opacity = 0.16 + Math.sin(time * 1.1) * 0.05;
    lotusBase.material.opacity = 0.12 + Math.sin(time * 1.5) * 0.04;
    label.material.opacity = 0.72 + Math.sin(time * 1.05) * 0.14;
  }

  function dispose() {
    group.traverse((node) => {
      if (!node.isMesh && !node.isPoints && !node.isSprite) return;
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    group.removeFromParent();
  }

  return { group, update, dispose };
}

export function createLayerAnchors() {
  const energeticPoint = createEnergeticPoint();
  const spiritualPoint = createSpiritualPoint();

  function update(delta) {
    energeticPoint.update(delta);
    spiritualPoint.update(delta);
  }

  function dispose() {
    energeticPoint.dispose();
    spiritualPoint.dispose();
  }

  return {
    energeticPoint,
    spiritualPoint,
    update,
    dispose,
  };
}
