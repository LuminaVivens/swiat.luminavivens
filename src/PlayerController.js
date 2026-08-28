import * as THREE from 'three';

/**
 * PlayerController
 * -----------------
 * Ta klasa NIE wie skąd bierze się sterowanie — nie zna klawiatury,
 * nie zna kontrolerów VR, nie zna sieci. Przyjmuje wyłącznie "stan wejścia"
 * (inputState) i na jego podstawie porusza obiektem 3D (avatarem).
 *
 * Dzięki temu rozdzieleniu, kiedy w przyszłości dojdzie multiplayer,
 * wystarczy karmić tę samą klasę stanem odebranym z WebSocketa zamiast
 * stanem z klawiatury — reszta (ruch, obrót, płynność) działa bez zmian.
 *
 * Model sterowania: "czołgowy". Lewo/prawo OBRACA avatara w miejscu,
 * ciągle, dopóki trzymasz klawisz — puszczenie zostawia go dokładnie
 * w tej pozycji obrotu, w której się zatrzymał (żadnego automatycznego
 * "wracania" do jakiegoś ustalonego kąta). Przód/tył zawsze porusza
 * avatarem wzdłuż kierunku, w który w danej chwili patrzy — kierunek
 * patrzenia zmienia się WYŁĄCZNIE przez lewo/prawo, nigdy automatycznie.
 *
 * inputState to zwykły obiekt: { forward, backward, left, right, run, jump }
 * — wartości boolean. Ktokolwiek go wypełnia (klawiatura, VR, sieć),
 * PlayerControllerowi jest to obojętne.
 */
export class PlayerController {
  constructor(
    avatarGroup,
    { walkSpeed = 2.2, runSpeed = 4.5, turnRate = 3, jumpSpeed = 5.5, gravity = -18 } = {}
  ) {
    this.avatar = avatarGroup;
    this.walkSpeed = walkSpeed;
    this.runSpeed = runSpeed;
    this.turnRate = turnRate; // radiany na sekundę — jak szybko obraca się w miejscu
    this.jumpSpeed = jumpSpeed;
    this.gravity = gravity;

    // Kierunek patrzenia avatara (kąt w radianach wokół osi Y). To jedyne
    // źródło prawdy o obrocie — zmienia się tylko w bloku "obrót" poniżej,
    // nigdy nie jest przeliczane na nowo na podstawie kierunku ruchu.
    this.heading = 0;

    // Stan pionowy — osobny od ruchu poziomego, bo grawitacja działa
    // niezależnie od tego, czy avatar w danej chwili idzie czy stoi
    this.velocityY = 0;
    this.grounded = true;

    // Wektory pomocnicze — tworzone raz, żeby nie generować śmieci (garbage)
    // w każdej klatce animacji
    this._facing = new THREE.Vector3();
    this._upAxis = new THREE.Vector3(0, 1, 0);

    // Ostatnio zastosowany stan — przydatne np. do przełączania animacji
    // (idle / walk / run) w kolejnym etapie prac nad avatarem
    this.lastMoving = false;
    this.lastRunning = false;
  }

  /**
   * Wywoływane raz na klatkę.
   * @param {object} inputState - { forward, backward, left, right, run, jump }
   * @param {number} delta - czas od poprzedniej klatki w sekundach
   */
  update(inputState, delta) {
    const { forward = false, backward = false, left = false, right = false, run = false } = inputState;

    // --- Obrót: WYŁĄCZNIE lewo/prawo, ciągły, bez żadnego "celowania"
    // w konkretny kąt. To eliminuje całą wcześniejszą klasę błędów
    // (niejednoznaczność przy 180°, opóźnienie "doganiania" celu) —
    // nie ma tu żadnego celu do dogonienia, jest tylko: kręcimy się,
    // dopóki klawisz jest wciśnięty.
    if (left) this.heading += this.turnRate * delta;
    if (right) this.heading -= this.turnRate * delta;
    this.avatar.quaternion.setFromAxisAngle(this._upAxis, this.heading);

    // Kierunek "do przodu" avatara, wyliczony z aktualnego heading —
    // lokalna oś -Z modelu obrócona o `heading` wokół osi Y
    this._facing.set(-Math.sin(this.heading), 0, -Math.cos(this.heading));

    // --- Ruch: przód/tył wzdłuż aktualnego kierunku patrzenia.
    // dirMultiplier: +1 (przód), -1 (tył), 0 (nic albo oba naraz — anulują się)
    const dirMultiplier = (forward ? 1 : 0) - (backward ? 1 : 0);
    const isMoving = dirMultiplier !== 0;

    if (isMoving) {
      const speed = run ? this.runSpeed : this.walkSpeed;
      this.avatar.position.addScaledVector(this._facing, speed * delta * dirMultiplier);
    }

    this.lastMoving = isMoving;
    this.lastRunning = isMoving && run;

    // Skok i grawitacja — całkowicie niezależne od ruchu poziomego wyżej.
    // Uproszczone wykrywanie podłoża: zakładamy płaską ziemię na y=0.
    // Kiedy dojdzie prawdziwy teren z wysokościami, tu jest miejsce na
    // raycasting w dół zamiast sztywnego "y <= 0".
    if (inputState.jump && this.grounded) {
      this.velocityY = this.jumpSpeed;
      this.grounded = false;
    }

    this.velocityY += this.gravity * delta;
    this.avatar.position.y += this.velocityY * delta;

    if (this.avatar.position.y <= 0) {
      this.avatar.position.y = 0;
      this.velocityY = 0;
      this.grounded = true;
    }
  }
}
