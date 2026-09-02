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
  g.addColorStop(0, 'rgba(255,246,205,0.95)');
  g.addColorStop(0.32, 'rgba(220,180,255,0.55)');
  g.addColorStop(1, 'rgba(150,90,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createPrompt(text, color = '#e9d8ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 34px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#b58cff';
  ctx.fillStyle = color;
  ctx.fillText(text, 320, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.8, 0.95, 1);
  sprite.renderOrder = 1150;
  return { sprite, material };
}

export function createElarionRealm(scene, {
  center = new THREE.Vector3(-145, 0, 0),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:Elarion';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 12));
  const localReturnPortal = new THREE.Vector3(0, 0, 18);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(64, 36, 24),
    new THREE.MeshBasicMaterial({
      color: 0x08040f,
      transparent: true,
      opacity: 0.94,
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
      color: 0x09060f,
      roughness: 0.62,
      metalness: 0.28,
      emissive: 0x15091f,
      emissiveIntensity: 0.22,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  root.add(floor);

  const fieldRing = new THREE.Mesh(
    new THREE.RingGeometry(9.5, 10.0, 96),
    glowMaterial(0xb988ff, 0.14)
  );
  fieldRing.rotation.x = -Math.PI / 2;
  fieldRing.position.y = 0.03;
  root.add(fieldRing);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(18.4, 18.58, 112),
    glowMaterial(0xd7b2ff, 0.07)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.025;
  root.add(outerRing);

  // Rdzeń Elarionu: geometryczny znak światła, nie gotowy model.
  const core = new THREE.Group();
  core.position.y = 2.0;
  root.add(core);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.05, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf7eac2,
      emissive: 0xc495ff,
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92,
    })
  );
  crystal.scale.set(0.9, 1.55, 0.9);
  core.add(crystal);

  const coreAura = new THREE.Mesh(
    new THREE.SphereGeometry(1.65, 20, 20),
    glowMaterial(0xb778ff, 0.12)
  );
  coreAura.scale.set(1, 1.18, 1);
  core.add(coreAura);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.035, 9, 72),
    glowMaterial(0xffe89a, 0.28)
  );
  ringA.rotation.x = Math.PI / 2.25;
  core.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(3.05, 0.025, 9, 84),
    glowMaterial(0xba8cff, 0.2)
  );
  ringB.rotation.set(Math.PI / 2.75, 0.45, 0.15);
  core.add(ringB);

  const ringC = new THREE.Mesh(
    new THREE.TorusGeometry(4.1, 0.018, 8, 96),
    glowMaterial(0xe7d4ff, 0.09)
  );
  ringC.rotation.set(Math.PI / 3.1, -0.35, 0.5);
  core.add(ringC);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.58, 8.5, 18, 1, true),
    glowMaterial(0xc593ff, 0.09)
  );
  beam.position.y = 4.05;
  root.add(beam);

  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.5 + Math.sqrt(Math.random()) * 18;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.2 + Math.random() * 9;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds[i] = 0.08 + Math.random() * 0.22;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      map: createSoftTexture(),
      color: 0xe2c5ff,
      size: 0.11,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.02,
    })
  );
  particles.userData.speeds = speeds;
  root.add(particles);

  // Brama powrotna
  const returnPortal = new THREE.Group();
  returnPortal.position.copy(localReturnPortal);
  root.add(returnPortal);

  const returnRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.075, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0xf0e5ff,
      emissive: 0xb684ff,
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.38,
      transparent: true,
      opacity: 0.88,
    })
  );
  returnRing.position.y = 1.5;
  returnRing.rotation.y = Math.PI / 2;
  returnPortal.add(returnRing);

  const returnFill = new THREE.Mesh(
    new THREE.CircleGeometry(1.34, 40),
    glowMaterial(0xc49bff, 0.1)
  );
  returnFill.position.y = 1.5;
  returnFill.rotation.y = Math.PI / 2;
  returnPortal.add(returnFill);

  const returnLight = new THREE.PointLight(0xb785ff, 0.62, 7, 2);
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

    crystal.rotation.y += delta * 0.5;
    crystal.rotation.x = Math.sin(time * 0.52) * 0.08;
    core.position.y = 2.0 + Math.sin(time * 0.9) * 0.09;
    const pulse = 1 + Math.sin(time * 1.35) * 0.055;
    coreAura.scale.set(pulse, 1.18 * pulse, pulse);
    ringA.rotation.z += delta * 0.17;
    ringB.rotation.z -= delta * 0.11;
    ringC.rotation.z += delta * 0.055;
    beam.material.opacity = 0.065 + Math.sin(time * 1.1) * 0.025;
    fieldRing.material.opacity = 0.11 + Math.sin(time * 0.75) * 0.035;
    outerRing.rotation.z -= delta * 0.014;

    const p = particles.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + speeds[i] * delta;
      let x = p.getX(i) + Math.sin(time * 0.55 + i * 0.17) * delta * 0.018;
      let z = p.getZ(i) + Math.cos(time * 0.42 + i * 0.12) * delta * 0.018;
      if (y > 9.5) y = 0.15;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    particles.rotation.y -= delta * 0.01;

    returnRing.rotation.z -= delta * 0.16;
    returnFill.material.opacity = 0.07 + Math.sin(time * 1.25) * 0.035;
    returnLight.intensity = 0.5 + Math.sin(time * 1.0) * 0.14;

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
    update,
    isNearReturn,
    dispose,
  };
}
