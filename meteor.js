// meteor.js

// Array to store meteor objects
let meteors = [];
let canvasWidth = 0;
let canvasHeight = 0;
// User-defined: Default count, overridden by initializeMeteors if a new count is passed
let meteorCount = Math.floor(Math.random() * 20) + 20;

let meteorShowerActive = false;
let meteorShowerStartTimeoutId = null;
let meteorShowerEndTimeoutId = null;

// Variables to manage shower dynamics
let showerStartTime = null;
let showerDuration = 0; // Duration of the current shower in ms

// Variables for waiting logic
let isWaitingForAllMeteorsToClear = false;
let waitForClearanceFrameId = null;

/**
 * Represents a single meteor.
 */
class Meteor {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvasWidth;
    // User-defined: this.y starts further up
    this.y = - (Math.random() * canvasHeight * 0.5 + 50);
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

  draw(ctx) {
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
  stopWaitingForAllMeteorsToClear(); // Also stop the waiting process
}

function checkAllMeteorsClearedLoop() {
  if (!isWaitingForAllMeteorsToClear) {
    // Waiting was cancelled (e.g., by clearMeteors or initializeMeteors)
    return;
  }

  let allCleared = true;
  for (const meteor of meteors) {
    if (meteor.active) {
      allCleared = false;
      break;
    }
  }

  if (allCleared) {
    stopWaitingForAllMeteorsToClear();
    scheduleNextShower(); // All meteors are off-screen, now schedule the next shower
  } else {
    waitForClearanceFrameId = requestAnimationFrame(checkAllMeteorsClearedLoop);
  }
}

function startCurrentMeteorShower() {
  meteorShowerActive = true;
  showerStartTime = Date.now();
  // User-defined: Duration 20-30 seconds
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
  // Shower active phase ended. Now wait for existing meteors to clear.
  if (!isWaitingForAllMeteorsToClear) { // Prevent multiple checks if somehow triggered twice
    isWaitingForAllMeteorsToClear = true;
    checkAllMeteorsClearedLoop();
  }
}

function scheduleNextShower() {
  stopWaitingForAllMeteorsToClear(); // Ensure any prior waiting state is cleared before scheduling
  const interval = Math.random() * 8000 + 2000;
  if (meteorShowerStartTimeoutId) clearTimeout(meteorShowerStartTimeoutId);
  meteorShowerStartTimeoutId = setTimeout(startCurrentMeteorShower, interval);
}

export function initializeMeteors(canvas, count = meteorCount) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvasWidth = canvas.width / dpr;
  canvasHeight = canvas.height / dpr;
  // Use provided count, or the globally defined (randomized) meteorCount
  meteorCount = count === undefined ? (Math.floor(Math.random() * 20) + 20) : count;

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

export function drawMeteorsOnCanvas(ctx) {
  if (!ctx) return;
  meteors.forEach(meteor => {
    meteor.draw(ctx);
  });
}

export function clearMeteors() {
  clearScheduledShowers();
  meteors = [];
} 