import * as THREE from 'three';

const AREA = 60; // rozrzut cząsteczek wokół gracza
const FALL_HEIGHT = 40;

/**
 * createRain
 * -----------
 * Deszcz nie pada cały czas na pełną moc — `weatherIntensity` powoli
 * "oddycha" między ciszą a ulewą (pełny cykl to kilka minut), więc
 * pogoda faktycznie się zmienia w trakcie sesji, zamiast być stałym,
 * niezmiennym tłem. To pierwszy krok w stronę pełnego systemu pogody —
 * na razie bez ręcznego sterowania, samo z siebie.
 *
 * Cząsteczki są rozrzucone WOKÓŁ GRACZA (nie wokół stałego punktu 0,0,0)
 * — inaczej po dotarciu w odległe miejsce mapy deszcz zostałby daleko
 * w tyle, zamiast towarzyszyć Ci wszędzie.
 */
export function createRain(scene, particleCount = 600) {
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * AREA * 2;
    positions[i * 3 + 1] = Math.random() * FALL_HEIGHT;
    positions[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
    speeds[i] = 14 + Math.random() * 8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xaac4d8,
    size: 0.06,
    transparent: true,
    opacity: 0, // startowo niewidoczny — sterowane przez cykl pogody w update()
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let time = 0;
  let weatherIntensity = 0;

  function update(delta, followTarget) {
    time += delta;

    // Bardzo wolny, cykliczny "puls" pogody — pełny cykl to kilka minut
    const weatherCycle = (Math.sin(time * 0.02) + 1) / 2;
    weatherIntensity += (weatherCycle - weatherIntensity) * Math.min(1, delta * 0.5);
    material.opacity = weatherIntensity * 0.5;

    // Gdy deszcz i tak jest praktycznie niewidoczny, nie ma sensu liczyć
    // spadania kropel — oszczędza to trochę pracy co klatkę
    if (weatherIntensity < 0.02) return;

    const posAttr = geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      let y = posAttr.getY(i) - speeds[i] * delta;
      if (y < 0) {
        y = FALL_HEIGHT * 0.85 + Math.random() * FALL_HEIGHT * 0.25;
        posAttr.setX(i, followTarget.x + (Math.random() - 0.5) * AREA * 2);
        posAttr.setZ(i, followTarget.z + (Math.random() - 0.5) * AREA * 2);
      }
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  }

  return { update };
}
