// =====================================================
// Στάσιμο κύμα σε χορδή
// Κοιλία στο x = 0 – Δεσμός στο x = L
// Με διακόπτη Slow Motion
// =====================================================


// =====================================================
// VIEWPORT
// =====================================================
function getViewportHeight() {
  return window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
}

// =====================================================
// ΣΤΑΘΕΡΕΣ UI
// =====================================================
const CONTROL_BAR_HEIGHT = 160;
const BASE_DT = 0.02;   // βασικό χρονικό βήμα

// =====================================================
// ΦΥΣΙΚΕΣ ΠΑΡΑΜΕΤΡΟΙ
// =====================================================
const L = 0.65;   // m
let u = 120;      // m/s
let A = 60;       // px

// =====================================================
// CANVAS
// =====================================================
let L_draw = 600;
let scale;

// =====================================================
// UI
// =====================================================
let nSlider, uSlider;
let soundToggle, slowToggle;
let controlBar, nBlock, uBlock, soundBlock, slowBlock;

// =====================================================
// ΗΧΟΣ
// =====================================================
let osc;
let t = 0;


// =====================================================
// SETUP
// =====================================================
function setup() {

  const canvas = createCanvas(
    windowWidth,
    getViewportHeight() - CONTROL_BAR_HEIGHT
  );
  canvas.parent('stasima2-holder');

  // ---------- Control bar ----------
  controlBar = createDiv();
  controlBar.parent('stasima2-holder');
  controlBar.style('position', 'fixed');
  controlBar.style('left', '0');
  controlBar.style('bottom', '0');
  controlBar.style('width', '100%');
  controlBar.style('height', CONTROL_BAR_HEIGHT + 'px');
  controlBar.style('display', 'flex');
  controlBar.style('justify-content', 'center');
  controlBar.style('align-items', 'flex-start');
  controlBar.style('gap', '32px');
  controlBar.style('padding', '10px');
  controlBar.style('background', 'rgba(0,0,0,0.92)');
  controlBar.style('border-top', '1px solid #444');
  controlBar.style('flex-wrap', 'wrap');
  controlBar.style('color', 'white');

  // ---------- Αρμονική ----------
  nBlock = createDiv();
  nBlock.parent(controlBar);
  nBlock.style('text-align', 'center');
  nBlock.html('<b>Αρμονική N (περιττές)</b><br>');
  nSlider = createSlider(0, 6, 0, 1);
  nSlider.parent(nBlock);

  // ---------- Ταχύτητα ----------
  uBlock = createDiv();
  uBlock.parent(controlBar);
  uBlock.style('text-align', 'center');
  uBlock.html(
    'Ταχύτητα διάδοσης u (m/s)<br>' +
    '<span style="font-size:12px">(εξαρτάται από την τάση)</span><br>'
  );
  uSlider = createSlider(80, 160, 120, 5);
  uSlider.parent(uBlock);

  // ---------- Ήχος ----------
  soundBlock = createDiv();
  soundBlock.parent(controlBar);
  soundBlock.style('text-align', 'center');
  soundBlock.html('Ήχος<br>');
  soundToggle = createCheckbox(' Ενεργοποίηση', false);
  soundToggle.parent(soundBlock);

  soundToggle.changed(() => {
    if (soundToggle.checked()) userStartAudio();
  });

  // ---------- Slow Motion ----------
  slowBlock = createDiv();
  slowBlock.parent(controlBar);
  slowBlock.style('text-align', 'center');
  slowBlock.html('Slow motion<br>');
  slowToggle = createCheckbox(' Ενεργοποίηση', true);
  slowToggle.parent(slowBlock);

  // ---------- Oscillator ----------
  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0);
}


// =====================================================
// RESIZE
// =====================================================
function windowResized() {
  resizeCanvas(
    windowWidth,
    getViewportHeight() - CONTROL_BAR_HEIGHT
  );
}


// =====================================================
// DRAW
// =====================================================
function draw() {

  background(0);

  const N = nSlider.value();
  u = uSlider.value();

  const f = ((2 * N + 1) * u) / (4 * L);
  const lambda = (4 * L) / (2 * N + 1);
  const omega = TWO_PI * f;

  scale = min(L_draw, width * 0.92) / L;

  // ---------- Ήχος ----------
  if (soundToggle.checked()) {
    osc.freq(f);
    osc.amp(0.25, 0.1);
  } else {
    osc.amp(0, 0.2);
  }

  // ---------- Χορδή ----------
  const stringY = height * 0.28;

  push();
  translate((width - L * scale) / 2, stringY);

  // γραμμή ισορροπίας
  stroke(200);
  line(0, 0, L * scale, 0);

  // στάσιμο κύμα
  stroke(0, 170, 255);
  noFill();
  beginShape();
  for (let x = 0; x <= L * scale; x += 1) {
    const x_phys = x / scale;
    const y =
      2 * A *
      cos((TWO_PI * x_phys) / lambda) *
      sin(omega * t);
    vertex(x, y);
  }
  endShape();

  // δεσμός στο x = L
  stroke(255, 80, 80);
  line(L * scale, -10, L * scale, 10);

  pop();

  // ---------- Πληροφορίες ----------
  fill(255);
  noStroke();
  textAlign(CENTER);
  textSize(14);

  const infoY = height * 0.62;

  text('Χορδή με κοιλία στο x = 0 και δεσμό στο x = L', width / 2, infoY - 60);
  text(`N = ${N}  →  αρμονική ${2 * N + 1}`, width / 2, infoY - 35);
  text(`u = ${u} m/s`, width / 2, infoY - 10);
  text(`f = ${f.toFixed(1)} Hz   |   λ = ${lambda.toFixed(2)} m`, width / 2, infoY + 15);
  text('Τύπος: fₙ = (2N+1)·u / (4·L)', width / 2, infoY + 40);

  if (slowToggle.checked()) {
    text('Slow motion ενεργό', width / 2, infoY + 65);
  }

  
if (!slowToggle.checked()) {
  text(
    'Γρήγορη ταλάντωση – φαίνεται στιγμιότυπο',
    width / 2,
    infoY + 85
  );
}


  // ---------- Χρόνος ----------
  let dt = BASE_DT;
  if (slowToggle.checked()) {
    dt = BASE_DT / (N + 1);
  }
  t += dt;
}
