import * as THREE from 'three';

/**
 * setupGrabbing
 * -------------
 * Chwytanie elementów puzzli w VR przez przycisk GRIP (chwyt dłonią),
 * nie spust — spust jest już zajęty pod teleportację (patrz
 * TeleportController.js), więc oba gesty nie kolidują ze sobą.
 *
 * Nie tworzy żadnych nowych obiektów kontrolerów — korzysta z tych
 * samych `controller`/`grip`, które renderer.xr.getController(index)
 * i getControllerGrip(index) już zwracają dla TeleportController (three.js
 * cache'uje je pod tym samym indeksem), więc modele dłoni i tak są
 * już widoczne w headsecie bez dodatkowej pracy tutaj.
 *
 * Logika: trzymasz grip → co klatkę sprawdzamy, czy pozycja dłoni
 * (grip.matrixWorld) jest wystarczająco blisko jakiegoś aktywnego
 * puzzla (PuzzleManager.collectNear). Jak coś złapiesz, zdejmujemy
 * flagę "isGrabbing" na tej ręce, żeby jedno przytrzymanie nie
 * zmiotło kilku elementów stojących blisko siebie za jednym razem —
 * chcesz puścić i chwycić ponownie dla kolejnego.
 */
export function setupGrabbing(renderer, puzzleManager, { grabRadius = 0.35 } = {}) {
  const tempPosition = new THREE.Vector3();

  const hands = [0, 1].map((index) => {
    const controller = renderer.xr.getController(index);
    const grip = renderer.xr.getControllerGrip(index);

    controller.userData.isGrabbing = false;
    controller.addEventListener('squeezestart', () => {
      controller.userData.isGrabbing = true;
    });
    controller.addEventListener('squeezeend', () => {
      controller.userData.isGrabbing = false;
    });

    return { controller, grip };
  });

  function update() {
    for (const { controller, grip } of hands) {
      if (!controller.userData.isGrabbing) continue;

      tempPosition.setFromMatrixPosition(grip.matrixWorld);
      const collected = puzzleManager.collectNear(tempPosition, grabRadius);
      if (collected) controller.userData.isGrabbing = false;
    }
  }

  return { update };
}
