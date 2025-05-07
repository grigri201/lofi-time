import { initializeRain, updateRainState, drawRainOnCanvas, initializeLightning, drawLightning, clearLightning } from './rain.js';
import { initializeMeteors, updateMeteorsState, drawMeteorsOnCanvas, clearMeteors } from './meteor.js';

document.addEventListener('DOMContentLoaded', async () => {
  let config;
  try {
    const response = await fetch('./config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    config = await response.json();
  } catch (error) {
    console.error("Failed to load config.json:", error);
    // Fallback or disable canvas features if config is essential
    return;
  }

  // Determine which theme/key to use from config.json
  const themeKey = "night";
  const themeConfig = config[themeKey];

  // Validate themeConfig and essential paths
  if (!themeConfig ||
    !themeConfig.layer1 || !Array.isArray(themeConfig.layer1) || themeConfig.layer1.length === 0 ||
    !themeConfig.layer2 || !Array.isArray(themeConfig.layer2) || themeConfig.layer2.length === 0) {
    console.error(`Theme '${themeKey}' in config.json is missing layer1/layer2 arrays, or they are empty, or essential image paths are missing.`);
    return;
  }

  const layer1ImagePaths = themeConfig.layer1;
  const layer2ImagePaths = themeConfig.layer2; // for canvas3

  const layer1TransformInterval = themeConfig.layer1_transform_interval || 0;
  // const layer1TransformDuration = themeConfig.layer1_transform_duration || 0; // Parsed but not used for visual transition in this version
  const layer2TransformInterval = themeConfig.layer2_transform_interval || 0;
  // const layer2TransformDuration = themeConfig.layer2_transform_duration || 0; // Parsed but not used for visual transition in this version

  // Moved Canvas related code inside DOMContentLoaded
  const canvas1 = document.getElementById('canvas-layer1');
  const canvas2 = document.getElementById('canvas-layer2');
  const canvas3 = document.getElementById('canvas-layer3');

  // Only proceed with canvas setup if all canvases are found
  if (canvas1 && canvas2 && canvas3) {
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    const ctx3 = canvas3.getContext('2d');

    // Image arrays, current indices, and loaded status
    let layer1Images = [];
    let currentLayer1Index = 0;
    let layer1Loaded = false;

    let layer2Images = []; // For canvas3 (formerly img3)
    let currentLayer2Index = 0;
    let layer2Loaded = false; // For canvas3 images

    let initialSetupDone = false; // Flag to ensure initial setup runs once

    let animationFrameId = null;

    function loadLayerImages(paths, imageArray, onAllLoadedCallback) {
      let loadedCount = 0;
      if (!paths || paths.length === 0) {
        onAllLoadedCallback(); // No images to load
        return;
      }
      // Ensure imageArray is cleared or correctly sized if re-using
      imageArray.length = 0;
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
          // Optionally, count as loaded to not block indefinitely, or handle error
          loadedCount++;
          if (loadedCount === paths.length) {
            onAllLoadedCallback();
          }
        };
        img.src = path;
        imageArray[index] = img;
      });
    }

    function initialDrawAndSetup() {
      if (initialSetupDone) return;
      initialSetupDone = true;

      resizeAndDraw(); // Draws initial images based on current indices (0)

      if (!animationFrameId && canvas2) { // Start rain animation on canvas2
        animate();
      }

      // Start slideshow for layer 1 (canvas1)
      if (layer1Images.length > 1 && layer1TransformInterval > 0 && ctx1) {
        setInterval(() => {
          currentLayer1Index = (currentLayer1Index + 1) % layer1Images.length;
          if (layer1Images[currentLayer1Index]) {
            drawImageCover(ctx1, layer1Images[currentLayer1Index], canvas1);
          }
        }, layer1TransformInterval);
      }

      // Start slideshow for layer 2 (canvas3)
      if (layer2Images.length > 1 && layer2TransformInterval > 0 && ctx3) {
        setInterval(() => {
          currentLayer2Index = (currentLayer2Index + 1) % layer2Images.length;
          if (layer2Images[currentLayer2Index]) {
            drawImageCover(ctx3, layer2Images[currentLayer2Index], canvas3);
          }
        }, layer2TransformInterval);
      }
    }

    loadLayerImages(layer1ImagePaths, layer1Images, () => {
      layer1Loaded = true;
      if (layer2Loaded && !initialSetupDone) {
        initialDrawAndSetup();
      }
    });

    loadLayerImages(layer2ImagePaths, layer2Images, () => { // For canvas3
      layer2Loaded = true;
      if (layer1Loaded && !initialSetupDone) {
        initialDrawAndSetup();
      }
    });

    function drawImageCover(ctx, img, canvas) {
      if (!ctx || !img || !canvas) return;
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

      ctx.clearRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    function animate() {
      if (!canvas2 || !ctx2) return;
      const dpr = window.devicePixelRatio || 1;
      const logicalWidth2 = canvas2.width / dpr;
      const logicalHeight2 = canvas2.height / dpr;

      ctx2.clearRect(0, 0, logicalWidth2, logicalHeight2);
      ctx2.fillStyle = 'rgba(0, 0, 50, 0.3)';
      ctx2.fillRect(0, 0, logicalWidth2, logicalHeight2);

      if (themeKey === "cafe") {
        updateRainState();
        drawRainOnCanvas(ctx2);
        drawLightning(ctx2);
      } else if (themeKey === "night") {
        // Add meteors for night theme
        updateMeteorsState();
        drawMeteorsOnCanvas(ctx2);
        // Optionally, keep rain and lightning for night theme too, or make them exclusive
        // updateRainState(); // If you want rain too
        // drawRainOnCanvas(ctx2); // If you want rain too
        // drawLightning(ctx2); // If you want lightning too
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    function resizeAndDraw() {
      const container = document.querySelector('.canvas-container');
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;

      [canvas1, canvas2, canvas3].forEach(canvas => {
        if (!canvas) return;
        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;
        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      });

      // Conditional initialization of rain and lightning based on theme
      if (canvas2) { // Ensure canvas2 exists for these effects
        if (themeKey === "cafe") {
          initializeRain(canvas2);
          initializeLightning(canvas2); // Initialize and start scheduling lightning
          clearMeteors(); // Ensure meteors are cleared if switching from a theme that had them
        } else if (themeKey === "night") {
          initializeMeteors(canvas2); // Initialize 15 meteors for the night theme
          // Optionally, initialize rain and lightning for night theme as well
          // initializeRain(canvas2);
          // initializeLightning(canvas2);
        } else {
          // If not 'cafe' or 'night', ensure all effects are cleared.
          clearLightning();
          clearMeteors(); // Clear meteors for other themes
          // Potentially clear rain if it's not a default effect
        }
      }

      // Draw current images for layer1 and layer2
      if (layer1Loaded && ctx1 && layer1Images.length > 0 && layer1Images[currentLayer1Index]) {
        drawImageCover(ctx1, layer1Images[currentLayer1Index], canvas1);
      }
      if (layer2Loaded && ctx3 && layer2Images.length > 0 && layer2Images[currentLayer2Index]) {
        drawImageCover(ctx3, layer2Images[currentLayer2Index], canvas3); // canvas3 is layer 2
      }

      // Start rain animation if not already started and layers are loaded
      if (!animationFrameId && layer1Loaded && layer2Loaded && canvas2) {
        animate();
      }
    }

    window.addEventListener('resize', () => {
      // Ensure canvases exist before trying to resize - this check is good
      if (canvas1 && canvas2 && canvas3) {
        resizeAndDraw();
      }
    });

    // Initial call to resizeAndDraw and animate is now handled by initialDrawAndSetup
    // which is triggered by image loading callbacks. So the old block here is removed.

  } else {
    console.warn("One or more canvas elements not found. Canvas animations disabled.");
  }
}); 