import * as THREE from 'three';
import { nebulaVertexShader, nebulaFragmentShader } from './shaders.js';

// Nebula color palettes inspired by real nebulae
const NEBULA_PALETTES = [
  // Orion-like: pink/purple
  { colors: [[0.8, 0.2, 0.4], [0.6, 0.1, 0.5], [0.9, 0.3, 0.5]], position: [300, 100, -400] },
  // Eagle-like: golden/green
  { colors: [[0.6, 0.5, 0.1], [0.4, 0.6, 0.2], [0.7, 0.6, 0.15]], position: [-350, -80, 300] },
  // Crab-like: blue/teal
  { colors: [[0.1, 0.3, 0.7], [0.15, 0.5, 0.6], [0.2, 0.4, 0.8]], position: [200, -200, 500] },
  // Rosette-like: red/orange
  { colors: [[0.8, 0.15, 0.1], [0.9, 0.3, 0.1], [0.7, 0.2, 0.15]], position: [-400, 150, -300] },
  // Veil-like: cyan/blue
  { colors: [[0.1, 0.6, 0.8], [0.2, 0.4, 0.9], [0.15, 0.7, 0.7]], position: [500, 50, 200] },
];

export function createNebulae() {
  const group = new THREE.Group();
  group.name = 'nebulae';

  for (const nebula of NEBULA_PALETTES) {
    const cloud = createNebulaCloud(nebula);
    group.add(cloud);
  }

  return group;
}

function createNebulaCloud(config) {
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  const nebulaSizes = new Float32Array(particleCount);
  const nebulaColors = new Float32Array(particleCount * 3);
  const nebulaAlphas = new Float32Array(particleCount);

  const [cx, cy, cz] = config.position;
  const spread = 120;

  for (let i = 0; i < particleCount; i++) {
    // Gaussian-ish distribution around center
    const r1 = Math.random() + Math.random() + Math.random();
    const r2 = Math.random() + Math.random() + Math.random();
    const r3 = Math.random() + Math.random() + Math.random();
    const scale = spread / 3;

    positions[i * 3] = cx + (r1 - 1.5) * scale;
    positions[i * 3 + 1] = cy + (r2 - 1.5) * scale * 0.6;
    positions[i * 3 + 2] = cz + (r3 - 1.5) * scale;

    nebulaSizes[i] = 20 + Math.random() * 60;

    // Pick from the palette with some variation
    const colorIdx = Math.floor(Math.random() * config.colors.length);
    const base = config.colors[colorIdx];
    const variation = 0.1;
    nebulaColors[i * 3] = base[0] + (Math.random() - 0.5) * variation;
    nebulaColors[i * 3 + 1] = base[1] + (Math.random() - 0.5) * variation;
    nebulaColors[i * 3 + 2] = base[2] + (Math.random() - 0.5) * variation;

    // Denser in the center
    const distFromCenter = Math.sqrt(
      (positions[i * 3] - cx) ** 2 +
      (positions[i * 3 + 1] - cy) ** 2 +
      (positions[i * 3 + 2] - cz) ** 2
    );
    nebulaAlphas[i] = Math.max(0.02, 0.12 * (1 - distFromCenter / (spread * 0.8)));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('nebulaSize', new THREE.BufferAttribute(nebulaSizes, 1));
  geometry.setAttribute('nebulaColor', new THREE.BufferAttribute(nebulaColors, 3));
  geometry.setAttribute('nebulaAlpha', new THREE.BufferAttribute(nebulaAlphas, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: nebulaVertexShader,
    fragmentShader: nebulaFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}
