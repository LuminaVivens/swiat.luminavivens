import * as THREE from 'three';
import { createGate } from './Gate.js';

// Daleko od Punktu Narodzin — ta sama scena co reszta świata, ale
// fizycznie nigdy się nie przenika, bo dzieli je 3000+ jednostek pustki
const POCKET_ORIGIN = new THREE.Vector3(3000, 0, -3000);

// Proceduralna tekstura gruntu — subtelny, "obwodowy" szum zamiast
// płaskiego koloru, bez żadnego zewnętrznego pliku graficznego (ten sam
// duch co reszta projektu — canvas generowany w locie)
function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#060c1c';
  ctx.fillRect(0, 0, 512, 512);

  // Delikatne, losowo rozrzucone "żyły energii" — cienkie linie w
  // odcieniach niebieskiego, jak świecące pod powierzchnią kanały
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 20 + Math.random() * 60;
    const angle = Math.random() * Math.PI * 2;
    const alpha = 0.06 + Math.random() * 0.14;

    ctx.strokeStyle = `rgba(127, 184, 255, ${alpha})`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Flora energetyczna — ten sam kształt co puzzle świata energetycznego
// w PuzzleManager.js (ośmiościan, wireframe) — spójny język wizualny,
// tylko tutaj jako rozproszony krajobraz zamiast pojedynczych elementów
// do zebrania. InstancedMesh = setki egzemplarzy za cenę jednego mesha,
// więc to tanie dla GPU nawet w goglach.
function createEnergeticFlora(count = 220, radius = 38) {
  const geometry = new THREE.OctahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x7fb8ff,
    emissive: 0x7fb8ff,
    emissiveIntensity: 0.6,
    wireframe: true,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    const scale = 0.3 + Math.random() * 1.1;

    dummy.position.set(Math.cos(angle) * dist, scale * 0.9, Math.sin(angle) * dist);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    phases[i] = Math.random() * Math.PI * 2;
  }

  let t = 0;
  return {
    mesh,
    update(delta) {
      t += delta;
      // Delikatne, niesynchroniczne pulsowanie jasności całej flory —
      // dokładna emisja per-instancja wymagałaby własnego shadera, więc
      // tu poruszamy całym materiałem naraz w prostym rytmie oddechu
      mesh.material.emissiveIntensity = 0.45 + Math.sin(t * 0.9) * 0.2;
    },
  };
}

// Unoszące się cząsteczki światła — jak świetliki, tylko energetyczne
function createFloatingMotes(count = 140, radius = 38) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    positions[i * 3] = Math.cos(angle) * dist;
    positions[i * 3 + 1] = Math.random() * 6;
    positions[i * 3 + 2] = Math.sin(angle) * dist;
    speeds[i] = 0.15 + Math.random() * 0.35;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xbfe0ff,
    size: 0.12,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    update(delta) {
      const pos = geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + speeds[i] * delta;
        if (y > 6) y = 0; // wraca na dół, jak nieskończony, powolny wznos
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
  };
}

/**
 * createEnergeticPocket
 * -----------------------
 * Kieszonkowa przestrzeń wymiaru energetycznego — proceduralny grunt,
 * rozproszona flora (ośmiościany, ten sam język wizualny co puzzle tego
 * świata) i unoszące się cząsteczki światła, plus brama powrotna.
 * Zero zewnętrznych plików graficznych — wszystko generowane w kodzie,
 * lekkie dla GPU (InstancedMesh + Points), więc realne do uciągnięcia
 * w goglach VR, nie tylko na desktopie.
 */
export function createEnergeticPocket(scene, { onReturn = () => {} } = {}) {
  const group = new THREE.Group();
  group.position.copy(POCKET_ORIGIN);
  scene.add(group);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(40, 64),
    new THREE.MeshStandardMaterial({
      map: createGroundTexture(),
      color: 0x1a2a4a,
      roughness: 0.85,
      metalness: 0.1,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const ambientLight = new THREE.HemisphereLight(0x7fb8ff, 0x050a18, 0.5);
  group.add(ambientLight);

  const flora = createEnergeticFlora();
  group.add(flora.mesh);

  const motes = createFloatingMotes();
  group.add(motes.points);

  // Brama powrotna — CELOWO nie to samo lustro, które wraca do Punktu
  // Narodzin. To osobne przejście, fizycznie umieszczone w tej kieszeni.
  const returnGate = createGate(group, new THREE.Vector3(0, 0, -12), {
    radius: 2,
    colorHex: 0x7fb8ff,
    onPass: onReturn,
  });

  return {
    group,
    origin: POCKET_ORIGIN,
    // Punkt, w który avatar ląduje po wejściu z zewnątrz — kawałek przed
    // bramą powrotną, żeby od razu było ją widać
    entryPoint: POCKET_ORIGIN.clone().add(new THREE.Vector3(0, 0, 6)),
    update(delta, avatarWorldPosition) {
      flora.update(delta);
      motes.update(delta);
      const local = avatarWorldPosition.clone().sub(POCKET_ORIGIN);
      returnGate.update(delta, local);
    },
  };
}