import React, { useEffect, useRef, useState } from 'react';
import {
  initializeRain,
  updateRainState,
  drawRainOnCanvas,
  initializeLightning,
  drawLightning,
  clearLightning
} from '../effects/rain';
import {
  initializeMeteors,
  updateMeteorsState,
  drawMeteorsOnCanvas,
  clearMeteors
} from '../effects/meteor';

interface ThemeConfig {
  layer1: string[];
  layer1_transform_interval: number;
  layer2: string[];
  layer2_transform_interval: number;
  effects: {
    rain?: boolean;
    lightning?: boolean;
    meteors?: boolean;
  };
}

export const CanvasEffects: React.FC = () => {
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const canvas3Ref = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<Record<string, ThemeConfig> | null>(null);
  const [themeKey, setThemeKey] = useState('night');

  useEffect(() => {
    fetch('/config.json')
      .then(r => r.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!config) return;
    applyTheme(themeKey);
  }, [config, themeKey]);

  function loadImages(paths: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(
      paths.map(
        p =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('failed'));
            img.src = p;
          })
      )
    );
  }

  async function applyTheme(key: string) {
    if (!config) return;
    const theme = config[key];
    if (!theme) return;
    const [layer1Imgs, layer2Imgs] = await Promise.all([
      loadImages(theme.layer1),
      loadImages(theme.layer2)
    ]).catch(() => [[], []]);

    const c1 = canvas1Ref.current;
    const c2 = canvas2Ref.current;
    const c3 = canvas3Ref.current;
    if (!c1 || !c2 || !c3) return;
    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');
    const ctx3 = c3.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    [c1, c2, c3].forEach(c => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = window.innerWidth + 'px';
      c.style.height = window.innerHeight + 'px';
      c.getContext('2d')?.scale(dpr, dpr);
    });

    if (layer1Imgs[0] && ctx1) {
      drawCover(ctx1, layer1Imgs[0], c1);
    }
    if (layer2Imgs[0] && ctx3) {
      drawCover(ctx3, layer2Imgs[0], c3);
    }
    clearLightning();
    clearMeteors();
    if (theme.effects.rain) initializeRain(c2);
    if (theme.effects.lightning) initializeLightning(c2);
    if (theme.effects.meteors) initializeMeteors(c2);

    let frameId: number;
    const animate = () => {
      if (!ctx2) return;
      ctx2.clearRect(0, 0, c2.width, c2.height);
      if (theme.effects.rain) {
        updateRainState();
        drawRainOnCanvas(ctx2);
      }
      if (theme.effects.lightning) {
        drawLightning(ctx2);
      }
      if (theme.effects.meteors) {
        updateMeteorsState();
        drawMeteorsOnCanvas(ctx2);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }

  function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    const canvasLogicalWidth = canvas.width / dpr;
    const canvasLogicalHeight = canvas.height / dpr;
    const scaleX = canvasLogicalWidth / img.width;
    const scaleY = canvasLogicalHeight / img.height;
    const scale = Math.max(scaleX, scaleY);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (canvasLogicalWidth - drawWidth) / 2;
    const offsetY = (canvasLogicalHeight - drawHeight) / 2;
    ctx.clearRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  return (
    <>
      <div className="canvas-container">
        <canvas id="canvas-layer1" ref={canvas1Ref}></canvas>
        <canvas id="canvas-layer2" ref={canvas2Ref}></canvas>
        <canvas id="canvas-layer3" ref={canvas3Ref}></canvas>
      </div>
      <button id="prevThemeBtn" className="theme-btn" onClick={() => setThemeKey(k => (k === 'night' ? 'cafe' : 'night'))}>
        &#9664;
      </button>
      <button id="nextThemeBtn" className="theme-btn" onClick={() => setThemeKey(k => (k === 'night' ? 'cafe' : 'night'))}>
        &#9654;
      </button>
    </>
  );
};

export default CanvasEffects;
