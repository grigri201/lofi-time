const NUM_DROPS = 300;
interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

let rainDrops: RainDrop[] = [];
let canvasContextForRain: HTMLCanvasElement | null = null;

function createRainDropInternal(width: number, height: number): RainDrop {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    length: Math.random() * 20 + 10,
    speed: Math.random() * 15 + 12,
    opacity: Math.random() * 0.5 + 0.2
  };
}

export function initializeRain(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  canvasContextForRain = canvas;
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
    drop.x -= drop.speed / 5;
    if (drop.y > logicalHeight || drop.x < -drop.length) {
      drop.y = Math.random() * -logicalHeight / 4;
      drop.x = Math.random() * (logicalWidth + 50) - 25;
    }
  });
}

export function drawRainOnCanvas(ctx: CanvasRenderingContext2D | null) {
  if (!ctx || rainDrops.length === 0) return;
  ctx.lineCap = 'round';
  rainDrops.forEach(drop => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.length / 10, drop.y + drop.length);
    ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
    ctx.lineWidth = Math.random() * 1.2 + 0.3;
    ctx.stroke();
  });
}

const MIN_LIGHTNING_INTERVAL = 3000;
const MAX_LIGHTNING_INTERVAL = 6000;
const LIGHTNING_DURATION = 80;

let lightningActive = false;
let lightningTimeoutId: NodeJS.Timeout | null = null;
let canvasContextForLightning: HTMLCanvasElement | null = null;

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
  if (!canvasContextForLightning) return;
  const interval = Math.random() * (MAX_LIGHTNING_INTERVAL - MIN_LIGHTNING_INTERVAL) + MIN_LIGHTNING_INTERVAL;
  lightningTimeoutId = setTimeout(triggerLightningInternal, interval);
}

export function initializeLightning(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  canvasContextForLightning = canvas;
  lightningActive = false;
  if (lightningTimeoutId) {
    clearTimeout(lightningTimeoutId);
    lightningTimeoutId = null;
  }
  scheduleNextLightningInternal();
}

export function drawLightning(ctx: CanvasRenderingContext2D | null) {
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
}
