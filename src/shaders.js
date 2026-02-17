// Custom GLSL shaders for the cosmos visualisation

// Star vertex shader - handles twinkling via time uniform
export const starVertexShader = `
  attribute float size;
  attribute float twinkleSpeed;
  attribute float twinklePhase;
  attribute vec3 starColor;

  uniform float time;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = starColor;

    // Twinkle effect: combine two sine waves for organic feel
    float twinkle = sin(time * twinkleSpeed + twinklePhase) * 0.3 + 0.7;
    float twinkle2 = sin(time * twinkleSpeed * 1.7 + twinklePhase * 2.3) * 0.15 + 0.85;
    vAlpha = twinkle * twinkle2;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = length(mvPosition.xyz);

    // Size attenuation - stars get smaller with distance
    gl_PointSize = size * (300.0 / dist);
    gl_PointSize = max(gl_PointSize, 0.5);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Star fragment shader - circular point with glow
export const starFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Smooth circular star with glow falloff
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = exp(-dist * 6.0) * 0.6;
    float alpha = (core + glow) * vAlpha;

    if (alpha < 0.01) discard;

    // Slight bloom towards white in the core
    vec3 color = mix(vColor, vec3(1.0), core * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

// Sun corona vertex shader
export const coronaVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Sun corona fragment shader
export const coronaFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simplex-style noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);

    float noise = snoise(vPosition * 3.0 + time * 0.2) * 0.5 + 0.5;
    float noise2 = snoise(vPosition * 6.0 - time * 0.15) * 0.5 + 0.5;

    vec3 innerColor = vec3(1.0, 0.9, 0.3);
    vec3 outerColor = vec3(1.0, 0.3, 0.05);

    vec3 color = mix(innerColor, outerColor, fresnel);
    color += noise * 0.15 * vec3(1.0, 0.5, 0.1);

    float alpha = fresnel * (0.5 + noise2 * 0.3);

    gl_FragColor = vec4(color, alpha);
  }
`;

// Atmosphere shader for Earth
export const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    float alpha = fresnel * intensity;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// Nebula billboard shader
export const nebulaVertexShader = `
  attribute float nebulaSize;
  attribute vec3 nebulaColor;
  attribute float nebulaAlpha;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = nebulaColor;
    vAlpha = nebulaAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = nebulaSize * (600.0 / length(mvPosition.xyz));
    gl_PointSize = min(gl_PointSize, 200.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const nebulaFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Very soft gaussian cloud
    float alpha = exp(-dist * dist * 8.0) * vAlpha;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Ring shader for Saturn
export const ringVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ringFragmentShader = `
  varying vec2 vUv;

  void main() {
    float dist = length(vUv - vec2(0.5)) * 2.0;

    // Ring bands
    float ring = smoothstep(0.35, 0.4, dist) * smoothstep(1.0, 0.95, dist);
    float bands = sin(dist * 80.0) * 0.15 + 0.85;
    float gap = smoothstep(0.58, 0.6, dist) * smoothstep(0.65, 0.63, dist);
    ring *= (1.0 - gap * 0.6);
    ring *= bands;

    vec3 color = mix(vec3(0.76, 0.7, 0.5), vec3(0.9, 0.85, 0.7), sin(dist * 30.0) * 0.5 + 0.5);

    float alpha = ring * 0.7;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;
