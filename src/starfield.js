import * as THREE from 'three';
import { starVertexShader, starFragmentShader } from './shaders.js';

// Spectral type colors for realistic star appearance
const STAR_COLORS = [
  [0.6, 0.7, 1.0],   // O - blue
  [0.7, 0.8, 1.0],   // B - blue-white
  [0.9, 0.9, 1.0],   // A - white
  [1.0, 1.0, 0.9],   // F - yellow-white
  [1.0, 0.95, 0.7],  // G - yellow (sun-like)
  [1.0, 0.8, 0.5],   // K - orange
  [1.0, 0.6, 0.4],   // M - red
];

// Weighted probability matching real stellar distribution
// (M-type most common, O-type rarest)
const STAR_WEIGHTS = [0.001, 0.01, 0.03, 0.06, 0.12, 0.24, 0.54];

function pickStarColor(rand) {
  let cumulative = 0;
  for (let i = 0; i < STAR_WEIGHTS.length; i++) {
    cumulative += STAR_WEIGHTS[i];
    if (rand < cumulative) return STAR_COLORS[i];
  }
  return STAR_COLORS[6];
}

export function createStarfield(count = 15000) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkleSpeeds = new Float32Array(count);
  const twinklePhases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Distribute stars in a large sphere around the scene
    const radius = 300 + Math.random() * 700;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Size: most stars small, few large
    const sizeRand = Math.random();
    if (sizeRand > 0.995) {
      sizes[i] = 4 + Math.random() * 3; // Very bright stars
    } else if (sizeRand > 0.97) {
      sizes[i] = 2 + Math.random() * 2; // Bright stars
    } else {
      sizes[i] = 0.5 + Math.random() * 1.5; // Normal stars
    }

    // Twinkle parameters - faster for brighter stars
    twinkleSpeeds[i] = 0.5 + Math.random() * 3;
    twinklePhases[i] = Math.random() * Math.PI * 2;

    // Star color based on spectral type
    const color = pickStarColor(Math.random());
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
  }

  // Add a band of denser stars for the Milky Way
  const milkyWayCount = 8000;
  const mwPositions = new Float32Array(milkyWayCount * 3);
  const mwSizes = new Float32Array(milkyWayCount);
  const mwTwinkleSpeeds = new Float32Array(milkyWayCount);
  const mwTwinklePhases = new Float32Array(milkyWayCount);
  const mwColors = new Float32Array(milkyWayCount * 3);

  for (let i = 0; i < milkyWayCount; i++) {
    const radius = 400 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    // Concentrate around a plane with some spread
    const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.3;

    // Rotate the plane for the milky way band
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    // Rotate 60 degrees around x-axis for the milky way tilt
    const angle = 1.05;
    mwPositions[i * 3] = x;
    mwPositions[i * 3 + 1] = y * Math.cos(angle) - z * Math.sin(angle);
    mwPositions[i * 3 + 2] = y * Math.sin(angle) + z * Math.cos(angle);

    mwSizes[i] = 0.3 + Math.random() * 0.8;
    mwTwinkleSpeeds[i] = 0.3 + Math.random() * 2;
    mwTwinklePhases[i] = Math.random() * Math.PI * 2;

    const color = pickStarColor(Math.random());
    mwColors[i * 3] = color[0] * 0.8;
    mwColors[i * 3 + 1] = color[1] * 0.8;
    mwColors[i * 3 + 2] = color[2] * 0.8;
  }

  // Merge all star data
  const totalCount = count + milkyWayCount;
  const allPositions = new Float32Array(totalCount * 3);
  const allSizes = new Float32Array(totalCount);
  const allTwinkleSpeeds = new Float32Array(totalCount);
  const allTwinklePhases = new Float32Array(totalCount);
  const allColors = new Float32Array(totalCount * 3);

  allPositions.set(positions);
  allPositions.set(mwPositions, count * 3);
  allSizes.set(sizes);
  allSizes.set(mwSizes, count);
  allTwinkleSpeeds.set(twinkleSpeeds);
  allTwinkleSpeeds.set(mwTwinkleSpeeds, count);
  allTwinklePhases.set(twinklePhases);
  allTwinklePhases.set(mwTwinklePhases, count);
  allColors.set(colors);
  allColors.set(mwColors, count * 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(allSizes, 1));
  geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(allTwinkleSpeeds, 1));
  geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(allTwinklePhases, 1));
  geometry.setAttribute('starColor', new THREE.BufferAttribute(allColors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    uniforms: {
      time: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'starfield';
  return points;
}
