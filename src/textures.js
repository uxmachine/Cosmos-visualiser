import * as THREE from 'three';

// Procedural texture generation - no external images needed

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Seeded random for reproducible noise
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Simple 2D value noise
function valueNoise(x, y, seed) {
  const rand = seededRandom(seed);
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const smooth = (t) => t * t * (3 - 2 * t);
  const sfx = smooth(fx);
  const sfy = smooth(fy);

  function hash(px, py) {
    const r = seededRandom((px * 374761393 + py * 668265263 + seed) & 0x7fffffff);
    return r();
  }

  const v00 = hash(ix, iy);
  const v10 = hash(ix + 1, iy);
  const v01 = hash(ix, iy + 1);
  const v11 = hash(ix + 1, iy + 1);

  const a = v00 + sfx * (v10 - v00);
  const b = v01 + sfx * (v11 - v01);
  return a + sfy * (b - a);
}

function fbm(x, y, octaves, seed) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 100);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

// Earth texture
export function createEarthTexture() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      // Spherical noise for continent shapes
      const nx = u * 8;
      const ny = v * 4;

      const continent = fbm(nx, ny, 6, 42);
      const detail = fbm(nx * 4, ny * 4, 4, 99);

      const seaLevel = 0.45;
      const isLand = continent > seaLevel;

      if (isLand) {
        // Land: greens and browns
        const elevation = (continent - seaLevel) / (1 - seaLevel);
        const r = Math.floor(40 + elevation * 80 + detail * 40);
        const g = Math.floor(80 + elevation * 40 + detail * 30);
        const b = Math.floor(30 + detail * 20);

        // Snow caps near poles
        const lat = Math.abs(v - 0.5) * 2;
        if (lat > 0.75 && elevation > 0.2) {
          const snow = (lat - 0.75) * 4;
          data[idx] = Math.floor(r + (240 - r) * snow);
          data[idx + 1] = Math.floor(g + (245 - g) * snow);
          data[idx + 2] = Math.floor(b + (250 - b) * snow);
        } else {
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      } else {
        // Ocean: deep blue with variation
        const depth = (seaLevel - continent) / seaLevel;
        data[idx] = Math.floor(15 + detail * 20);
        data[idx + 1] = Math.floor(40 + detail * 30 - depth * 20);
        data[idx + 2] = Math.floor(120 + detail * 40 - depth * 30);
      }

      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Draw some cloud wisps on top
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#fff';
  const rand = seededRandom(777);
  for (let i = 0; i < 300; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const cr = rand() * 40 + 10;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Earth cloud layer
export function createCloudTexture() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      const noise = fbm(u * 10, v * 5, 6, 200);
      const alpha = Math.max(0, (noise - 0.4) * 3);

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.floor(Math.min(alpha, 1) * 180);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Earth night lights
export function createNightTexture() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      const continent = fbm(u * 8, v * 4, 6, 42);
      const seaLevel = 0.45;

      if (continent > seaLevel) {
        // City lights on land
        const density = fbm(u * 40, v * 20, 4, 500);
        const bright = density > 0.55 ? (density - 0.55) * 6 : 0;
        const b = Math.min(bright, 1);
        data[idx] = Math.floor(255 * b * 0.9);
        data[idx + 1] = Math.floor(200 * b * 0.8);
        data[idx + 2] = Math.floor(100 * b * 0.5);
      }

      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generic gas giant texture
export function createGasGiantTexture(config) {
  const { baseColor, bandColors, stormColor, seed, size: texSize } = config;
  const size = texSize || 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      // Horizontal bands
      const bandNoise = fbm(u * 2, v * 12, 4, seed);
      const bandIndex = Math.floor((v * bandColors.length * 2 + bandNoise * 0.5) % bandColors.length);
      const band = bandColors[bandIndex];

      // Turbulent flow
      const turbulence = fbm(u * 8 + v * 2, v * 6, 5, seed + 50);
      const flow = fbm(u * 4 + turbulence * 0.5, v * 8, 4, seed + 100);

      // Storm spots
      let stormFactor = 0;
      const rand = seededRandom(seed + 300);
      for (let s = 0; s < 3; s++) {
        const su = rand() * 0.8 + 0.1;
        const sv = rand() * 0.6 + 0.2;
        const sr = rand() * 0.04 + 0.02;
        const dx = (u - su);
        const dy = (v - sv) * 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < sr) {
          stormFactor = Math.max(stormFactor, 1 - dist / sr);
        }
      }

      const r = band[0] * (0.8 + flow * 0.4) + stormColor[0] * stormFactor * 0.5;
      const g = band[1] * (0.8 + flow * 0.4) + stormColor[1] * stormFactor * 0.5;
      const b = band[2] * (0.8 + flow * 0.4) + stormColor[2] * stormFactor * 0.5;

      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Rocky planet (Mars, Mercury, etc)
export function createRockyTexture(config) {
  const { baseColor, craterSeed, size: texSize } = config;
  const size = texSize || 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      const terrain = fbm(u * 12, v * 6, 6, craterSeed);
      const detail = fbm(u * 30, v * 15, 4, craterSeed + 200);

      const brightness = 0.6 + terrain * 0.3 + detail * 0.1;

      data[idx] = Math.floor(baseColor[0] * brightness);
      data[idx + 1] = Math.floor(baseColor[1] * brightness);
      data[idx + 2] = Math.floor(baseColor[2] * brightness);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Moon texture
export function createMoonTexture() {
  return createRockyTexture({
    baseColor: [180, 175, 165],
    craterSeed: 1234,
    size: 512,
  });
}

// Sun texture
export function createSunTexture() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      const noise1 = fbm(u * 8, v * 8, 5, 999);
      const noise2 = fbm(u * 16, v * 16, 4, 888);

      const brightness = 0.7 + noise1 * 0.2 + noise2 * 0.1;

      data[idx] = Math.min(255, Math.floor(255 * brightness));
      data[idx + 1] = Math.min(255, Math.floor(200 * brightness * (0.8 + noise1 * 0.2)));
      data[idx + 2] = Math.min(255, Math.floor(50 * brightness));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Venus with thick atmosphere
export function createVenusTexture() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const idx = (y * size + x) * 4;

      const clouds = fbm(u * 6, v * 8, 6, 333);
      const detail = fbm(u * 12, v * 6, 4, 334);

      const brightness = 0.5 + clouds * 0.3 + detail * 0.15;

      data[idx] = Math.floor(220 * brightness);
      data[idx + 1] = Math.floor(180 * brightness);
      data[idx + 2] = Math.floor(100 * brightness);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
