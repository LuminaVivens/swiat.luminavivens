import * as THREE from 'three';

/**
 * createWaterBody
 * -----------------
 * Mały staw w konkretnym miejscu mapy. Brzeg jest lekko nieregularny
 * (nie idealne koło) dla bardziej naturalnego wyglądu, a fale animujemy
 * tak samo jak wzgórza w DistantTerrain.js — przesuwając lokalne Z
 * wierzchołków PRZED obróceniem siatki na płasko (po obrocie lokalne Z
 * staje się wysokością w świecie).
 */
export function createWaterBody(position = new THREE.Vector3(-9, 0, -9), radius = 4.5) {
  const geometry = new THREE.CircleGeometry(radius, 48);
  const posAttr = geometry.attributes.position;

  // Lekko "pofalowany" brzeg zamiast idealnego koła — indeks 0 to środek
  // (tworzony automatycznie przez CircleGeometry), pomijamy go
  for (let i = 1; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.hypot(x, y);
    if (dist < 0.01) continue;
    const angle = Math.atan2(y, x);
    const wobble = 1 + Math.sin(angle * 5) * 0.06 + Math.sin(angle * 3 + 1.3) * 0.04;
    posAttr.setXY(i, x * wobble, y * wobble);
  }

  // Zapamiętujemy bazowe (nieporuszone falami) współrzędne — update()
  // liczy falę na ich podstawie, żeby nie "nakręcać się" w nieskończoność
  const basePositions = Float32Array.from(posAttr.array);

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x14303c,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88,
    emissive: 0x0a1e28,
    emissiveIntensity: 0.25,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  mesh.position.y = 0.02; // tuż nad gruntem, żeby nie "wnikać" w ziemię

  let time = 0;

  function update(delta) {
    time += delta;

    for (let i = 1; i < posAttr.count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const dist = Math.hypot(bx, by);
      const ripple = Math.sin(dist * 2.2 - time * 1.4) * 0.04 * Math.min(dist / radius, 1);
      posAttr.setZ(i, ripple);
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  return { mesh, update };
}
