// Kompresuje WSZYSTKIE pliki .glb w public/models/ (łącznie z podfolderem
// avatar/) algorytmem Draco — TYLKO geometrię, celowo pomijając kompresję
// tekstur. Pełny "optimize" (który próbuje skompresować też obrazy)
// potrafi się wywalić na niektórych systemach Windows przez błąd w
// bibliotece libvips, z której korzysta — sama kompresja Draco tego
// problemu nie ma, bo w ogóle nie dotyka tekstur.
//
// Korzysta z narzędzia gltf-transform przez npx, więc nie trzeba niczego
// instalować na stałe w projekcie.
//
// Uruchomienie: npm run compress:models
//
// UWAGA: nadpisuje pliki w miejscu. Jeśli chcesz zachować oryginały,
// zrób kopię folderu public/models/ przed uruchomieniem.

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const MODELS_DIR = fileURLToPath(new URL('../public/models/', import.meta.url));

function findGlbFiles(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results = results.concat(findGlbFiles(fullPath));
    } else if (extname(entry) === '.glb') {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findGlbFiles(MODELS_DIR);

if (files.length === 0) {
  console.log('Nie znaleziono żadnych plików .glb w public/models/ — nic do zrobienia.');
  process.exit(0);
}

console.log(`Znaleziono ${files.length} plik(ów) .glb do kompresji.\n`);

let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const before = statSync(file).size;
  totalBefore += before;
  console.log(`Kompresuję: ${file} (${(before / 1024).toFixed(0)} KB)...`);

  try {
    execSync(`npx --yes @gltf-transform/cli draco "${file}" "${file}"`, {
      stdio: 'pipe',
    });
    const after = statSync(file).size;
    totalAfter += after;
    const savings = (100 * (1 - after / before)).toFixed(0);
    console.log(`  → ${(after / 1024).toFixed(0)} KB (oszczędność ${savings}%)\n`);
  } catch (err) {
    console.error(`  Błąd przy kompresji ${file}:`, err.message);
    totalAfter += before; // licz oryginalny rozmiar, żeby podsumowanie się zgadzało
  }
}

const totalSavings = (100 * (1 - totalAfter / totalBefore)).toFixed(0);
console.log(`Gotowe. Łącznie: ${(totalBefore / 1024).toFixed(0)} KB → ${(totalAfter / 1024).toFixed(0)} KB (oszczędność ${totalSavings}%)`);
