const canvas1 = document.getElementById('canvas-layer1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas-layer2');
const ctx2 = canvas2.getContext('2d'); // For future use
const canvas3 = document.getElementById('canvas-layer3');
const ctx3 = canvas3.getContext('2d');

const img1 = new Image();
const img3 = new Image();

let bgLayer1Loaded = false;
let bgLayer2Loaded = false;

let rainDrops = [];
const NUM_DROPS = 300; // Number of raindrops
let animationFrameId = null;

img1.onload = function () {
  bgLayer1Loaded = true;
  if (bgLayer2Loaded) {
    resizeAndDraw();
    if (!animationFrameId) { // Start animation when both images loaded
      animate();
    }
  }
};
img1.src = './assets/bg-layer1.png'; // Updated path

img3.onload = function () {
  bgLayer2Loaded = true;
  if (bgLayer1Loaded) {
    resizeAndDraw();
    if (!animationFrameId) { // Start animation when both images loaded
      animate();
    }
  }
};
img3.src = './assets/bg-layer2.png'; // Updated path

function drawImageCover(ctx, img, canvas) {
  const dpr = window.devicePixelRatio || 1;
  const canvasLogicalWidth = canvas.width / dpr;
  const canvasLogicalHeight = canvas.height / dpr;

  const imgWidth = img.width;
  const imgHeight = img.height;

  const scaleX = canvasLogicalWidth / imgWidth;
  const scaleY = canvasLogicalHeight / imgHeight;
  const scale = Math.max(scaleX, scaleY); // Use the larger scale factor to cover

  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;

  // Center the image
  const offsetX = (canvasLogicalWidth - drawWidth) / 2;
  const offsetY = (canvasLogicalHeight - drawHeight) / 2;

  ctx.clearRect(0, 0, canvasLogicalWidth, canvasLogicalHeight); // Clear canvas before drawing
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function createRainDrop(canvasLogicalWidth, canvasLogicalHeight) {
  return {
    x: Math.random() * canvasLogicalWidth,
    y: Math.random() * canvasLogicalHeight, // Start at random y for initial fill
    length: Math.random() * 20 + 10,
    speed: Math.random() * 15 + 12, // Speed tripled: min 12, max 27 (previously 4 to 9)
    opacity: Math.random() * 0.5 + 0.2 // Varying opacity
  };
}

function initRain(canvas) {
  rainDrops = [];
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;
  for (let i = 0; i < NUM_DROPS; i++) {
    rainDrops.push(createRainDrop(logicalWidth, logicalHeight));
  }
}

// This function now only draws the rain based on the rainDrops array
function drawRain(ctx) { // canvas parameter is no longer needed if ctx is already scaled
  ctx.lineCap = 'round';
  rainDrops.forEach(drop => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    // Angled rain, adjust multiplier for more/less angle
    ctx.lineTo(drop.x - drop.length / 5, drop.y + drop.length);
    ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
    // Varying line width for a bit more realism, could also be a drop property
    ctx.lineWidth = Math.random() * 1.5 + 0.5;
    ctx.stroke();
  });
}

function updateRain(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  rainDrops.forEach(drop => {
    drop.y += drop.speed;
    drop.x -= drop.speed / 5; // Adjust x for angled fall, consistent with drawRain lineTo

    // If drop moves off bottom or too far left, reset it
    if (drop.y > logicalHeight || drop.x < -drop.length) { // Check x boundary as well
      drop.y = 0 - drop.length; // Reset to top, just above the screen
      drop.x = Math.random() * logicalWidth; // New random x within canvas width
      // Optionally, re-randomize other properties
      drop.speed = Math.random() * 15 + 12; // Keep consistent with createRainDrop (tripled speed)
      drop.opacity = Math.random() * 0.5 + 0.2;
    }
  });
}

function animate() {
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth2 = canvas2.width / dpr;
  const logicalHeight2 = canvas2.height / dpr;

  ctx2.clearRect(0, 0, logicalWidth2, logicalHeight2);

  // Draw the night overlay on ctx2
  ctx2.fillStyle = 'rgba(0, 0, 50, 0.3)';
  ctx2.fillRect(0, 0, logicalWidth2, logicalHeight2);

  updateRain(canvas2);
  drawRain(ctx2); // Pass only ctx2 as it's already scaled

  animationFrameId = requestAnimationFrame(animate);
}

function resizeAndDraw() {
  const container = document.querySelector('.canvas-container');
  const dpr = window.devicePixelRatio || 1;

  // Set canvas dimensions based on container size
  [canvas1, canvas2, canvas3].forEach(canvas => {
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); // Scale once after setting dimensions
  });

  // Initialize or re-initialize rain for canvas2
  initRain(canvas2);

  // Draw images
  if (bgLayer1Loaded) {
    drawImageCover(ctx1, img1, canvas1); // Pass canvas itself to drawImageCover
  }
  // Layer 2 is intentionally left blank for now.

  if (bgLayer2Loaded) {
    drawImageCover(ctx3, img3, canvas3); // Pass canvas itself to drawImageCover
  }

  // Animation loop handles drawing on ctx2 (overlay and rain)
  // If animation is not running, start it.
  // This check is also in onload, but good to have here for direct resize calls if any.
  if (!animationFrameId && bgLayer1Loaded && bgLayer2Loaded) {
    animate();
  }
}

// Initial draw and animation start will be triggered by image loads

// Adjust canvas on window resize
window.addEventListener('resize', () => {
  // Stop existing animation before re-initializing, to avoid potential issues.
  // Though, initRain and the continuous loop should handle it gracefully.
  // if (animationFrameId) {
  //   cancelAnimationFrame(animationFrameId);
  //   animationFrameId = null; 
  // }
  resizeAndDraw();
}); 