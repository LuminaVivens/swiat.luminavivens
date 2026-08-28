import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

/**
 * setupTeleportation
 * ------------------
 * Klasyczna technika WebXR: trzymasz spust kontrolera, z ręki wystrzeliwuje
 * promień, tam gdzie trafia w ziemię pojawia się pierścień — puszczasz
 * spust i "cameraRig" (grupa-nadrzędna kamery) przeskakuje w to miejsce.
 *
 * Dodatkowo: prawdziwe modele kontrolerów (zamiast pustych, niewidocznych
 * "duchów") widoczne w goglach — i `onTeleport`, wywoływane dokładnie
 * w momencie skoku, żeby main.js mogło pokazać krótki, uspokajający
 * błysk komfortu (patrz main.js) i zsynchronizować pozycję avatara.
 */
export function setupTeleportation(renderer, cameraRig, groundMesh, scene, { onTeleport } = {}) {
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const controllerModelFactory = new XRControllerModelFactory();

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.24, 0.34, 32),
    new THREE.MeshBasicMaterial({ color: 0x4fd1c5, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);

  function createControllerRay() {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5),
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0x4fd1c5, transparent: true, opacity: 0.6 });
    const line = new THREE.Line(geometry, material);
    line.name = 'teleport-ray';
    return line;
  }

  const controllers = [0, 1].map((index) => {
    const controller = renderer.xr.getController(index);
    controller.add(createControllerRay());
    controller.userData.isSelecting = false;

    controller.addEventListener('selectstart', () => {
      controller.userData.isSelecting = true;
    });

    controller.addEventListener('selectend', () => {
      controller.userData.isSelecting = false;
      if (marker.visible) {
        cameraRig.position.x = marker.position.x;
        cameraRig.position.z = marker.position.z;
        onTeleport?.();
      }
      marker.visible = false;
    });

    cameraRig.add(controller);

    // Prawdziwy model kontrolera (widoczny w goglach) — dołączony do
    // osobnego "grip space", żeby jego orientacja pasowała do trzymanej
    // ręki niezależnie od tego, skąd wystrzeliwuje promień teleportacji
    const grip = renderer.xr.getControllerGrip(index);
    grip.add(controllerModelFactory.createControllerModel(grip));
    cameraRig.add(grip);

    return controller;
  });

  function update() {
    marker.visible = false;

    for (const controller of controllers) {
      if (!controller.userData.isSelecting) continue;

      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const hits = raycaster.intersectObject(groundMesh);
      if (hits.length > 0) {
        marker.position.copy(hits[0].point);
        marker.visible = true;
      }
    }
  }

  return { update };
}
