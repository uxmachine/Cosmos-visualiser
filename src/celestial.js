import * as THREE from 'three';
import {
  createEarthTexture,
  createCloudTexture,
  createMoonTexture,
  createSunTexture,
  createVenusTexture,
  createGasGiantTexture,
  createRockyTexture,
} from './textures.js';
import {
  coronaVertexShader,
  coronaFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
  ringVertexShader,
  ringFragmentShader,
} from './shaders.js';

// Create Earth with clouds and atmosphere
export function createEarth() {
  const group = new THREE.Group();
  group.name = 'Earth';

  // Main sphere
  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const material = new THREE.MeshPhongMaterial({
    map: createEarthTexture(),
    specularMap: createEarthTexture(),
    specular: new THREE.Color(0x333333),
    shininess: 15,
  });
  const earth = new THREE.Mesh(geometry, material);
  group.add(earth);

  // Cloud layer
  const cloudGeo = new THREE.SphereGeometry(2.03, 64, 64);
  const cloudMat = new THREE.MeshPhongMaterial({
    map: createCloudTexture(),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.name = 'clouds';
  group.add(clouds);

  // Atmosphere glow
  const atmosGeo = new THREE.SphereGeometry(2.2, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      glowColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
      intensity: { value: 1.2 },
    },
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
  group.add(atmosphere);

  // Axial tilt
  group.rotation.z = 0.41;

  return group;
}

// Create the Moon
export function createMoon() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    map: createMoonTexture(),
    shininess: 2,
  });
  const moon = new THREE.Mesh(geometry, material);
  moon.name = 'Moon';
  return moon;
}

// Create the Sun with corona
export function createSun() {
  const group = new THREE.Group();
  group.name = 'Sun';

  // Sun sphere - emissive, self-lit
  const geometry = new THREE.SphereGeometry(5, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    map: createSunTexture(),
    color: 0xffdd44,
  });
  const sun = new THREE.Mesh(geometry, material);
  group.add(sun);

  // Corona glow
  const coronaGeo = new THREE.SphereGeometry(6.5, 64, 64);
  const coronaMat = new THREE.ShaderMaterial({
    vertexShader: coronaVertexShader,
    fragmentShader: coronaFragmentShader,
    uniforms: {
      time: { value: 0 },
    },
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  corona.name = 'corona';
  group.add(corona);

  // Point light from the sun
  const sunLight = new THREE.PointLight(0xfff5e0, 2, 500, 0.5);
  group.add(sunLight);

  return group;
}

// Planet configuration data
const PLANET_CONFIGS = {
  Mercury: {
    radius: 0.6,
    distance: 20,
    speed: 0.015,
    texture: () => createRockyTexture({ baseColor: [160, 150, 140], craterSeed: 111 }),
  },
  Venus: {
    radius: 1.2,
    distance: 30,
    speed: 0.012,
    texture: createVenusTexture,
    atmosphere: { color: new THREE.Color(0.9, 0.7, 0.3), intensity: 0.8, scale: 1.15 },
  },
  Mars: {
    radius: 0.9,
    distance: 50,
    speed: 0.008,
    texture: () => createRockyTexture({ baseColor: [200, 100, 50], craterSeed: 777 }),
    atmosphere: { color: new THREE.Color(0.8, 0.4, 0.2), intensity: 0.3, scale: 1.08 },
  },
  Jupiter: {
    radius: 4,
    distance: 80,
    speed: 0.004,
    texture: () =>
      createGasGiantTexture({
        baseColor: [200, 170, 120],
        bandColors: [
          [210, 180, 140],
          [180, 140, 100],
          [230, 200, 160],
          [160, 120, 80],
          [200, 160, 120],
          [240, 210, 170],
        ],
        stormColor: [220, 120, 80],
        seed: 5555,
        size: 768,
      }),
    isGasGiant: true,
  },
  Saturn: {
    radius: 3.5,
    distance: 120,
    speed: 0.003,
    texture: () =>
      createGasGiantTexture({
        baseColor: [220, 200, 150],
        bandColors: [
          [230, 210, 160],
          [200, 180, 130],
          [240, 220, 170],
          [190, 170, 120],
          [220, 200, 150],
        ],
        stormColor: [240, 220, 180],
        seed: 6666,
        size: 768,
      }),
    hasRings: true,
    isGasGiant: true,
  },
  Uranus: {
    radius: 2.5,
    distance: 160,
    speed: 0.002,
    texture: () =>
      createGasGiantTexture({
        baseColor: [150, 200, 220],
        bandColors: [
          [160, 210, 230],
          [140, 190, 210],
          [170, 220, 240],
          [130, 180, 200],
        ],
        stormColor: [180, 230, 250],
        seed: 7777,
      }),
    isGasGiant: true,
    tilt: 1.7, // Uranus has extreme axial tilt
  },
  Neptune: {
    radius: 2.4,
    distance: 200,
    speed: 0.0015,
    texture: () =>
      createGasGiantTexture({
        baseColor: [50, 80, 200],
        bandColors: [
          [60, 90, 210],
          [40, 70, 180],
          [70, 100, 220],
          [50, 80, 190],
        ],
        stormColor: [100, 150, 255],
        seed: 8888,
      }),
    isGasGiant: true,
  },
};

export function createPlanet(name) {
  const config = PLANET_CONFIGS[name];
  if (!config) return null;

  const group = new THREE.Group();
  group.name = name;

  // Planet sphere
  const geometry = new THREE.SphereGeometry(config.radius, 48, 48);
  const material = new THREE.MeshPhongMaterial({
    map: config.texture(),
    shininess: config.isGasGiant ? 5 : 10,
  });
  const planet = new THREE.Mesh(geometry, material);
  group.add(planet);

  // Atmosphere if applicable
  if (config.atmosphere) {
    const atmosGeo = new THREE.SphereGeometry(
      config.radius * config.atmosphere.scale,
      48,
      48
    );
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: config.atmosphere.color },
        intensity: { value: config.atmosphere.intensity },
      },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(atmosGeo, atmosMat));
  }

  // Rings for Saturn
  if (config.hasRings) {
    const ringGeo = new THREE.PlaneGeometry(config.radius * 4, config.radius * 4);
    const ringMat = new THREE.ShaderMaterial({
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2.2;
    group.add(ring);
  }

  // Axial tilt
  if (config.tilt) {
    group.rotation.z = config.tilt;
  }

  // Store orbit data
  group.userData = {
    orbitDistance: config.distance,
    orbitSpeed: config.speed,
    orbitAngle: Math.random() * Math.PI * 2,
    rotationSpeed: config.isGasGiant ? 0.02 : 0.005,
  };

  return group;
}

export function getPlanetNames() {
  return Object.keys(PLANET_CONFIGS);
}

// Create orbit path visualization
export function createOrbitPath(distance) {
  const curve = new THREE.EllipseCurve(0, 0, distance, distance, 0, 2 * Math.PI, false, 0);
  const points = curve.getPoints(128);
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((p) => new THREE.Vector3(p.x, 0, p.y))
  );
  const material = new THREE.LineBasicMaterial({
    color: 0x334466,
    transparent: true,
    opacity: 0.15,
  });
  return new THREE.Line(geometry, material);
}
