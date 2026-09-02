import * as THREE from 'three';

function createSoftSpriteTexture(inner = 'rgba(255,255,255,0.85)', outer = 'rgba(255,255,255,0)') {
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

function createSpiritualStars(count = 1000, radius = 155) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [0xf8ecff, 0xc7f0ff, 0xd7c5ff, 0xffefc7, 0x9fe3ff];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.92);
    const r = radius * (0.78 + Math.random() * 0.18);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.72 + 18;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const c = new THREE.Color(palette[i % palette.length]);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.15,
    map: createSoftSpriteTexture('rgba(255,255,255,0.95)', 'rgba(255,255,255,0)'),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    fog: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    alphaTest: 0.02,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

function createNebula(innerColor = 'rgba(219,182,255,0.22)', outerColor = 'rgba(219,182,255,0)') {
  const size = 38 + Math.random() * 30;
  const material = new THREE.MeshBasicMaterial({
    map: createSoftSpriteTexture(innerColor, outerColor),
    transparent: true,
    opacity: 0.26 + Math.random() * 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size * (0.48 + Math.random() * 0.25)), material);
  plane.userData = {
    baseOpacity: material.opacity,
    spin: (Math.random() - 0.5) * 0.03,
    pulseOffset: Math.random() * Math.PI * 2,
  };
  return plane;
}

function createHaloCloud(radius = 16 + Math.random() * 10) {
  const geometry = new THREE.RingGeometry(radius * 0.72, radius, 72);
  const material = new THREE.MeshBasicMaterial({
    color: Math.random() > 0.5 ? 0xd9c5ff : 0xbddfff,
    transparent: true,
    opacity: 0.06 + Math.random() * 0.05,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = {
    baseOpacity: material.opacity,
    spin: (Math.random() - 0.5) * 0.025,
    pulseOffset: Math.random() * Math.PI * 2,
  };
  return mesh;
}

export function createSpiritualSky() {
  const root = new THREE.Group();
  root.name = 'SpiritualSky';

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(180, 36, 28),
    new THREE.MeshBasicMaterial({
      color: 0x140826,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  dome.userData.baseOpacity = dome.material.opacity;
  root.add(dome);

  const stars = createSpiritualStars(1150, 170);
  root.add(stars);

  const nebulaGroup = new THREE.Group();
  const nebulaPalette = [
    ['rgba(223,191,255,0.24)', 'rgba(223,191,255,0)'],
    ['rgba(173,224,255,0.22)', 'rgba(173,224,255,0)'],
    ['rgba(255,220,170,0.18)', 'rgba(255,220,170,0)'],
    ['rgba(196,167,255,0.22)', 'rgba(196,167,255,0)'],
  ];
  for (let i = 0; i < 8; i++) {
    const nebula = createNebula(...nebulaPalette[i % nebulaPalette.length]);
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.35;
    const r = 78 + Math.random() * 55;
    const y = 32 + Math.random() * 38;
    nebula.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    nebula.lookAt(0, y, 0);
    nebulaGroup.add(nebula);
  }
  root.add(nebulaGroup);

  const haloGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const halo = createHaloCloud();
    const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
    const r = 60 + Math.random() * 55;
    const y = 48 + Math.random() * 34;
    halo.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    halo.rotation.x = Math.PI / 2.3 + (Math.random() - 0.5) * 0.35;
    halo.rotation.y = Math.random() * Math.PI * 2;
    haloGroup.add(halo);
  }
  root.add(haloGroup);

  let time = 0;

  function update(delta) {
    time += delta;
    root.rotation.y += delta * 0.004;

    dome.material.opacity = dome.userData.baseOpacity + Math.sin(time * 0.2) * 0.04;
    stars.material.opacity = 0.66 + Math.sin(time * 0.35) * 0.08;

    nebulaGroup.children.forEach((nebula, index) => {
      nebula.rotation.z += delta * (nebula.userData.spin || 0.01);
      nebula.material.opacity = nebula.userData.baseOpacity + Math.sin(time * 0.45 + nebula.userData.pulseOffset + index * 0.3) * 0.05;
    });

    haloGroup.children.forEach((halo, index) => {
      halo.rotation.z += delta * (halo.userData.spin || 0.01);
      halo.material.opacity = halo.userData.baseOpacity + Math.sin(time * 0.6 + halo.userData.pulseOffset + index * 0.5) * 0.025;
    });
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isPoints) return;
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return { root, update, dispose };
}
