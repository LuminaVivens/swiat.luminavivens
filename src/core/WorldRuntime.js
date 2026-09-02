import * as THREE from 'three';
import { VRButton } from '../VRButtonPL.js';

/**
 * Tworzy techniczny rdzeń świata: scenę, kamerę, renderer WebGL/WebXR
 * oraz podstawowe oświetlenie. Nie zawiera logiki gry ani zawartości świata.
 */
export function createWorldRuntime(container) {
  if (!container) {
    throw new Error('[Lumina] Brak kontenera #app.');
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070c);
  scene.fog = new THREE.FogExp2(0x05070c, 0.015);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );

  const cameraRig = new THREE.Group();
  cameraRig.add(camera);
  scene.add(cameraRig);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.error('[Lumina] Nie udało się uruchomić WebGL:', err);
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:#05070c;color:#f4f1ea;font:16px system-ui;padding:32px;text-align:center;z-index:9999';
    errorBox.innerHTML = '<div><h1 style="color:#d4af37">Lumina Vivens</h1><p>Przeglądarka nie uruchomiła WebGL. Odśwież stronę lub sprawdź akcelerację sprzętową.</p></div>';
    document.body.appendChild(errorBox);
    throw err;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const hemiLight = new THREE.HemisphereLight(0x8fb3ff, 0x0a0a12, 0.6);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff2d9, 1.1);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  scene.add(dirLight);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', resize);

  return {
    scene,
    camera,
    cameraRig,
    renderer,
    hemiLight,
    dirLight,
    dispose() {
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
    },
  };
}
