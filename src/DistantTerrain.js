import * as THREE from 'three';

// Tania, "podróbkowa" wersja szumu Perlina — kilka nałożonych na siebie
// fal sinusoidalnych o różnych częstotliwościach daje wystarczająco
// naturalny, pofałdowany kształt terenu bez ściągania osobnej biblioteki
function hillNoise(x, z) {
  return (
    Math.sin(x * 0.15 + z * 0.05) * 0.5 +
    Math.sin(x * 0.05 - z * 0.13) * 0.3 +
    Math.sin((x + z) * 0.08) * 0.2
  );
}

/**
 * createDistantTerrain
 * ----------------------
 * Pierścień pofałdowanego terenu OTACZAJĄCY płaską, "grywalną" ziemię
 * (promień ~60) — od promienia INNER_RADIUS teren zaczyna się unosić,
 * dochodząc do pełnej wysokości dalej od centrum, i znika w mgle sceny
 * zanim gracz miałby szansę tam realnie dotrzeć. To czysto dekoracyjny
 * horyzont: gracz porusza się po płaskiej ziemi tak jak dotychczas,
 * te wzgórza nigdy nie wpływają na sterowanie ani kolizje.
 */
export function createDistantTerrain() {
  const INNER_RADIUS = 58; // tuż za krawędzią płaskiej, grywalnej ziemi
  const OUTER_RADIUS = 150; // dalej i tak niewidoczne przez mgłę
  const MAX_HEIGHT = 9;

  const geometry = new THREE.RingGeometry(INNER_RADIUS, OUTER_RADIUS, 96, 24);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i); // przed obrotem — to będzie "z" w świecie
    const dist = Math.hypot(x, y);

    // Płynne przejście od 0 (na granicy z płaską ziemią) do 1 — bez tego
    // powstałby widoczny, ostry uskok w miejscu połączenia
    const falloff = THREE.MathUtils.smoothstep(dist, INNER_RADIUS, INNER_RADIUS + 25);
    const height = hillNoise(x, y) * MAX_HEIGHT * falloff;

    position.setZ(i, height); // lokalne Z geometrii = wysokość po obrocie na płasko
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x0d1018,
    roughness: 0.95,
    metalness: 0.05,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;

  return mesh;
}
