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
  g.addColorStop(0, 'rgba(225,255,255,0.98)');
  g.addColorStop(0.35, 'rgba(80,230,255,0.58)');
  g.addColorStop(1, 'rgba(20,100,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createPrompt(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 34px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#52e8ff';
  ctx.fillStyle = '#dffcff';
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

function createDataLine(from, to, color = 0x57e7ff, opacity = 0.18) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.userData.baseOpacity = opacity;
  line.userData.phase = Math.random() * Math.PI * 2;
  return line;
}

export function createAlgorithmsRealm(scene, {
  center = new THREE.Vector3(0, 0, -145),
} = {}) {
  const root = new THREE.Group();
  root.name = 'Realm:Algorytmy';
  root.position.copy(center);
  scene.add(root);

  const entryPoint = center.clone().add(new THREE.Vector3(0, 0, 12));
  const localReturnPortal = new THREE.Vector3(10, 0, 10);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(64, 36, 24),
    new THREE.MeshBasicMaterial({
      color: 0x02080d,
      transparent: true,
      opacity: 0.96,
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
      color: 0x030b10,
      roughness: 0.74,
      metalness: 0.28,
      emissive: 0x071b25,
      emissiveIntensity: 0.25,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  root.add(floor);

  // Centralny rdzeń algorytmiczny.
  const core = new THREE.Group();
  core.position.y = 2.2;
  root.add(core);

  const coreBox = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 1),
    new THREE.MeshStandardMaterial({
      color: 0xbff9ff,
      emissive: 0x29dfff,
      emissiveIntensity: 0.72,
      roughness: 0.2,
      metalness: 0.55,
      transparent: true,
      opacity: 0.86,
      wireframe: true,
    })
  );
  core.add(coreBox);

  const innerCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.48, 0),
    glowMaterial(0xf0ffff, 0.68)
  );
  core.add(innerCore);

  const coreAura = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 18, 18),
    glowMaterial(0x42dfff, 0.10)
  );
  core.add(coreAura);

  const orbitA = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, 0.03, 8, 72),
    glowMaterial(0x58e8ff, 0.24)
  );
  orbitA.rotation.set(Math.PI / 2.3, 0.15, 0.1);
  core.add(orbitA);

  const orbitB = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.022, 8, 84),
    glowMaterial(0x8ea8ff, 0.15)
  );
  orbitB.rotation.set(Math.PI / 2.8, -0.45, 0.35);
  core.add(orbitB);

  // Sieć węzłów danych wokół rdzenia.
  const network = new THREE.Group();
  root.add(network);
  const nodes = [];
  const nodePositions = [];
  const NODE_COUNT = 18;

  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2 + Math.random() * 0.38;
    const radius = 5.2 + Math.random() * 12.5;
    const y = 0.9 + Math.random() * 5.8;
    const pos = new THREE.Vector3(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
    nodePositions.push(pos);

    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(pos);
    network.add(nodeGroup);

    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22 + Math.random() * 0.18, 0),
      new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? 0xe7ffff : 0x6eeaff,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    nodeGroup.add(node);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.48 + Math.random() * 0.22, 10, 10),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0x859dff : 0x43dfff,
        wireframe: true,
        transparent: true,
        opacity: 0.13,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    nodeGroup.add(shell);

    nodeGroup.userData = {
      base: pos.clone(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.6,
      amp: 0.12 + Math.random() * 0.28,
      node,
      shell,
    };
    nodes.push(nodeGroup);
  }

  const lines = [];
  // Każdy węzeł łączy się z następnym i co trzeci również z rdzeniem.
  for (let i = 0; i < NODE_COUNT; i++) {
    const a = nodePositions[i];
    const b = nodePositions[(i + 1) % NODE_COUNT];
    const line = createDataLine(a, b, i % 2 ? 0x47dfff : 0x708dff, 0.16);
    network.add(line);
    lines.push(line);

    if (i % 3 === 0) {
      const spoke = createDataLine(new THREE.Vector3(0, 2.2, 0), a, 0xb9f8ff, 0.10);
      network.add(spoke);
      lines.push(spoke);
    }
  }

  // Impulsy danych poruszające się pomiędzy sąsiednimi węzłami.
  const pulseTexture = createSoftTexture();
  const pulses = [];
  for (let i = 0; i < 12; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: pulseTexture,
      color: i % 3 === 0 ? 0xdffeff : 0x6feaff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    sprite.scale.set(0.42, 0.42, 1);
    network.add(sprite);
    pulses.push({
      sprite,
      from: Math.floor(Math.random() * NODE_COUNT),
      t: Math.random(),
      speed: 0.08 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const fieldRing = new THREE.Mesh(
    new THREE.RingGeometry(9.2, 9.55, 96),
    glowMaterial(0x42dfff, 0.11)
  );
  fieldRing.rotation.x = -Math.PI / 2;
  fieldRing.position.y = 0.025;
  root.add(fieldRing);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(18.2, 18.4, 112),
    glowMaterial(0x788fff, 0.06)
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.02;
  root.add(outerRing);

  // Brama powrotna.
  const returnPortal = new THREE.Group();
  returnPortal.position.copy(localReturnPortal);
  root.add(returnPortal);

  const returnRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.075, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0xcffbff,
      emissive: 0x38dfff,
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.42,
      transparent: true,
      opacity: 0.9,
    })
  );
  returnRing.position.y = 1.5;
  returnRing.rotation.y = Math.PI / 2;
  returnPortal.add(returnRing);

  const returnFill = new THREE.Mesh(
    new THREE.CircleGeometry(1.34, 40),
    glowMaterial(0x55e8ff, 0.09)
  );
  returnFill.position.y = 1.5;
  returnFill.rotation.y = Math.PI / 2;
  returnPortal.add(returnFill);

  const returnLight = new THREE.PointLight(0x4ee5ff, 0.62, 7, 2);
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

    coreBox.rotation.y += delta * 0.55;
    coreBox.rotation.x -= delta * 0.18;
    innerCore.rotation.y -= delta * 0.85;
    innerCore.rotation.z += delta * 0.36;
    orbitA.rotation.z += delta * 0.17;
    orbitB.rotation.z -= delta * 0.12;
    const corePulse = 1 + Math.sin(time * 1.7) * 0.07;
    coreAura.scale.setScalar(corePulse);
    core.position.y = 2.2 + Math.sin(time * 0.85) * 0.08;

    nodes.forEach((group, i) => {
      const d = group.userData;
      group.position.y = d.base.y + Math.sin(time * d.speed + d.phase) * d.amp;
      group.rotation.y += delta * (0.14 + (i % 4) * 0.018);
      const p = 0.92 + Math.sin(time * 1.5 + d.phase) * 0.12;
      d.node.scale.setScalar(p);
      d.node.material.opacity = 0.46 + Math.sin(time * 1.3 + d.phase) * 0.12;
      d.shell.material.opacity = 0.09 + Math.sin(time * 0.9 + d.phase) * 0.035;
    });

    lines.forEach((line) => {
      line.material.opacity = line.userData.baseOpacity + Math.sin(time * 1.4 + line.userData.phase) * 0.045;
    });

    pulses.forEach((pulse) => {
      pulse.t += pulse.speed * delta;
      if (pulse.t >= 1) {
        pulse.t -= 1;
        pulse.from = (pulse.from + 1 + Math.floor(Math.random() * 3)) % NODE_COUNT;
      }
      const a = nodes[pulse.from].position;
      const b = nodes[(pulse.from + 1) % NODE_COUNT].position;
      pulse.sprite.position.lerpVectors(a, b, pulse.t);
      const s = 0.34 + Math.sin(time * 3.2 + pulse.phase) * 0.07;
      pulse.sprite.scale.set(s, s, 1);
      pulse.sprite.material.opacity = 0.42 + Math.sin(time * 2.3 + pulse.phase) * 0.12;
    });

    fieldRing.material.opacity = 0.08 + Math.sin(time * 0.9) * 0.03;
    outerRing.rotation.z -= delta * 0.012;
    returnRing.rotation.z += delta * 0.18;
    returnFill.material.opacity = 0.06 + Math.sin(time * 1.25) * 0.035;
    returnLight.intensity = 0.5 + Math.sin(time * 1.05) * 0.14;

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
      if (!node.isMesh && !node.isPoints && !node.isLine && !node.isSprite) return;
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
