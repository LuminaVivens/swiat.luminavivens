import * as THREE from 'three';

/**
 * createGate
 * ----------
 * Generyczna, samodzielna brama: pierścień + kolumna światła + wykrywanie
 * wejścia avatara w promieniu. Nie zakłada NIC o tym, co się dzieje po
 * wejściu — to decyduje wołający przez `onPass`. Dzięki temu jeden
 * moduł obsłuży bramę powrotną z kieszonkowej przestrzeni, i każdą
 * kolejną bramę, którą dodasz w przyszłości, bez pisania nowego kodu.
 */
export function createGate(parent, position, { radius = 2, colorHex = 0xffffff, onPass = () => {} } = {}) {
  const group = new THREE.Group();
  group.position.set(position.x, 0, position.z);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.75, radius, 48),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  // Delikatna kolumna światła — widoczna z daleka, żeby bramę dało się
  // łatwo odnaleźć w otwartej przestrzeni
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, 6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beam.position.y = 3;
  group.add(beam);

  parent.add(group);

  const flatSelf = new THREE.Vector3(group.position.x, 0, group.position.z);
  const flatOther = new THREE.Vector3();
  let armed = true;
  let t = 0;

  return {
    group,
    // `localPosition` — pozycja avatara w tym samym układzie współrzędnych
    // co `parent` (patrz DimensionPocket.js, gdzie odejmuje się origin
    // kieszonkowej przestrzeni przed wywołaniem tej funkcji)
    update(delta, localPosition) {
      t += delta;
      ring.rotation.z += delta * 0.15;
      beam.material.opacity = 0.06 + Math.sin(t * 0.8) * 0.03;

      flatOther.copy(localPosition).setY(0);
      const inside = flatOther.distanceTo(flatSelf) <= radius;
      if (inside && armed) {
        armed = false;
        onPass();
      } else if (!inside) {
        armed = true;
      }
    },
  };
}
