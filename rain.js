// rain.js

const NUM_DROPS = 300;
let rainDrops = [];
let canvasContextForRain = null; // Store canvas reference for logical dimensions

function createRainDropInternal(canvasLogicalWidth, canvasLogicalHeight) {
  return {
    x: Math.random() * canvasLogicalWidth,
    y: Math.random() * canvasLogicalHeight, // Start drops spread over the canvas
    length: Math.random() * 20 + 10,
    speed: Math.random() * 15 + 12,
    opacity: Math.random() * 0.5 + 0.2
  };
}

export function initializeRain(canvas) {
  if (!canvas) return;
  canvasContextForRain = canvas; // Keep a reference to the canvas
  rainDrops = [];
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;
  for (let i = 0; i < NUM_DROPS; i++) {
    rainDrops.push(createRainDropInternal(logicalWidth, logicalHeight));
  }
}

export function updateRainState() {
  if (!canvasContextForRain || rainDrops.length === 0) return;
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvasContextForRain.width / dpr;
  const logicalHeight = canvasContextForRain.height / dpr;

  rainDrops.forEach(drop => {
    drop.y += drop.speed;
    drop.x -= drop.speed / 5; // Angled rain

    // If drop goes off screen, reset its position
    if (drop.y > logicalHeight || drop.x < -drop.length) {
      // Reset to a position above the canvas, randomly distributed horizontally
      drop.y = Math.random() * -logicalHeight / 4; // Start slightly above and staggered
      drop.x = Math.random() * (logicalWidth + 50) - 25; // Allow some spread beyond canvas width for better entry
    }
  });
}

export function drawRainOnCanvas(ctx) {
  if (!ctx || rainDrops.length === 0) return;
  ctx.lineCap = 'round';
  rainDrops.forEach(drop => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.length / 10, drop.y + drop.length); // Adjusted angle slightly
    ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
    ctx.lineWidth = Math.random() * 1.2 + 0.3; // Adjusted thickness variation
    ctx.stroke();
  });
}

// Lightning Effect Logic
const MIN_LIGHTNING_INTERVAL = 3000;
const MAX_LIGHTNING_INTERVAL = 6000;
const LIGHTNING_DURATION = 80;

let lightningActive = false;
let lightningTimeoutId = null;
let canvasContextForLightning = null;

function triggerLightningInternal() {
  lightningActive = true;
  setTimeout(() => {
    lightningActive = false;
  }, LIGHTNING_DURATION);
  scheduleNextLightningInternal();
}

function scheduleNextLightningInternal() {
  if (lightningTimeoutId) {
    clearTimeout(lightningTimeoutId);
  }
  if (!canvasContextForLightning) return; // Don't schedule if not initialized

  const interval = Math.random() * (MAX_LIGHTNING_INTERVAL - MIN_LIGHTNING_INTERVAL) + MIN_LIGHTNING_INTERVAL;
  lightningTimeoutId = setTimeout(triggerLightningInternal, interval);
}

export function initializeLightning(canvas) {
  if (!canvas) return;
  canvasContextForLightning = canvas;
  lightningActive = false; // Reset state
  if (lightningTimeoutId) {
    clearTimeout(lightningTimeoutId);
    lightningTimeoutId = null;
  }
  scheduleNextLightningInternal();
}

export function drawLightning(ctx) {
  if (!lightningActive || !canvasContextForLightning || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvasContextForLightning.width / dpr;
  const logicalHeight = canvasContextForLightning.height / dpr;

  ctx.fillStyle = 'rgba(255, 255, 224, 0.6)';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
}

export function clearLightning() {
  if (lightningTimeoutId) {
    clearTimeout(lightningTimeoutId);
    lightningTimeoutId = null;
  }
  lightningActive = false;
  // canvasContextForLightning = null; // Optionally clear context
} 