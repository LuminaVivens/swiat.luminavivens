import * as THREE from 'three';

export const WORLD_DESTINATIONS = Object.freeze([
  { id: 'woda-kreacji', label: 'Woda Kreacji', symbol: '◌', color: 0x79dfff },
  { id: 'elarion', label: 'Elarion', symbol: '✦', color: 0xf3d477 },
  { id: 'algorytmy', label: 'Algorytmy', symbol: '⌘', color: 0x8ef0ff },
  { id: 'brama-pamieci', label: 'Brama Pamięci', symbol: '◇', color: 0xc7a7ff },
  { id: 'wieza-obserwacji', label: 'Wieża Obserwacji', symbol: '△', color: 0xf5e7bd },
  { id: 'pole-ciemnosci', label: 'Pole Ciemności', symbol: '○', color: 0x7589d9 },
  { id: 'kamienne-miasto', label: 'Kamienne Miasto', symbol: '⬡', color: 0xb8c3ce },
]);

function makeLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '600 38px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 5;
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.2, 0.84, 1);
  sprite.renderOrder = 1100;
  return sprite;
}

function makeSymbolTexture(symbol, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 192, 192);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 92px Georgia, serif';
  ctx.shadowBlur = 22;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillText(symbol, 96, 100);
  return new THREE.CanvasTexture(canvas);
}

function makeConnection(start, end, color) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mid.y += 1.1;
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(34));
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.userData.baseOpacity = 0.15;
  return line;
}

