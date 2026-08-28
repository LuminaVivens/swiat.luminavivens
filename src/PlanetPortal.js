import * as THREE from 'three';

/**
 * createPlanetPortal
 * -------------------
 * Miejsce na lustrzanej podłodze dokładnie tam, gdzie pada odbicie danej
 * planety — czyli w kierunku od Punktu Narodzin w stronę planety na
 * niebie, w połowie szerokości pierścienia MirrorFloor. Wejście avatara
 * w ten KONKRETNY punkt (nie cały pierścień) uruchamia `onEnter` — to
 * celowe, żeby zwykłe przejście na platformę Punktu Narodzin (które i
 * tak przecina lustro) nie odpalało podróży przypadkiem.
 */
export function createPlanetPortal(scene, planetPosition, {
  mirrorInnerRadius = 6.5,
  mirrorOuterRadius = 55,
  triggerRadius = 2,
  approachRadius = triggerRadius + 8, // strefa "zbliżania się" — winieta ciemnieje płynnie w tym zasięgu
  onApproach = () => {},
  onEnter = () => {},
} = {}) {
  const direction = new THREE.Vector3(planetPosition[0], 0, planetPosition[2]).normalize();
  const portalDistance = (mirrorInnerRadius + mirrorOuterRadius) / 2;
  const portalPosition = direction.multiplyScalar(portalDistance);

  // Delikatny, ledwo widoczny znacznik na tafli — miękki, promienisty
  // gradient zamiast twardej krawędzi koła, żeby zanikał bez ostrej linii
  const markerCanvas = document.createElement('canvas');
  markerCanvas.width = 256;
  markerCanvas.height = 256;
  const markerCtx = markerCanvas.getContext('2d');
  const markerGradient = markerCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  markerGradient.addColorStop(0, 'rgba(255,255,255,0.35)');
  markerGradient.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  markerGradient.addColorStop(1, 'rgba(255,255,255,0)');
  markerCtx.fillStyle = markerGradient;
  markerCtx.fillRect(0, 0, 256, 256);

  const marker = new THREE.Mesh(
    new THREE.CircleGeometry(triggerRadius * 1.4, 32),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(markerCanvas),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(portalPosition.x, 0.012, portalPosition.z);
  scene.add(marker);

  const flatPortal = new THREE.Vector3(portalPosition.x, 0, portalPosition.z);
  const flatAvatar = new THREE.Vector3();
  let armed = true; // zapobiega wielokrotnemu odpaleniu, dopóki gracz stoi w miejscu

  function update(avatarPosition) {
    flatAvatar.copy(avatarPosition).setY(0);
    const dist = flatAvatar.distanceTo(flatPortal);

    // 0 daleko od portalu, 1 dokładnie na progu wejścia — winieta w main.js
    // mnoży to przez swoją maksymalną nieprzezroczystość
    const approachProgress = THREE.MathUtils.clamp(
      1 - (dist - triggerRadius) / (approachRadius - triggerRadius),
      0,
      1
    );
    onApproach(approachProgress);

    const inside = dist <= triggerRadius;
    if (inside && armed) {
      armed = false;
      onEnter();
    } else if (!inside) {
      armed = true;
    }
  }

  return { update, portalPosition };
}