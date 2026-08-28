/**
 * KeyboardInput
 * -------------
 * Zamienia wciśnięte klawisze na "stan wejścia" zrozumiały dla
 * PlayerControllera. To jedno z wielu możliwych źródeł sterowania —
 * w przyszłości obok niej stanie np. VRInput albo NetworkInput,
 * a PlayerController pozostanie niezmieniony.
 */
export class KeyboardInput {
  constructor() {
    this.state = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      run: false,
      jump: false,
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _setFromCode(code, value) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = value;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = value;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = value;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = value;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.run = value;
        break;
      case 'Space':
        this.state.jump = value;
        break;
    }
  }

  _onKeyDown(e) {
    // Gdy piszesz w polu tekstowym (np. wpisujesz imię), klawiatura ma
    // służyć do pisania, nie do poruszania avatarem
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    // Zapobiega przewijaniu strony spacją, gdy gramy w przeglądarce
    if (e.code === 'Space') e.preventDefault();
    this._setFromCode(e.code, true);
  }

  _onKeyUp(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    this._setFromCode(e.code, false);
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
