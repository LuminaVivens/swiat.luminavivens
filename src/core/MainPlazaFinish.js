import * as THREE from 'three';
import { WORLD_DESTINATIONS } from './WorldHub.js';

function glowMaterial(color, opacity = 0.1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function makeDirectionLine(angle, color) {
  const startRadius = 6.8;
  const endRadius = 15.6;
  const start = new THREE.Vector3(Math.cos(angle) * startRadius, 0.026, Math.sin(angle) * startRadius);
  const end = new THREE.Vector3(Math.cos(angle) * endRadius, 0.026, Math.sin(angle) * endRadius);
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.065,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.Line(geometry, material);
  line.userData.baseOpacity = 0.065;
  return line;
}

function makeMarker(angle, destination) {
  const group = new THREE.Group();
  const radius = 14.3;
  group.position.set(Math.cos(angle) * radius, 0.035, Math.sin(angle) * radius);
  group.rotation.y = -angle;

  const color = destination.color;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.42, 24),
    glowMaterial(color, 0.15)
  );
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 16),
    glowMaterial(color, 0.18)
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.003;
  group.add(inner);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.055, 0.42, 8),
    glowMaterial(color, 0.10)
  );
  beacon.position.y = 0.22;
  group.add(beacon);

  group.userData.ring = ring;
  group.userData.inner = inner;
  group.userData.beacon = beacon;
  group.userData.phase = Math.random() * Math.PI * 2;
  return group;
}

export function createMainPlazaFinish(scene) {
  const root = new THREE.Group();
  root.name = 'MainPlazaFinish';
  scene.add(root);

  const innerGuide = new THREE.Mesh(
    new THREE.RingGeometry(6.55, 6.62, 96),
    glowMaterial(0xd4af37, 0.075)
  );
  innerGuide.rotation.x = -Math.PI / 2;
  innerGuide.position.y = 0.021;
  root.add(innerGuide);

  const middleGuide = new THREE.Mesh(
    new THREE.RingGeometry(10.7, 10.76, 112),
    glowMaterial(0x7fa9c2, 0.045)
  );
  middleGuide.rotation.x = -Math.PI / 2;
  middleGuide.position.y = 0.022;
  root.add(middleGuide);

  const outerGuide = new THREE.Mesh(
    new THREE.RingGeometry(15.65, 15.72, 128),
    glowMaterial(0xc6b47b, 0.055)
  );
  outerGuide.rotation.x = -Math.PI / 2;
  outerGuide.position.y = 0.023;
  root.add(outerGuide);

  const directionLines = [];
  const markers = [];

  WORLD_DESTINATIONS.forEach((destination, index) => {
    const angle = -Math.PI / 2 + (index / WORLD_DESTINATIONS.length) * Math.PI * 2;
    const line = makeDirectionLine(angle, destination.color);
    root.add(line);
    directionLines.push(line);

    const marker = makeMarker(angle, destination);
    root.add(marker);
    markers.push(marker);
  });

  // Cztery neutralne, krótkie nacięcia skali wokół centrum. Nie są kolejnymi
  // punktami podróży, tylko porządkują wizualnie geometrię placu.
  const tickMat = glowMaterial(0xe8dcc2, 0.06);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.015, 0.045), tickMat.clone());
    tick.position.set(Math.cos(angle) * 8.6, 0.028, Math.sin(angle) * 8.6);
    tick.rotation.y = -angle;
    root.add(tick);
  }

  let time = 0;
  let visibility = 1;

  function update(delta, active = true) {
    time += delta;
    const target = active ? 1 : 0;
    visibility += (target - visibility) * Math.min(1, delta * 4.5);
    root.visible = visibility > 0.01;

    innerGuide.material.opacity = visibility * (0.065 + Math.sin(time * 0.55) * 0.012);
    middleGuide.material.opacity = visibility * 0.038;
    outerGuide.material.opacity = visibility * (0.045 + Math.sin(time * 0.35 + 1.1) * 0.009);
    outerGuide.rotation.z += delta * 0.004;

    directionLines.forEach((line, index) => {
      line.material.opacity = visibility * (
        line.userData.baseOpacity + Math.sin(time * 0.75 + index * 0.8) * 0.012
      );
    });

    markers.forEach((marker, index) => {
      const pulse = 0.92 + Math.sin(time * 1.0 + marker.userData.phase) * 0.08;
      marker.userData.ring.scale.setScalar(pulse);
      marker.userData.ring.material.opacity = visibility * (0.11 + Math.sin(time * 0.85 + index) * 0.025);
      marker.userData.inner.material.opacity = visibility * (0.14 + Math.sin(time * 1.25 + index) * 0.035);
      marker.userData.beacon.material.opacity = visibility * (0.055 + Math.sin(time * 0.65 + marker.userData.phase) * 0.018);
    });
  }

  function dispose() {
    root.traverse((node) => {
      if (!node.isMesh && !node.isLine) return;
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
      else node.material?.dispose?.();
    });
    root.removeFromParent();
  }

  return { root, update, dispose };
}
