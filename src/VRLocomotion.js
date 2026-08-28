import * as THREE from 'three';

/**
 * setupVRLocomotion
 * -------------------
 * Płynne chodzenie w VR lewym analogiem, w kierunku w który patrzy
 * głowa (standard w większości gier Quest) — niezależne od
 * PlayerController (ten obsługuje sterowanie "czołgowe" na desktopie).
 * Ruch odbywa się przez przesuwanie cameraRig; main.js i tak już
 * synchronizuje avatar.position z cameraRig w trybie VR, więc reszta
 * gry (sieć, puzzle, granica terenu) widzi ten ruch identycznie jak
 * ruch WASD.
 *
 * UWAGA: mapowanie osi analoga (`axes[2]`/`axes[3]`) jest typowe dla
 * kontrolerów Quest, ale różni się między urządzeniami/przeglądarkami.
 * Jeśli ruch nie zadziała od razu, zaloguj `source.gamepad.axes` w
 * konsoli VR (albo przez zdalne debugowanie), żeby sprawdzić faktyczne
 * indeksy na Twoim sprzęcie.
 */
export function setupVRLocomotion(renderer, cameraRig, camera, { speed = 2.2, deadzone = 0.15 } = {}) {
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  function update(delta) {
    const session = renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (!source.gamepad || source.handedness !== 'left') continue;

      const axes = source.gamepad.axes;
      const x = axes[2] ?? axes[0] ?? 0;
      const y = axes[3] ?? axes[1] ?? 0;

      const moveX = Math.abs(x) > deadzone ? x : 0;
      const moveY = Math.abs(y) > deadzone ? y : 0;
      if (moveX === 0 && moveY === 0) continue;

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, up).negate();

      cameraRig.position.addScaledVector(forward, -moveY * speed * delta);
      cameraRig.position.addScaledVector(right, moveX * speed * delta);
    }
  }

  return { update };
}
