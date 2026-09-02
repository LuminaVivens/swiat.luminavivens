import * as THREE from 'three';

function createGhostTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // miękki duch — bez kreskówy, bardziej eteryczny niż dosłowny
  const gradient = ctx.createRadialGradient(128, 120, 12, 128, 140, 108);
  gradient.addColorStop(0, 'rgba(235,245,255,0.96)');
  gradient.addColorStop(0.45, 'rgba(190,220,255,0.78)');
  gradient.addColorStop(0.78, 'rgba(155,170,255,0.28)');
  gradient.addColorStop(1, 'rgba(130,140,255,0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(128, 28);
  ctx.bezierCurveTo(76, 28, 52, 72, 56, 132);
  ctx.bezierCurveTo(58, 188, 76, 218, 72, 256);
  ctx.bezierCurveTo(84, 240, 96, 226, 114, 252);
  ctx.bezierCurveTo(122, 234, 132, 224, 146, 252);
  ctx.bezierCurveTo(162, 226, 174, 236, 184, 258);
  ctx.bezierCurveTo(194, 232, 206, 224, 206, 182);
  ctx.bezierCurveTo(206, 100, 182, 28, 128, 28);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 16;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.fillStyle = 'rgba(250,250,255,0.95)';
  ctx.beginPath();
  ctx.arc(108, 116, 8, 0, Math.PI * 2);
  ctx.arc(148, 116, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(220,235,255,0.55)';
  ctx.beginPath();
  ctx.arc(128, 150, 18, 0.15, Math.PI - 0.15);
  ctx.strokeStyle = 'rgba(220,235,255,0.35)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createAuraTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(235,245,255,0.85)');
  grad.addColorStop(0.45, 'rgba(175,190,255,0.28)');
  grad.addColorStop(1, 'rgba(150,170,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createGhost(index, ghostTexture, auraTexture) {
  const group = new THREE.Group();
  group.name = `DarkGhost:${index + 1}`;

  const aura = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: auraTexture,
      color: 0xa58cff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  aura.scale.set(2.8, 2.8, 1);
  group.add(aura);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: ghostTexture,
      color: 0xf5fbff,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  sprite.scale.set(2.4, 3.0, 1);
  group.add(sprite);

  const trailCount = 10;
  const positions = new Float32Array(trailCount * 3);
  for (let i = 0; i < trailCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = -0.4 - i * 0.18;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const trail = new THREE.Points(
    trailGeo,
    new THREE.PointsMaterial({
      map: auraTexture,
      color: 0xc7bbff,
      size: 0.16,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.02,
    })
  );
  group.add(trail);

  group.userData.motion = {
    radius: 3.3 + Math.random() * 4.7,
    angle: Math.random() * Math.PI * 2,
    speed: (Math.random() > 0.5 ? 1 : -1) * (0.18 + Math.random() * 0.24),
    height: 1.2 + Math.random() * 2.1,
    bobAmp: 0.18 + Math.random() * 0.42,
    bobSpeed: 0.8 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    drift: 0.35 + Math.random() * 0.6,
  };

  group.userData.parts = { aura, sprite, trail };
  return group;
}

export function createDarkSpiritualField({ ghostCount = 8 } = {}) {
  const root = new THREE.Group();
  root.name = 'DarkSpiritualField';

  const skyGroup = new THREE.Group();
  skyGroup.name = 'DarkSpiritualSky';
  root.add(skyGroup);

  const darkDome = new THREE.Mesh(
    new THREE.SphereGeometry(185, 40, 28),
    new THREE.MeshBasicMaterial({
      color: 0x010103,
      transparent: true,
      opacity: 0.985,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  skyGroup.add(darkDome);

  const mistDome = new THREE.Mesh(
    new THREE.SphereGeometry(150, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0x100818,
      transparent: true,
      opacity: 0.025,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
  );
  skyGroup.add(mistDome);

  const centerMist = new THREE.Mesh(
    new THREE.CircleGeometry(7.2, 72),
    new THREE.MeshBasicMaterial({
      color: 0x09070d,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  centerMist.rotation.x = -Math.PI / 2;
  centerMist.position.y = 0.012;
  root.add(centerMist);

  const focusHalo = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x8c76ff,
      transparent: true,
      opacity: 0.018,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  focusHalo.rotation.x = -Math.PI / 2;
  focusHalo.position.y = 0.02;
  root.add(focusHalo);

  const blackCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshStandardMaterial({
      color: 0x040408,
      emissive: 0x11091d,
      emissiveIntensity: 0.08,
      roughness: 0.22,
      metalness: 0.78,
      transparent: true,
      opacity: 0.98,
    })
  );
  blackCrystal.position.set(0, 1.35, 0);
  blackCrystal.scale.set(1.0, 1.45, 1.0);
  root.add(blackCrystal);

  const crystalAura = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.06, 0),
    new THREE.MeshBasicMaterial({
      color: 0x9b8cff,
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  crystalAura.position.copy(blackCrystal.position);
  crystalAura.scale.set(1.02, 1.5, 1.02);
  root.add(crystalAura);

  const ghostTexture = createGhostTexture();
  const auraTexture = createAuraTexture();
  const ghosts = [];
  for (let i = 0; i < ghostCount; i++) {
    const ghost = createGhost(i, ghostTexture, auraTexture);
    root.add(ghost);
    ghosts.push(ghost);
  }

  let time = 0;

  function update(delta, focusPosition = null) {
    time += delta;

    if (focusPosition) {
      skyGroup.position.x = focusPosition.x;
      skyGroup.position.z = focusPosition.z;
      centerMist.position.x = focusPosition.x;
      centerMist.position.z = focusPosition.z;
      focusHalo.position.x = focusPosition.x;
      focusHalo.position.z = focusPosition.z;
    }

    darkDome.material.opacity = 0.982 + Math.sin(time * 0.13) * 0.006;
    mistDome.material.opacity = 0.018 + Math.sin(time * 0.24 + 0.6) * 0.008;
    focusHalo.rotation.z += delta * 0.08;
    focusHalo.material.opacity = 0.012 + Math.sin(time * 0.9) * 0.006;

    blackCrystal.rotation.y += delta * 0.22;
    blackCrystal.rotation.x = Math.sin(time * 0.4) * 0.06;
    blackCrystal.position.y = 1.35 + Math.sin(time * 0.75) * 0.06;
    crystalAura.position.copy(blackCrystal.position);
    crystalAura.rotation.y -= delta * 0.18;
    crystalAura.rotation.x = blackCrystal.rotation.x;
    crystalAura.material.opacity = 0.03 + Math.sin(time * 1.1) * 0.012;

    const cx = focusPosition?.x ?? 0;
    const cz = focusPosition?.z ?? 0;

    ghosts.forEach((ghost, index) => {
      const motion = ghost.userData.motion;
      const { aura, sprite, trail } = ghost.userData.parts;
      motion.angle += delta * motion.speed;

      const radiusWobble = Math.sin(time * 0.45 + motion.phase + index * 0.3) * motion.drift;
      const r = motion.radius + radiusWobble;
      const x = cx + Math.cos(motion.angle) * r;
      const z = cz + Math.sin(motion.angle) * r;
      const y = motion.height + Math.sin(time * motion.bobSpeed + motion.phase) * motion.bobAmp;

      ghost.position.set(x, y, z);
      aura.scale.setScalar(2.5 + Math.sin(time * 1.25 + motion.phase) * 0.18);
      aura.material.opacity = 0.11 + Math.sin(time * 1.1 + motion.phase) * 0.05;
      sprite.material.opacity = 0.58 + Math.sin(time * 1.4 + motion.phase) * 0.12;
      sprite.scale.set(2.35, 3.0 + Math.sin(time * 1.6 + motion.phase) * 0.12, 1);

      const positions = trail.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const t = i / Math.max(1, positions.count - 1);
        positions.setXYZ(
          i,
          Math.sin(time * 1.6 + motion.phase + t * 4 + index) * (0.08 + t * 0.18),
          -0.4 - t * 1.8,
          Math.cos(time * 1.1 + motion.phase + t * 3 + index) * (0.08 + t * 0.14)
        );
      }
      positions.needsUpdate = true;
      trail.material.opacity = 0.18 + Math.sin(time * 1.2 + motion.phase) * 0.06;
    });
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

  return { root, update, dispose };
}
