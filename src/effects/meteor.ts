interface MeteorObj {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
  reset: () => void;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D | null) => void;
}

let meteors: MeteorObj[] = [];
let canvasWidth = 0;
let canvasHeight = 0;
let meteorCount = Math.floor(Math.random() * 20) + 20;

let meteorShowerActive = false;
let meteorShowerStartTimeoutId: NodeJS.Timeout | null = null;
let meteorShowerEndTimeoutId: NodeJS.Timeout | null = null;

let showerStartTime: number | null = null;
let showerDuration = 0;
let isWaitingForAllMeteorsToClear = false;
let waitForClearanceFrameId: number | null = null;

class Meteor implements MeteorObj {
  x = 0;
  y = 0;
  length = 0;
  speed = 0;
  angle = Math.PI / 4;
  opacity = 0;
  active = true;

  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvasWidth;
    this.y = -(Math.random() * canvasHeight * 0.5 + 50);
    this.length = Math.random() * 100 + 50;
    this.speed = Math.random() * 3 + 1;
    this.angle = Math.PI / 4;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.active = true;
  }

  update() {
    if (!this.active) return;
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    if (this.y - this.length > canvasHeight || this.x - this.length > canvasWidth || this.x + this.length < 0) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D | null) {
    if (!this.active || !ctx) return;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    const tailX = this.x - this.length * Math.cos(this.angle);
    const tailY = this.y - this.length * Math.sin(this.angle);
    ctx.lineTo(tailX, tailY);
    const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.stroke();
  }
}

function stopWaitingForAllMeteorsToClear() {
  isWaitingForAllMeteorsToClear = false;
  if (waitForClearanceFrameId) {
    cancelAnimationFrame(waitForClearanceFrameId);
    waitForClearanceFrameId = null;
  }
}

function clearScheduledShowers() {
  if (meteorShowerStartTimeoutId) clearTimeout(meteorShowerStartTimeoutId);
  if (meteorShowerEndTimeoutId) clearTimeout(meteorShowerEndTimeoutId);
  meteorShowerStartTimeoutId = null;
  meteorShowerEndTimeoutId = null;
  meteorShowerActive = false;
  stopWaitingForAllMeteorsToClear();
}

function checkAllMeteorsClearedLoop() {
  if (!isWaitingForAllMeteorsToClear) return;
  let allCleared = true;
  for (const meteor of meteors) {
    if (meteor.active) {
      allCleared = false;
      break;
    }
  }
  if (allCleared) {
    stopWaitingForAllMeteorsToClear();
    scheduleNextShower();
  } else {
    waitForClearanceFrameId = requestAnimationFrame(checkAllMeteorsClearedLoop);
  }
}

function startCurrentMeteorShower() {
  meteorShowerActive = true;
  showerStartTime = Date.now();
  showerDuration = Math.random() * 10000 + 20000;

  meteors = [];
  for (let i = 0; i < meteorCount; i++) {
    meteors.push(new Meteor());
  }

  if (meteorShowerEndTimeoutId) clearTimeout(meteorShowerEndTimeoutId);
  meteorShowerEndTimeoutId = setTimeout(endCurrentMeteorShower, showerDuration);
}

function endCurrentMeteorShower() {
  meteorShowerActive = false;
  showerStartTime = null;
  if (!isWaitingForAllMeteorsToClear) {
    isWaitingForAllMeteorsToClear = true;
    checkAllMeteorsClearedLoop();
  }
}

function scheduleNextShower() {
  stopWaitingForAllMeteorsToClear();
  const interval = Math.random() * 8000 + 2000;
  if (meteorShowerStartTimeoutId) clearTimeout(meteorShowerStartTimeoutId);
  meteorShowerStartTimeoutId = setTimeout(startCurrentMeteorShower, interval);
}

export function initializeMeteors(canvas: HTMLCanvasElement | null, count: number = meteorCount) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvasWidth = canvas.width / dpr;
  canvasHeight = canvas.height / dpr;
  meteorCount = count === undefined ? Math.floor(Math.random() * 20) + 20 : count;

  clearScheduledShowers();
  meteors = [];
  scheduleNextShower();
}

export function updateMeteorsState() {
  let currentActiveCount = 0;
  meteors.forEach(meteor => {
    if (meteor.active) currentActiveCount++;
  });

  let targetPopulation = 0;
  if (meteorShowerActive && showerStartTime && showerDuration > 0) {
    const elapsedTime = Date.now() - showerStartTime;
    const progress = Math.min(elapsedTime / showerDuration, 1.0);
    if (progress < 0.3) {
      targetPopulation = Math.ceil(meteorCount * (progress / 0.3));
    } else {
      targetPopulation = Math.ceil(meteorCount * ((1 - progress) / 0.7));
    }
    targetPopulation = Math.max(0, Math.min(meteorCount, targetPopulation));
  }

  meteors.forEach(meteor => {
    if (meteor.active) {
      meteor.update();
      if (!meteor.active) currentActiveCount--;
    }
  });

  if (meteorShowerActive) {
    for (let i = 0; i < meteors.length; i++) {
      if (currentActiveCount >= targetPopulation) break;
      if (!meteors[i].active) {
        meteors[i].reset();
        currentActiveCount++;
      }
    }
  }
}

export function drawMeteorsOnCanvas(ctx: CanvasRenderingContext2D | null) {
  if (!ctx) return;
  meteors.forEach(meteor => {
    meteor.draw(ctx);
  });
}

export function clearMeteors() {
  clearScheduledShowers();
  meteors = [];
}