export function createWorldHub(scene, {
  position = new THREE.Vector3(0, 0, 0),
  onSelect = null,
  onActivate = null,
} = {}) {
  const root = new THREE.Group();
  root.name = 'PunktZeroWorldHub';
  root.position.copy(position);
  root.visible = false;
  scene.add(root);

  const hub = new THREE.Group();
  hub.position.y = 3.7;
  root.add(hub);

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xd4af37,
    wireframe: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), coreMaterial);
  hub.add(core);

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  hub.add(coreGlow);

  const orbitA = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.025, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orbitA.rotation.x = Math.PI / 2.4;
  hub.add(orbitA);

  const orbitB = new THREE.Mesh(
    new THREE.TorusGeometry(3.35, 0.018, 8, 90),
    new THREE.MeshBasicMaterial({
      color: 0x88dfff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orbitB.rotation.set(Math.PI / 2.8, 0.42, 0.15);
  hub.add(orbitB);

  const title = makeLabel('PUNKT ZERO  •  MAPA ŚWIATA', '#e9d489');
  title.position.set(0, 2.35, 0);
  title.scale.set(5.6, 1.0, 1);
  hub.add(title);

  const instruction = makeLabel('1–7 wybór  •  Enter aktywuj  •  M zamknij', '#9dcfe8');
  instruction.position.set(0, -2.2, 0);
  instruction.scale.set(5.0, 0.72, 1);
  hub.add(instruction);

  const nodes = [];
  const connections = [];
  const ringRadius = 4.55;

  WORLD_DESTINATIONS.forEach((destination, index) => {
    const angle = -Math.PI / 2 + (index / WORLD_DESTINATIONS.length) * Math.PI * 2;
    const nodePos = new THREE.Vector3(
      Math.cos(angle) * ringRadius,
      Math.sin(angle * 2.1) * 0.4,
      Math.sin(angle) * ringRadius * 0.52
    );

    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(nodePos);
    hub.add(nodeGroup);

    const color = new THREE.Color(destination.color);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 18, 18),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    nodeGroup.add(sphere);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.57, 14, 14),
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    nodeGroup.add(shell);

    const symbol = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSymbolTexture(destination.symbol, `#${color.getHexString()}`),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    }));
    symbol.scale.set(0.9, 0.9, 1);
    symbol.position.y = 0.05;
    symbol.renderOrder = 1101;
    nodeGroup.add(symbol);

    const numberLabel = makeLabel(`${index + 1}`, '#ffffff');
    numberLabel.position.set(-0.62, 0.48, 0);
    numberLabel.scale.set(0.74, 0.48, 1);
    nodeGroup.add(numberLabel);

    const label = makeLabel(destination.label, `#${color.getHexString()}`);
    label.position.y = -0.83;
    label.scale.set(3.05, 0.62, 1);
    nodeGroup.add(label);

    const connection = makeConnection(new THREE.Vector3(0, 0, 0), nodePos.clone(), destination.color);
    hub.add(connection);
    connections.push(connection);

    nodes.push({
      group: nodeGroup,
      sphere,
      shell,
      symbol,
      numberLabel,
      label,
      destination,
      baseScale: 1,
      phase: Math.random() * Math.PI * 2,
    });
  });

  let open = false;
  let selectedIndex = 0;
  let visibility = 0;
  let time = 0;

  function updateSelection() {
    nodes.forEach((node, index) => {
      node.group.userData.selected = index === selectedIndex;
    });
  }
  updateSelection();

  function setOpen(next) {
    open = Boolean(next);
    if (open) {
      root.visible = true;
      onSelect?.(WORLD_DESTINATIONS[selectedIndex], selectedIndex);
    }
  }

  function toggle() {
    setOpen(!open);
    return open;
  }

  function selectByIndex(index) {
    if (!open || index < 0 || index >= nodes.length) return false;
    selectedIndex = index;
    updateSelection();
    onSelect?.(WORLD_DESTINATIONS[selectedIndex], selectedIndex);
    return true;
  }

  function activateSelected() {
    if (!open) return null;
    const destination = WORLD_DESTINATIONS[selectedIndex];
    onActivate?.(destination, selectedIndex);
    return destination;
  }

  function isOpen() {
    return open;
  }

  function update(delta, avatarPosition = null) {
    time += delta;
    const targetVisibility = open ? 1 : 0;
    visibility += (targetVisibility - visibility) * Math.min(1, delta * 6);

    if (!open && visibility < 0.015) {
      root.visible = false;
      return;
    }
    root.visible = true;

    if (avatarPosition && open) {
      const distance = Math.hypot(
        avatarPosition.x - root.position.x,
        avatarPosition.z - root.position.z
      );
      if (distance > 8.5) open = false;
    }

    core.rotation.y += delta * 0.32;
    core.rotation.x += delta * 0.11;
    coreMaterial.opacity = 0.58 * visibility;
    coreGlow.material.opacity = (0.07 + Math.sin(time * 1.5) * 0.025) * visibility;
    orbitA.rotation.z += delta * 0.09;
    orbitB.rotation.z -= delta * 0.055;
    orbitA.material.opacity = 0.25 * visibility;
    orbitB.material.opacity = 0.15 * visibility;
    title.material.opacity = 0.9 * visibility;
    instruction.material.opacity = 0.65 * visibility;

    nodes.forEach((node, index) => {
      const selected = index === selectedIndex;
      const pulse = 1 + Math.sin(time * 1.7 + node.phase) * 0.06;
      const targetScale = (selected ? 1.45 : 1) * pulse;
      const current = node.group.scale.x;
      const next = current + (targetScale - current) * Math.min(1, delta * 7);
      node.group.scale.setScalar(next);
      node.group.rotation.y += delta * (selected ? 0.42 : 0.13);

      node.sphere.material.opacity = (selected ? 0.82 : 0.42) * visibility;
      node.shell.material.opacity = (selected ? 0.42 : 0.16) * visibility;
      node.symbol.material.opacity = (selected ? 1 : 0.72) * visibility;
      node.numberLabel.material.opacity = (selected ? 0.95 : 0.54) * visibility;
      node.label.material.opacity = (selected ? 0.95 : 0.58) * visibility;
      connections[index].material.opacity = (selected ? 0.52 : connections[index].userData.baseOpacity) * visibility;
    });
  }

  function dispose() {
    root.traverse((node) => {
      node.geometry?.dispose?.();
      node.material?.map?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return {
    root,
    toggle,
    setOpen,
    isOpen,
    selectByIndex,
    activateSelected,
    update,
    dispose,
    getSelected: () => WORLD_DESTINATIONS[selectedIndex],
  };
}
