import { initializeRain, updateRainState, drawRainOnCanvas, initializeLightning, drawLightning, clearLightning } from './rain.js';
import { initializeMeteors, updateMeteorsState, drawMeteorsOnCanvas, clearMeteors } from './meteor.js';

document.addEventListener('DOMContentLoaded', async () => {
  let fullConfig;
  try {
    const response = await fetch('./config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    fullConfig = await response.json();
  } catch (error) {
    console.error("Failed to load config.json:", error);
    return;
  }

  const audio = document.getElementById('myAudio');
  if (audio) {
    // Attempt to play the audio
    // Autoplay might be blocked by browser policies, 
    // especially if the user hasn't interacted with the page yet.
    // Using a timeout can sometimes help, but it's not a guaranteed solution.
    setTimeout(() => {
      audio.play().catch(error => {
        console.log("Autoplay was prevented:", error);
        // Optionally, you could show a play button or a message to the user.
      });
    }, 100); // Small delay
  }

  const themes = ["night", "cafe"]; // Available themes
  let currentThemeIndex = 0; // Start with "night"
  let themeKey = themes[currentThemeIndex];

  // Canvas elements and contexts (scoped to be accessible by applyTheme)
  const canvas1 = document.getElementById('canvas-layer1');
  const canvas2 = document.getElementById('canvas-layer2');
  const canvas3 = document.getElementById('canvas-layer3');
  let ctx1, ctx2, ctx3;

  if (!canvas1 || !canvas2 || !canvas3) {
    console.warn("One or more canvas elements not found. Canvas animations disabled.");
    return;
  }

  ctx1 = canvas1.getContext('2d');
  ctx2 = canvas2.getContext('2d');
  ctx3 = canvas3.getContext('2d');

  // Image arrays, current indices, and loaded status
  let layer1Images = [];
  let currentLayer1Index = 0;
  let layer1Loaded = false;

  let layer2Images = []; // For canvas3
  let currentLayer2Index = 0;
  let layer2Loaded = false;

  let initialSetupDone = false;
  let animationFrameId = null;
  let slideshowIntervalLayer1 = null;
  let slideshowIntervalLayer2 = null;

  function loadLayerImages(paths, imageArray, onAllLoadedCallback) {
    let loadedCount = 0;
    imageArray.length = 0; // Clear previous images
    if (!paths || paths.length === 0) {
      onAllLoadedCallback();
      return;
    }
    paths.forEach((path, index) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === paths.length) {
          onAllLoadedCallback();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${path}`);
        loadedCount++;
        if (loadedCount === paths.length) {
          onAllLoadedCallback();
        }
      };
      img.src = path;
      imageArray[index] = img;
    });
  }

  function drawImageCover(ctx, img, canvas) {
    if (!ctx || !img || !canvas) return;
    // DPR handling remains the same
    const dpr = window.devicePixelRatio || 1;
    const canvasLogicalWidth = canvas.width / dpr;
    const canvasLogicalHeight = canvas.height / dpr;

    const imgWidth = img.width;
    const imgHeight = img.height;

    const scaleX = canvasLogicalWidth / imgWidth;
    const scaleY = canvasLogicalHeight / imgHeight;
    const scale = Math.max(scaleX, scaleY);

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const offsetX = (canvasLogicalWidth - drawWidth) / 2;
    const offsetY = (canvasLogicalHeight - drawHeight) / 2;

    ctx.clearRect(0, 0, canvasLogicalWidth, canvasLogicalHeight); // Clear before drawing
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  function animate() {
    if (!canvas2 || !ctx2) return; // Check moved from inside
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth2 = canvas2.width / dpr;
    const logicalHeight2 = canvas2.height / dpr;

    ctx2.clearRect(0, 0, logicalWidth2, logicalHeight2);
    // Background fill might change based on theme, or be removed if layers cover it
    // ctx2.fillStyle = 'rgba(0, 0, 50, 0.3)'; // Example, can be theme-dependent
    // ctx2.fillRect(0, 0, logicalWidth2, logicalHeight2);

    // Theme-specific animations
    const currentThemeConfig = fullConfig[themeKey]; // Get current theme config for animation details
    if (currentThemeConfig.effects && currentThemeConfig.effects.rain) {
      updateRainState();
      drawRainOnCanvas(ctx2);
    }
    if (currentThemeConfig.effects && currentThemeConfig.effects.lightning) {
      drawLightning(ctx2);
    }
    if (currentThemeConfig.effects && currentThemeConfig.effects.meteors) {
      updateMeteorsState();
      drawMeteorsOnCanvas(ctx2);
    }
    // Fallback if no effects defined or to ensure canvas is cleared
    // else { 
    //    ctx2.clearRect(0, 0, logicalWidth2, logicalHeight2);
    // }


    animationFrameId = requestAnimationFrame(animate);
  }

  function resizeAndDraw() {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;

    [canvas1, canvas2, canvas3].forEach(canvas => {
      if (!canvas) return;
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      const newWidth = container.clientWidth * dpr;
      const newHeight = container.clientHeight * dpr;

      if (oldWidth !== newWidth || oldHeight !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr); // Rescale context if canvas size changed
        }
      }
    });

    const currentThemeConfig = fullConfig[themeKey]; // Use current theme config

    // (Re)-initialize effects based on the current theme.
    // Clear all potential effects first
    clearLightning();
    clearMeteors();
    // rain.js might need a clearRain() function if rain elements persist.
    // For now, assume re-initializing is enough or not needed if theme doesn't use it.

    if (currentThemeConfig.effects) {
      if (currentThemeConfig.effects.rain && canvas2) {
        initializeRain(canvas2);
      }
      if (currentThemeConfig.effects.lightning && canvas2) {
        initializeLightning(canvas2);
      }
      if (currentThemeConfig.effects.meteors && canvas2) {
        initializeMeteors(canvas2); // Assuming 15 meteors or make it configurable
      }
    }


    // Draw current images for layer1 and layer2
    if (layer1Loaded && ctx1 && layer1Images.length > 0 && layer1Images[currentLayer1Index]) {
      drawImageCover(ctx1, layer1Images[currentLayer1Index], canvas1);
    }
    if (layer2Loaded && ctx3 && layer2Images.length > 0 && layer2Images[currentLayer2Index]) {
      drawImageCover(ctx3, layer2Images[currentLayer2Index], canvas3);
    }

    // Restart animation if it was stopped and layers are loaded
    if (!animationFrameId && layer1Loaded && layer2Loaded && canvas2) {
      animate();
    }
  }

  function initialDrawAndSetup() {
    if (initialSetupDone) return;
    initialSetupDone = true;

    resizeAndDraw(); // Draws initial images and sets up effects

    // Slideshows are now managed by applyTheme to ensure they use correct intervals
    // and are cleared/restarted on theme change.
    // The animate() call is also handled within resizeAndDraw or applyTheme context.
  }

  async function applyTheme(newThemeKey) {
    themeKey = newThemeKey;
    const themeConfig = fullConfig[themeKey];

    if (!themeConfig ||
      !themeConfig.layer1 || !Array.isArray(themeConfig.layer1) ||
      !themeConfig.layer2 || !Array.isArray(themeConfig.layer2)) {
      console.error(`Theme '${themeKey}' in config.json is missing layer1/layer2 arrays, or they are empty.`);
      return;
    }

    // Stop existing animations and intervals
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (slideshowIntervalLayer1) {
      clearInterval(slideshowIntervalLayer1);
      slideshowIntervalLayer1 = null;
    }
    if (slideshowIntervalLayer2) {
      clearInterval(slideshowIntervalLayer2);
      slideshowIntervalLayer2 = null;
    }

    // Reset states
    layer1Loaded = false;
    layer2Loaded = false;
    initialSetupDone = false; // Allow initialDrawAndSetup to run again for the new theme
    currentLayer1Index = 0; // Reset image indices
    currentLayer2Index = 0;

    // Clear canvases (optional, as drawImageCover clears, but good for a clean slate)
    if (ctx1) ctx1.clearRect(0, 0, canvas1.width / (window.devicePixelRatio || 1), canvas1.height / (window.devicePixelRatio || 1));
    if (ctx2) ctx2.clearRect(0, 0, canvas2.width / (window.devicePixelRatio || 1), canvas2.height / (window.devicePixelRatio || 1));
    if (ctx3) ctx3.clearRect(0, 0, canvas3.width / (window.devicePixelRatio || 1), canvas3.height / (window.devicePixelRatio || 1));


    const layer1ImagePaths = themeConfig.layer1;
    const layer2ImagePaths = themeConfig.layer2;
    const layer1TransformInterval = themeConfig.layer1_transform_interval || 0;
    const layer2TransformInterval = themeConfig.layer2_transform_interval || 0;

    const onAllImagesLoaded = () => {
      if (layer1Loaded && layer2Loaded && !initialSetupDone) {
        initialDrawAndSetup(); // This will call resizeAndDraw

        // Restart slideshow for layer 1 (canvas1)
        if (layer1Images.length > 1 && layer1TransformInterval > 0 && ctx1) {
          slideshowIntervalLayer1 = setInterval(() => {
            currentLayer1Index = (currentLayer1Index + 1) % layer1Images.length;
            if (layer1Images[currentLayer1Index]) {
              drawImageCover(ctx1, layer1Images[currentLayer1Index], canvas1);
            }
          }, layer1TransformInterval);
        }

        // Restart slideshow for layer 2 (canvas3)
        if (layer2Images.length > 1 && layer2TransformInterval > 0 && ctx3) {
          slideshowIntervalLayer2 = setInterval(() => {
            currentLayer2Index = (currentLayer2Index + 1) % layer2Images.length;
            if (layer2Images[currentLayer2Index]) {
              drawImageCover(ctx3, layer2Images[currentLayer2Index], canvas3);
            }
          }, layer2TransformInterval);
        }

        // Ensure animation starts if conditions met (it's also in resizeAndDraw)
        if (!animationFrameId && canvas2) {
          animate();
        }
      }
    };

    loadLayerImages(layer1ImagePaths, layer1Images, () => {
      layer1Loaded = true;
      onAllImagesLoaded();
    });

    loadLayerImages(layer2ImagePaths, layer2Images, () => {
      layer2Loaded = true;
      onAllImagesLoaded();
    });
  }

  // Initial theme application
  applyTheme(themeKey);

  // Event listeners for theme switching
  const prevThemeBtn = document.getElementById('prevThemeBtn');
  const nextThemeBtn = document.getElementById('nextThemeBtn');

  if (prevThemeBtn) {
    prevThemeBtn.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex - 1 + themes.length) % themes.length;
      applyTheme(themes[currentThemeIndex]);
    });
  }

  if (nextThemeBtn) {
    nextThemeBtn.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      applyTheme(themes[currentThemeIndex]);
    });
  }

  window.addEventListener('resize', () => {
    if (canvas1 && canvas2 && canvas3) { // Ensure canvases exist
      resizeAndDraw(); // resizeAndDraw now correctly uses the current themeKey
    }
  });

}); 