import * as THREE from 'three';

const TRIGGER_RADIUS = 1.6;

/**
 * createThreshold
 * -----------------
 * Próg nie jest karą ani porażką — to świadomy wybór powrotu. Kiedy
 * gracz wejdzie w jego zasięg, dostaje chwilę ciszy (biały błysk, cichy
 * dźwięk), i wraca do Punktu Narodzin, żeby kontynuować dalej. Bez
 * urazu, bez przerywania niczego — dokładnie tak, jak miało być.
 *
 * Wizualnie to pionowy pierścień (brama, przez którą realnie "widać")
 * z miękkim, świetlistym wypełnieniem w środku — inny język wizualny
 * niż leżące płasko Ziarno Światła, żeby czytelnie różnić się funkcją.
 */
export function createThreshold(scene, position, { onPass } = {}) {
  const group = new THREE.Group();
  group.position.copy(position);
  scene.add(group);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2e8d5,
    emissive: 0xd4af37,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.4,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 16, 48), ringMaterial);
  ring.rotation.y = Math.PI / 2; // brama "otwarta" w stronę, przez którą się przechodzi
  ring.position.y = 1.5;
  group.add(ring);

  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2e8d5,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), fillMaterial);
  fill.rotation.y = Math.PI / 2;
  fill.position.y = 1.5;
  group.add(fill);

  const light = new THREE.PointLight(0xd4af37, 0.6, 6, 2);
  light.position.y = 1.5;
  group.add(light);

  let time = 0;
  let cooldown = 0;

  function update(delta, avatarPosition) {
    time += delta;
    if (cooldown > 0) cooldown -= delta;

    ring.rotation.z += delta * 0.15;
    const breathe = 0.5 + 0.5 * Math.sin(time * 1.1);
    fillMaterial.opacity = 0.08 + breathe * 0.08;
    light.intensity = 0.5 + breathe * 0.3;

    if (cooldown > 0) return;

    const dist = group.position.distanceTo(avatarPosition);
    if (dist <= TRIGGER_RADIUS) {
      cooldown = 4; // zapobiega natychmiastowemu ponownemu wyzwoleniu
      onPass?.();
    }
  }

  return { update, group };
}
