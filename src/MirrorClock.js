/**
 * createMirrorClock
 * -------------------
 * Zwykły zegar pokazujący prawdziwy, bieżący czas — ale wskazówki idą
 * w LEWO zamiast w prawo. To celowe: świat Lumina Vivens ma swój własny
 * kierunek czasu, inny niż ten na Twoim nadgarstku. Sam mechanizm jest
 * identyczny jak w zwykłym zegarze — zmienia się tylko znak kąta.
 *
 * To zwykły element HTML (canvas), nie obiekt 3D w scenie — aktualizuje
 * się raz na sekundę przez setInterval, niezależnie od pętli animacji
 * gry (bo to prawdziwy zegar, nie coś powiązanego z czasem rozgrywki).
 */
export function createMirrorClock() {
  const canvas = document.createElement('canvas');
  canvas.width = 84;
  canvas.height = 84;
  canvas.style.position = 'fixed';
  canvas.style.top = '16px';
  canvas.style.left = '16px';
  canvas.style.zIndex = '150';
  canvas.style.opacity = '0.85';
  canvas.style.pointerEvents = 'none';
  canvas.style.filter = 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))';
  canvas.title = 'Czas płynie tu w drugą stronę';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = cx - 6;

  function drawHand(angle, length, width, color) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(angle) * length, cy - Math.cos(angle) * length);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function draw() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tarcza
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 14, 22, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Znaczniki godzin
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const inner = radius - 6;
      const outer = radius - 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.sin(angle) * inner, cy - Math.cos(angle) * inner);
      ctx.lineTo(cx + Math.sin(angle) * outer, cy - Math.cos(angle) * outer);
      ctx.strokeStyle = 'rgba(244, 241, 234, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Kąty ZE ZNAKIEM MINUS — cała "zasada" tego zegara. Zwykły wzór na
    // kąt wskazówki (jak w każdym zegarze świata) liczony jest normalnie,
    // ale rysowany w przeciwną stronę
    const minuteAngle = -((minutes + seconds / 60) / 60) * Math.PI * 2;
    const hourAngle = -((hours + minutes / 60) / 12) * Math.PI * 2;

    drawHand(hourAngle, radius * 0.5, 2.5, '#f4e4c1');
    drawHand(minuteAngle, radius * 0.75, 1.5, '#f4e4c1');

    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
  }

  draw();
  const intervalId = setInterval(draw, 1000);

  return {
    dispose() {
      clearInterval(intervalId);
      canvas.remove();
    },
  };
}
