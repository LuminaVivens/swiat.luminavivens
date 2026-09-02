import * as THREE from 'three';

function glowMaterial(color, opacity = 0.16) {
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
  g.addColorStop(0, 'rgba(200,220,255,0.95)');
  g.addColorStop(0.35, 'rgba(100,135,255,0.5)');
  g.addColorStop(1, 'rgba(30,45,130,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPrompt(text, color = '#bac7ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 32px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
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

function makeRevealMaterial(color, maxOpacity = 0.52, wireframe = true) {
  const material = new THREE.MeshBasicMaterial({
    color,
    wireframe,
    transparent: true,
    opacity: 0.01,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  material.userData.maxOpacity = maxOpacity;
  return material;
}

export function createDarknessFieldRealm(scene, {
  center = new THREE.Vector3(145, 0, -145),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:PoleCiemnosci';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 12));
  const localReturnPortal = new THREE.Vector3(0, 0, 18);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(68, 40, 26),
    new THREE.MeshBasicMaterial({
      color: 0x010205,
      transparent: true,
      opacity: 0.992,
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
      color: 0x010204,
      roughness: 0.96,
      metalness: 0.05,
      emissive: 0x02030a,
      emissiveIntensity: 0.06,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  root.add(floor);

  // Centralny emiter fali: ledwo widoczny, żeby nie zamienić ciemności w scenę świetlną.
  const source = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.48, 0),
    new THREE.MeshBasicMaterial({
      color: 0x8aa2ff,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  source.position.y = 0.65;
  root.add(source);

  const sourceAura = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 16, 16),
    glowMaterial(0x637cff, 0.045)
  );
  sourceAura.position.copy(source.position);
  root.add(sourceAura);

  // Pierścień-sonar poruszający się po podłożu.
  const waveRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.08, 128),
    glowMaterial(0x8197ff, 0.0)
  );
  waveRing.rotation.x = -Math.PI / 2;
  waveRing.position.y = 0.035;
  root.add(waveRing);

  const revealables = [];
  function addRevealable(mesh) {
    mesh.userData.revealRadius = Math.hypot(mesh.position.x, mesh.position.z);
    revealables.push(mesh);
    root.add(mesh);
    return mesh;
  }

  // Ukryte filary. Przy każdej fali wyłaniają się na sekundę z czerni.
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + (i % 2) * 0.13;
    const radius = 7.5 + (i % 4) * 3.2;
    const height = 2.6 + (i % 5) * 1.15;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3 + (i % 3) * 0.08, 0.5, height, 6),
      makeRevealMaterial(i % 3 === 0 ? 0xa5b5ff : 0x6577d8, 0.46, true)
    );
    pillar.position.set(Math.cos(angle) * radius, height * 0.5, Math.sin(angle) * radius);
    pillar.rotation.y = angle * 0.7;
    addRevealable(pillar);
  }

  // Wielkie łuki i ramy, które dopiero fala zdradza w oddali.
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.35;
    const radius = 11 + i * 2.1;
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(2.0 + i * 0.22, 0.05, 8, 70, Math.PI),
      makeRevealMaterial(i % 2 === 0 ? 0xb7c2ff : 0x778bdc, 0.36, false)
    );
    arc.position.set(Math.cos(angle) * radius, 2.1 + (i % 2) * 1.1, Math.sin(angle) * radius);
    arc.rotation.set(0, -angle + Math.PI / 2, Math.PI / 2);
    addRevealable(arc);
  }

  // Geometryczne symbole rozsiane wokół środka.
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.18;
    const radius = 5.4 + i * 2.1;
    const symbol = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58 + (i % 3) * 0.16, 0),
      makeRevealMaterial(i % 2 === 0 ? 0xe0e5ff : 0x91a1ff, 0.55, true)
    );
    symbol.position.set(Math.cos(angle) * radius, 1.0 + (i % 4) * 0.7, Math.sin(angle) * radius);
    symbol.userData.spin = (i % 2 ? -1 : 1) * (0.08 + i * 0.01);
    addRevealable(symbol);
  }

  // Punkty widoczne tylko w śladzie fali.
  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  const radial = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.sqrt(Math.random()) * 25;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.15 + Math.random() * 5.5;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    radial[i] = radius;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    map: createSoftTexture(),
    color: 0x8ea2ff,
    size: 0.1,
    transparent: true,
    opacity: 0.01,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    alphaTest: 0.02,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  root.add(particles);

  const returnPortal = new THREE.Group();
  returnPortal.position.copy(localReturnPortal);
  root.add(returnPortal);

  const returnRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.08, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0x9eacff,
      emissive: 0x4056c0,
      emissiveIntensity: 0.52,
      roughness: 0.28,
      metalness: 0.42,
      transparent: true,
      opacity: 0.48,
    })
  );
  returnRing.position.y = 1.5;
  returnRing.rotation.y = Math.PI / 2;
  returnPortal.add(returnRing);

  const returnFill = new THREE.Mesh(
    new THREE.CircleGeometry(1.42, 40),
    glowMaterial(0x6175df, 0.055)
  );
  returnFill.position.y = 1.5;
  returnFill.rotation.y = Math.PI / 2;
  returnPortal.add(returnFill);

  const returnLight = new THREE.PointLight(0x6578e5, 0.28, 6, 2);
  returnLight.position.y = 1.5;
  returnPortal.add(returnLight);

  const { sprite: prompt, material: promptMaterial } = createPrompt('WEJDŹ W BRAMĘ, ABY WRÓCIĆ');
  prompt.position.set(0, 3.7, 0);
  returnPortal.add(prompt);

  let time = 0;
  let returnNear = false;
  let promptOpacity = 0;
  const portalWorldPosition = new THREE.Vector3();
  const WAVE_DURATION = 7.0;
  const WAVE_MAX_RADIUS = 28;
  const WAVE_WIDTH = 2.7;

  function update(delta, avatarPosition = null, active = false) {
    time += delta;

    source.rotation.y += delta * 0.25;
    source.rotation.x = Math.sin(time * 0.45) * 0.08;
    source.material.opacity = 0.18 + Math.sin(time * 1.2) * 0.05;
    sourceAura.material.opacity = 0.03 + Math.sin(time * 1.0) * 0.015;

    const waveT = (time % WAVE_DURATION) / WAVE_DURATION;
    const waveRadius = waveT * WAVE_MAX_RADIUS;
    waveRing.scale.setScalar(Math.max(0.15, waveRadius));
    const waveEnvelope = Math.sin(Math.PI * waveT);
    waveRing.material.opacity = active ? 0.18 * waveEnvelope : 0;

    revealables.forEach((mesh, index) => {
      const dist = Math.abs(mesh.userData.revealRadius - waveRadius);
      const reveal = Math.max(0, 1 - dist / WAVE_WIDTH);
      const afterglow = Math.max(0, 1 - dist / (WAVE_WIDTH * 2.2)) * 0.18;
      const maxOpacity = mesh.material.userData.maxOpacity ?? 0.5;
      mesh.material.opacity = active ? 0.006 + maxOpacity * (reveal + afterglow) : 0.001;
      if (mesh.userData.spin) mesh.rotation.y += delta * mesh.userData.spin;
      if (mesh.geometry.type === 'IcosahedronGeometry') {
        const s = 0.92 + reveal * 0.18 + Math.sin(time * 0.8 + index) * 0.02;
        mesh.scale.setScalar(s);
      }
    });

    // Uśredniona widoczność cząstek zgodna z aktualnym promieniem fali.
    let particleReveal = 0;
    const sampleStep = 10;
    for (let i = 0; i < particleCount; i += sampleStep) {
      particleReveal = Math.max(particleReveal, 1 - Math.abs(radial[i] - waveRadius) / WAVE_WIDTH);
    }
    particleMat.opacity = active ? Math.max(0.006, Math.min(0.28, particleReveal * 0.22)) : 0.001;
    particles.rotation.y += delta * 0.006;

    returnRing.rotation.z -= delta * 0.11;
    returnFill.material.opacity = 0.035 + Math.sin(time * 1.1) * 0.015;
    returnLight.intensity = 0.22 + Math.sin(time * 0.9) * 0.06;

    returnNear = false;
    if (active && avatarPosition) {
      returnPortal.getWorldPosition(portalWorldPosition);
      returnNear = Math.hypot(
        avatarPosition.x - portalWorldPosition.x,
        avatarPosition.z - portalWorldPosition.z
      ) <= 5.2;
    }

    const targetPrompt = returnNear ? 0.82 : 0;
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
