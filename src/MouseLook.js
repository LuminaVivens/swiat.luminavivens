import * as THREE from 'three';

/**
 * setupMouseLook
 * --------------
 * Rozglądanie się kamerą trzecioosobową przytrzymaniem PRAWEGO przycisku
 * myszy i przeciągnięciem — CELOWO nie lewy (zostaje wolny do klikania
 * w UI: czat, przycisk "Wejdź do świata") i nie "zawsze aktywne" (bez
 * przycisku zwykły ruch kursora do czatu też kręciłby kamerą).
 *
 * To wyłącznie kąt patrzenia KAMERY — kierunek, w który patrzy sam
 * avatar (`heading` w PlayerController) zmienia się tylko przez A/D,
 * dokładnie jak wcześniej. Ruch W/S dalej idzie w stronę, w którą
 * avatar jest fizycznie skierowany, niezależnie od tego gdzie w danej
 * chwili orbituje kamera — to nie jest "kamera trzecioosobowa jak w
 * strzelance", tylko wolne rozglądanie się bez ruszania ciałem.
 */
export function setupMouseLook(domElement, { sensitivity = 0.0025, pitchLimit = Math.PI / 2.5 } = {}) {
  let yaw = 0;
  let pitch = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  domElement.addEventListener('contextmenu', (e) => e.preventDefault());

  domElement.addEventListener('mousedown', (e) => {
    if (e.button !== 2) return; // wyłącznie prawy przycisk
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 2) dragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    yaw -= dx * sensitivity;
    pitch = THREE.MathUtils.clamp(pitch - dy * sensitivity, -pitchLimit, pitchLimit);
  });

  return {
    get yaw() {
      return yaw;
    },
    get pitch() {
      return pitch;
    },
  };
}
