# Lumina Vivens — szkielet WebXR

Minimalny, ale kompletny fundament: scena Three.js, avatar poruszający się
WASD-em, kamera trzecioosobowa, przycisk wejścia w VR. Zbudowany tak, żeby
łatwo się rozrastał — nie jako gotowy produkt, tylko punkt startowy.

## Uruchomienie lokalnie

Wymaga zainstalowanego [Node.js](https://nodejs.org) (wersja 18+).

```bash
npm install
npm run dev
```

Otworzy się adres (zwykle `http://localhost:5173`) — działa w każdej
nowoczesnej przeglądarce. Testowanie WebXR (przycisk "ENTER VR") wymaga
albo gogli podłączonych do komputera, albo telefonu z obsługą WebXR
(Quest Browser itp.) w tej samej sieci co komputer — wtedy zamiast
`localhost` użyj adresu IP komputera w sieci lokalnej.

## Budowanie do wdrożenia

```bash
npm run build
```

Wynik trafia do folderu `dist/` — to gotowe, statyczne pliki (HTML, JS, CSS).

## Wdrożenie na LH.pl (hosting współdzielony)

1. Wykonaj `npm run build`.
2. Zawartość folderu `dist/` wgraj przez FTP do katalogu `public_html/`
   swojej domeny (np. `luminavivens.eu`) w panelu LH.pl.
3. Gotowe — strona działa jak każda inna statyczna strona WWW. WebXR
   wymaga połączenia przez `https://`, które już masz skonfigurowane
   (certyfikat SSL na domenie).

## Struktura projektu

```
index.html                — punkt wejścia, HUD, powiadomienia (toast)
src/main.js                — scena, kamera, światła, pętla animacji
src/PlayerController.js     — logika ruchu i skoku avatara (niezależna od źródła inputu)
src/KeyboardInput.js        — mapuje klawiaturę na stan zrozumiały dla PlayerControllera
src/PuzzleManager.js        — wczytuje manifest.json, umieszcza elementy w scenie, wykrywa zebranie
public/manifest.json        — lista elementów świata (edytujesz TO, nie kod)
```

## Jak dokładać nowe elementy do świata (system puzzli)

Otwórz `public/manifest.json` i dopisz kolejny wpis:

```json
{
  "id": "piece-005",
  "name": "Kolejny Fragment",
  "description": "Opis, na razie nieużywany w UI, ale przyda się później",
  "world": "energetyczny",
  "layer": 2,
  "position": [12, 0, -3],
  "pickupRadius": 1.3,
  "glbUrl": null
}
```

- `id` musi być unikalny — na jego podstawie zapisuje się w `localStorage`
  przeglądarki, czy element został już znaleziony (odświeżenie strony nie
  zeruje postępu).
- `world` — jeden z czterech światów: `fizyczny`, `energetyczny`, `pustka`,
  `duchowy`. Determinuje kształt, kolor, wysokość i sposób pulsowania —
  cała ta stylistyka jest zdefiniowana w jednym miejscu, w obiekcie
  `WORLD_STYLES` na górze `src/PuzzleManager.js`. Zmieniasz tam kolor albo
  kształt raz, a zmienia się wygląd wszystkich elementów danego świata.
- `layer` — numer warstwy. Elementy pokazują się WARSTWAMI — dopóki nie
  zbierzesz wszystkich elementów bieżącej warstwy, kolejne się nie
  pojawiają. Po ukończeniu warstwy "wraca ona do oceanu" (znika) i
  odsłania się następna, z krótką przerwą i komunikatem na ekranie.
- `position` to `[x, y, z]` w świecie 3D — wysokość (`y`) i tak zostanie
  dodatkowo przesunięta w górę/dół zależnie od świata (patrz `heightOffset`
  w `WORLD_STYLES`), więc zwykle wystarczy `0`.
- `pickupRadius` — jak blisko musi podejść avatar, żeby element zniknął.
- `glbUrl` — zostaw `null`, żeby zobaczyć symboliczny placeholder danego
  świata. Kiedy będziesz gotowy, wstaw tam ścieżkę do własnego modelu
  (np. `/models/relikwia.glb`, plik wrzucony do `public/models/`) —
  PuzzleManager sam go wczyta i podmieni placeholder, gdy tylko się pobierze.

Nie trzeba nic przebudowywać ani dotykać kodu — samo dopisanie wpisu do
`manifest.json` i odświeżenie strony wystarczy.

### Język wizualny światów

| Świat | Kształt | Charakter |
|---|---|---|
| `fizyczny` | dwunastościan, ostro fasetowany | nisko, blisko ziemi, stabilny — bez pulsowania |
| `energetyczny` | ośmiościan, siatka (wireframe) | uniesiony, wyraźnie pulsuje jak żywa sieć |
| `pustka` | mały, ciemny sześcian z iskrą | ledwo dostrzegalny, na wysokości ziemi |
| `duchowy` | promienisty stożek | najwyżej, najjaśniejszy, silne pulsowanie |

## Przykładowe modele .glb (prawdziwe relikwie)

W `public/models/` znajdują się cztery gotowe pliki `.glb` — po jednym na
świat (`relikwia-fizyczny.glb`, `relikwia-energetyczny.glb`,
`relikwia-pustka.glb`, `relikwia-duchowy.glb`). To nie placeholdery —
to prawdziwe, wygenerowane modele złożone z kilku brył każdy (np. relikwia
fizyczna to klaster kilku fasetowanych kryształów, duchowa to rdzeń z
ośmioma promieniami skierowanymi na zewnątrz). `manifest.json` już
wskazuje na nie przez pole `glbUrl`, więc od razu zobaczysz je w scenie
zamiast prostych brył-placeholderów.

Modele zostały wygenerowane skryptem `scripts/export-relics.mjs` —
w 100% proceduralnie, z podstawowych geometrii Three.js (bez żadnych
zewnętrznych assetów, więc zero wątpliwości co do praw autorskich).
Jeśli chcesz zmienić ich wygląd (inny kształt, więcej elementów, inne
proporcje), edytujesz ten skrypt i uruchamiasz ponownie:

```bash
npm run generate:relics
```

Nadpisze to pliki w `public/models/` nowymi wersjami.

### Podmiana na własne modele (Blender, Mixamo, gotowe assety)

Kiedy będziesz gotowy na coś bardziej rozbudowanego niż proceduralne
bryły, możesz podmienić dowolny plik w `public/models/` na własny,
wyeksportowany z Blendera albo pobrany z serwisu z darmowymi modelami:

- **Blender** — modelujesz, potem `File → Export → glTF 2.0 (.glb/.gltf)`,
  format binarny (.glb). Warto trzymać model w skali zbliżonej do metra
  (jednostki Three.js) i nie przesadzać z liczbą wielokątów — to ma
  chodzić płynnie w przeglądarce, także na słabszych urządzeniach.
- **Sketchfab** (sketchfab.com) — mnóstwo darmowych modeli do pobrania
  w formacie glTF, filtruj po licencji CC0 / CC-BY (ta druga wymaga
  wskazania autora).
- **Poly Pizza** (poly.pizza) — proste, niskopoligonowe modele, od razu
  w formacie glTF, świetne pod tę stylistykę.
- **Mixamo** (mixamo.com, za darmo, konto Adobe) — to raczej pod
  animowanego avatara niż elementy świata, ale warto wiedzieć, że
  istnieje — stamtąd pobierzesz gotowe, ożywione modele postaci z
  animacjami chodu/biegu, o czym mowa niżej w sekcji o avatarze.

Niezależnie od źródła, plik `.glb` wrzucasz do `public/models/`, a w
`manifest.json` w polu `glbUrl` wpisujesz ścieżkę do niego — reszta
(wczytanie, podmiana placeholdera, pozycja, pulsowanie) dzieje się sama.

## Edytor manifestu — wizualne rozstawianie elementów (bez ręcznego JSON-a)

Zamiast zgadywać współrzędne `[x, y, z]` w pliku tekstowym, możesz użyć
`public/manifest-editor.html` — samodzielnego narzędzia, które chodzi w
przeglądarce niezależnie od reszty gry.

**Uruchomienie:** przy działającym `npm run dev` wejdź na
`http://localhost:5173/manifest-editor.html` (albo po prostu otwórz ten
plik dwuklikiem — działa też bez serwera, bo korzysta z Three.js
wprost z CDN, tak jak Twoje wcześniejsze samodzielne strony).

**Jak działa:**
1. Klikasz kafelek świata (fizyczny/energetyczny/pustka/duchowy) —
   pojawia się placeholder w losowym miejscu na scenie.
2. Klikasz obiekt, żeby go zaznaczyć — pojawia się gizmo (uchwyt) do
   przeciągania myszką. Przyciski **Przesuń / Obróć / Skaluj** zmieniają
   tryb gizma.
3. W panelu po prawej ustawiasz nazwę, świat, warstwę, promień zebrania,
   oraz docelową ścieżkę pliku `.glb` (pole `glbUrl`).
4. Możesz też wczytać prawdziwy model — wklej URL (np.
   `/models/relikwia-fizyczny.glb`) albo wrzuć plik z dysku (to tylko
   podgląd — i tak musisz fizycznie skopiować plik do `public/models/`,
   edytor tylko pomaga ustawić pozycję/skalę/obrót patrząc na wynik).
   Model **automatycznie skaluje się** do rozsądnego rozmiaru — nie
   musisz już zgadywać `scale` na oko.
5. Kiedy scena wygląda tak jak chcesz, klikasz **"Eksportuj
   manifest.json"** — pobiera się gotowy plik, który podmieniasz w
   `public/manifest.json`.

To narzędzie **eksportuje cały układ na raz** (nadpisuje całą listę
`pieces`) — traktuj je jako piaskownicę do układania całej sceny, a nie
do dopisywania pojedynczych elementów do istniejącego manifestu.

## Sterowanie

Model "czołgowy" — przewidywalny i odporny na dziwne skoki kierunku:

- **W / S** — ruch wzdłuż aktualnego kierunku patrzenia (przód / tył)
- **A / D** — obrót w miejscu, ciągły, dopóki trzymasz klawisz; puszczenie
  zostawia avatar dokładnie w tej pozycji obrotu, w której się zatrzymał —
  żadnego automatycznego "wracania" do jakiegoś ustalonego kąta
- **Shift** — bieg
- **Spacja** — skok (prosta grawitacja, płaska ziemia na `y = 0`; kiedy
  dojdzie teren z wysokościami, `PlayerController.update()` to jedyne
  miejsce, które trzeba rozbudować o raycasting w dół)

Kierunek patrzenia avatara (`heading`) zmienia się WYŁĄCZNIE przez A/D —
nigdy nie jest przeliczany na nowo na podstawie kierunku ruchu. To
celowo prostsza zasada niż "avatar obraca się w stronę, w którą idzie" —
tamten model, mimo że intuicyjny, przy szybkich zmianach kierunku
generował niejednoznaczności (przy obrotach bliskich 180°) i widoczne
opóźnienia. Sterowanie czołgowe jest w 100% przewidywalne kosztem odrobiny
mniejszej "swobody" ruchu.

## Jak podmienić avatar-placeholder na prawdziwy model

W `src/main.js` funkcja `createPlaceholderAvatar()` tworzy prosty "manekin"
z kapsuły i kuli — wyłącznie do testowania ruchu i kamery. Żeby podmienić
na docelowy, animowany model:

1. Przygotuj model w formacie `.glb` z animacjami (chód, bieg, idle) —
   np. wyeksportowany z Mixamo lub Blendera.
2. Zainstaluj loader (już jest częścią pakietu `three`):
   ```js
   import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
   ```
3. Załaduj model asynchronicznie i podmień `avatar` na `gltf.scene`:
   ```js
   const loader = new GLTFLoader();
   loader.load('/models/avatar.glb', (gltf) => {
     const avatar = gltf.scene;
     scene.add(avatar);

     const mixer = new THREE.AnimationMixer(avatar);
     const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'Walk');
     const walkAction = mixer.clipAction(walkClip);
     // W pętli animate() wywołuj: mixer.update(delta);
     // i przełączaj walkAction.play()/.stop() zależnie od playerController.lastMoving
   });
   ```
4. `PlayerController` i kamera nie wymagają żadnych zmian — operują na
   grupie/obiekcie avatara niezależnie od tego, co jest w środku.

## Dlaczego PlayerController jest oddzielony od klawiatury

To jest fundament pod przyszły multiplayer. `PlayerController.update()`
przyjmuje wyłącznie obiekt `{ forward, backward, left, right, run }` —
nie wie i nie musi wiedzieć, skąd te wartości pochodzą. Dziś wypełnia je
`KeyboardInput`. W przyszłości, gdy dojdzie sieć, wystarczy identyczny
obiekt wypełniać danymi odebranymi z serwera WebSocket
(`wss://ws.luminavivens.eu`) — dla każdego innego gracza tworzysz kolejną
parę (avatar + PlayerController), karmioną stanem z sieci zamiast
klawiatury. Cała logika ruchu, obrotu i płynności zostaje bez zmian.

## Następne kroki (sugerowana kolejność)

1. Podmień avatar-placeholder na prawdziwy model z animacjami (wyżej).
2. Dopracuj sterowanie w VR — obecnie w trybie XR avatar porusza się
   "na sztywno" względem świata; warto dodać teleportację przez
   raycasting z kontrolera (`renderer.xr.getController(0)`).
3. Podłącz się do serwera multiplayer (`wss://ws.luminavivens.eu`) —
   patrz sekcja wyżej.
4. Kiedy elementów w `manifest.json` zrobi się dużo (dziesiątki/setki),
   warto dodać leniwe ładowanie — wczytywać tylko te w promieniu np.
   50 jednostek od avatara, a resztę dopiero gdy się zbliży. Na razie,
   przy garstce elementów, nie jest to potrzebne.
