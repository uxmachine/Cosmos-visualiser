import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarfield } from './starfield.js';
import { createEarth, createMoon, createSun, createPlanet, getPlanetNames, createOrbitPath } from './celestial.js';
import { createNebulae } from './nebulae.js';

// ── Scene setup ──────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.0008);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(8, 5, 8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ── Controls ─────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 500;
controls.enablePan = true;
controls.panSpeed = 0.8;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 1.2;
controls.target.set(0, 0, 0); // Earth at center

// ── Lighting ─────────────────────────────────────────────────────
// Ambient light for minimum visibility
const ambient = new THREE.AmbientLight(0x111122, 0.3);
scene.add(ambient);

// Hemisphere light for subtle sky/ground color difference
const hemi = new THREE.HemisphereLight(0x224488, 0x080820, 0.2);
scene.add(hemi);

// ── Earth (center of scene) ──────────────────────────────────────
const earth = createEarth();
earth.position.set(0, 0, 0);
scene.add(earth);

// ── Moon orbiting Earth ──────────────────────────────────────────
const moon = createMoon();
scene.add(moon);

// ── Sun ──────────────────────────────────────────────────────────
const sun = createSun();
sun.position.set(-60, 10, -40);
scene.add(sun);

// ── Planets ──────────────────────────────────────────────────────
const planets = [];
const planetNames = getPlanetNames();

for (const name of planetNames) {
  const planet = createPlanet(name);
  if (planet) {
    scene.add(planet);
    planets.push(planet);

    // Add orbit path
    const orbitPath = createOrbitPath(planet.userData.orbitDistance);
    scene.add(orbitPath);
  }
}

// ── Starfield ────────────────────────────────────────────────────
const starfield = createStarfield(15000);
scene.add(starfield);

// ── Nebulae ──────────────────────────────────────────────────────
const nebulae = createNebulae();
scene.add(nebulae);

// ── Raycaster for planet tooltips ────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

const labeledObjects = [earth, moon, sun, ...planets];

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  let found = false;

  for (const obj of labeledObjects) {
    const intersects = raycaster.intersectObjects(obj.children || [obj], true);
    if (intersects.length > 0) {
      tooltip.style.display = 'block';
      tooltip.style.left = event.clientX + 15 + 'px';
      tooltip.style.top = event.clientY - 10 + 'px';
      tooltip.textContent = obj.name;
      found = true;
      break;
    }
  }

  if (!found) {
    tooltip.style.display = 'none';
  }
}

window.addEventListener('pointermove', onPointerMove);

// ── Window resize ────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Animation loop ───────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Earth rotation
  earth.children[0].rotation.y = elapsed * 0.1; // Main sphere
  const clouds = earth.getObjectByName('clouds');
  if (clouds) clouds.rotation.y = elapsed * 0.12; // Clouds slightly faster

  // Moon orbit around Earth
  const moonOrbitRadius = 5;
  const moonSpeed = 0.3;
  moon.position.x = Math.cos(elapsed * moonSpeed) * moonOrbitRadius;
  moon.position.z = Math.sin(elapsed * moonSpeed) * moonOrbitRadius;
  moon.position.y = Math.sin(elapsed * moonSpeed * 0.5) * 0.5;
  moon.rotation.y = elapsed * 0.05;

  // Planet orbits (all orbit around Earth as requested center)
  for (const planet of planets) {
    const { orbitDistance, orbitSpeed, orbitAngle, rotationSpeed } = planet.userData;
    const angle = orbitAngle + elapsed * orbitSpeed;

    planet.position.x = Math.cos(angle) * orbitDistance;
    planet.position.z = Math.sin(angle) * orbitDistance;
    planet.position.y = Math.sin(angle * 0.5) * orbitDistance * 0.02;

    // Self rotation
    if (planet.children[0]) {
      planet.children[0].rotation.y += rotationSpeed;
    }
  }

  // Sun corona animation
  const corona = sun.getObjectByName('corona');
  if (corona) {
    corona.material.uniforms.time.value = elapsed;
  }

  // Starfield twinkling
  starfield.material.uniforms.time.value = elapsed;

  // Update controls
  controls.update();

  renderer.render(scene, camera);
}

animate();
