'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { NOISE, POINT_SPRITE } from '@/lib/glsl';
import { fbm2, rng } from '@/lib/noise';
import { damp } from '@/lib/math';
import { bakeTerrain, SKY_VERT } from './terrain';

/* No. 2 — Aurora: northern lights breathing over a silent snowfield in Lapland. */

const HORIZON = new THREE.Color().setRGB(0.018, 0.04, 0.045);
const TERRAIN_Z = -380;

function snowHeight(x: number, z: number) {
  const d = Math.sqrt(x * x * 0.8 + (z + 150) * (z + 150));
  const rolling = fbm2(x * 0.006, z * 0.006, 4, 21) * 26;
  // mountains rise towards the rim of the valley
  const rim = THREE.MathUtils.smoothstep(d, 260, 620);
  const ridges = Math.pow(1 - Math.abs(fbm2(x * 0.0035 + 9, z * 0.0035, 4, 5) * 2 - 1), 2.2) * 150;
  return rolling - 14 + rim * (ridges + 40);
}

const skyFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uHorizon;
uniform float uGlow;
varying vec3 vDir;
${NOISE}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 zenith = vec3(0.002, 0.004, 0.008);
  vec3 col = mix(uHorizon, zenith, smoothstep(-0.02, 0.6, h));
  // aurora bounce light in the lower sky
  col += vec3(0.02, 0.09, 0.06) * uGlow * smoothstep(0.55, 0.05, h) * smoothstep(-0.05, 0.1, h);

  // stars
  vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 160.0;
  vec2 cell = floor(sp);
  float r = hash12(cell);
  vec2 jitter = hash22(cell) - 0.5;
  float dist = length(fract(sp) - 0.5 - jitter * 0.6);
  float star = step(0.975, r) * smoothstep(0.16, 0.0, dist);
  float tw = 0.6 + 0.4 * sin(uTime * (1.5 + r * 5.0) + r * 60.0);
  col += vec3(0.85, 0.9, 1.0) * star * tw * smoothstep(0.02, 0.25, h) * (r - 0.975) * 120.0;

  // faint milky way
  float band = exp(-pow((d.x * 0.7 + d.y * 0.7 - 0.4) * 3.2, 2.0));
  col += vec3(0.05, 0.06, 0.07) * band * fbm(sp * 0.03) * smoothstep(0.0, 0.3, h);
  gl_FragColor = vec4(col, 1.0);
}
`;

const curtainVert = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uSpan;
uniform float uHeight;
uniform float uBaseZ;
uniform float uBaseY;
varying vec2 vUv;
varying float vFold;
void main() {
  vUv = uv;
  float u = uv.x;
  float t = uTime * 0.12;
  float x = (u - 0.5) * uSpan;
  float z = uBaseZ
    + sin(u * 5.5 + t * 1.3 + uSeed) * 70.0
    + sin(u * 13.0 - t * 2.1 + uSeed * 2.0) * 22.0
    + sin(u * 31.0 + t * 3.0) * 5.0;
  float lean = uv.y * uv.y * 60.0;
  vec3 p = vec3(x, uBaseY + uv.y * uHeight, z - lean);
  vFold = cos(u * 13.0 - t * 2.1 + uSeed * 2.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const curtainFrag = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uIntensity;
varying vec2 vUv;
varying float vFold;
${NOISE}
void main() {
  float t = uTime;
  float rays = fbm(vec2(vUv.x * 60.0 + uSeed * 10.0 + t * 0.15, t * 0.05));
  rays = pow(rays, 1.6) * 1.8;
  float flicker = 0.7 + 0.3 * vnoise(vec2(vUv.x * 30.0 - t * 0.9, t * 0.7));
  float bottom = smoothstep(0.0, 0.06, vUv.y);
  float body = exp(-vUv.y * 2.4);
  float edgeU = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
  float pulse = 0.65 + 0.35 * sin(t * 0.4 + vUv.x * 8.0 + uSeed);
  vec3 green = vec3(0.15, 1.0, 0.52);
  vec3 teal = vec3(0.1, 0.7, 0.75);
  vec3 rose = vec3(0.85, 0.25, 0.55);
  vec3 col = mix(green, teal, smoothstep(0.0, 0.4, vUv.y) * 0.5);
  col = mix(col, rose, smoothstep(0.42, 0.95, vUv.y) * 0.8);
  float a = bottom * body * edgeU * rays * flicker * pulse * (0.75 + 0.25 * abs(vFold));
  gl_FragColor = vec4(col * a * uIntensity, 1.0);
}
`;

const snowVert = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
uniform float uPixelRatio;
attribute vec3 aSeed;
varying float vAlpha;
void main() {
  vec3 box = vec3(160.0, 70.0, 160.0);
  vec3 p = aSeed * box;
  p.y -= uTime * (2.0 + aSeed.z * 2.5);
  p.x += sin(uTime * 0.5 + aSeed.y * 30.0) * 3.0 + uTime * 1.2;
  vec3 rel = mod(p - uCam + box * 0.5, box) - box * 0.5;
  vec3 world = uCam + rel;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.25 + aSeed.x * 0.55) * uPixelRatio * (320.0 / -mv.z);
  vAlpha = smoothstep(160.0, 20.0, -mv.z) * smoothstep(0.3, 4.0, -mv.z);
}
`;

const snowFrag = /* glsl */ `
varying float vAlpha;
${POINT_SPRITE}
void main() {
  float a = pointSprite(gl_PointCoord) * vAlpha;
  gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * 1.2, a * 0.8);
}
`;

const glintVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aPhase;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = pow(max(0.0, sin(uTime * (0.8 + fract(aPhase * 7.0) * 2.5) + aPhase * 40.0)), 24.0);
  vA = tw * smoothstep(260.0, 10.0, -mv.z);
  gl_PointSize = (1.0 + tw * 2.5) * uPixelRatio * (90.0 / -mv.z);
}
`;

const glintFrag = /* glsl */ `
varying float vA;
${POINT_SPRITE}
void main() {
  float a = pointSprite(gl_PointCoord) * vA;
  gl_FragColor = vec4(vec3(1.4, 1.8, 2.0) * a, a);
}
`;

const CURTAINS = [
  { seed: 0.0, span: 1500, height: 260, z: -520, y: 60, intensity: 1.6 },
  { seed: 2.7, span: 1300, height: 200, z: -380, y: 90, intensity: 1.0 },
  { seed: 5.1, span: 1700, height: 320, z: -700, y: 40, intensity: 1.3 },
  { seed: 8.3, span: 900, height: 150, z: -260, y: 120, intensity: 0.7 },
];

export default function AuroraWorld({ scene, index }: { scene: THREE.Scene; index: number }) {
  const low = stage.low;
  const terrain = useMemo(
    () =>
      bakeTerrain(1500, low ? 150 : 220, (x, z) => snowHeight(x, z + TERRAIN_Z), (x, z, h, out) => {
        const k = THREE.MathUtils.clamp((h + 10) / 160, 0, 1);
        out.setRGB(0.52 - k * 0.2, 0.6 - k * 0.2, 0.68 - k * 0.18);
      }),
    [low],
  );

  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: skyFrag,
        uniforms: { uTime: { value: 0 }, uHorizon: { value: HORIZON }, uGlow: { value: 1 } },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  const curtains = useMemo(
    () =>
      CURTAINS.map(
        (c) =>
          new THREE.ShaderMaterial({
            vertexShader: curtainVert,
            fragmentShader: curtainFrag,
            uniforms: {
              uTime: { value: 0 },
              uSeed: { value: c.seed },
              uSpan: { value: c.span },
              uHeight: { value: c.height },
              uBaseZ: { value: c.z },
              uBaseY: { value: c.y },
              uIntensity: { value: c.intensity },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: false,
          }),
      ),
    [],
  );
  const curtainGeo = useMemo(() => new THREE.PlaneGeometry(1, 1, low ? 120 : 240, 1), [low]);

  const snow = useMemo(() => {
    const count = low ? 1500 : 4000;
    const r = rng(5);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = r();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: snowVert,
      fragmentShader: snowFrag,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthWrite: false,
    });
    return { g, m };
  }, [low]);

  const glints = useMemo(() => {
    const count = low ? 1500 : 5000;
    const r = rng(77);
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (r() - 0.5) * 500;
      const z = 80 - r() * 520;
      pos[i * 3] = x;
      pos[i * 3 + 1] = snowHeight(x, z) + 0.4;
      pos[i * 3 + 2] = z;
      phase[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: glintVert,
      fragmentShader: glintFrag,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { g, m };
  }, [low]);

  const skyMesh = useRef<THREE.Mesh>(null);
  const auroraLight = useRef<THREE.DirectionalLight>(null);
  const camY = useRef<number | null>(null);

  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2(HORIZON.clone(), 0.0021);
    scene.background = HORIZON.clone();
  }, [scene]);

  useEffect(() => {
    stage.rigs[index] = (cam, t, time) => {
      const z = 70 - t * 110 - stage.dive * 30 * (1 - t);
      const x = Math.sin(time * 0.04) * 4 - t * 10;
      const ground = Math.max(snowHeight(x, z), snowHeight(x, z - 20));
      const target = ground + 5 + t * 16;
      camY.current = camY.current === null ? target : damp(camY.current, target, 3, stage.instant ? 10 : 1 / 60);
      cam.position.set(x, camY.current, z);
      cam.lookAt(x + stage.px * 30 + stage.yaw * 70, camY.current + 26 + t * 150 + stage.py * 16, z - 220);
      cam.rotateZ(Math.sin(time * 0.15) * 0.01);
    };
    return () => {
      stage.rigs[index] = null;
    };
  }, [index]);

  useEffect(
    () => () => {
      terrain.dispose();
      sky.dispose();
      curtains.forEach((c) => c.dispose());
      curtainGeo.dispose();
      snow.g.dispose();
      snow.m.dispose();
      glints.g.dispose();
      glints.m.dispose();
    },
    [terrain, sky, curtains, curtainGeo, snow, glints],
  );

  useFrame((state) => {
    if (!stage.visible[index]) return;
    const time = state.clock.elapsedTime;
    const cam = state.camera;
    const pr = state.gl.getPixelRatio();
    sky.uniforms.uTime.value = time;
    curtains.forEach((c) => (c.uniforms.uTime.value = time));
    if (skyMesh.current) skyMesh.current.position.copy(cam.position);
    snow.m.uniforms.uTime.value = time;
    snow.m.uniforms.uCam.value.copy(cam.position);
    snow.m.uniforms.uPixelRatio.value = pr;
    glints.m.uniforms.uTime.value = time;
    glints.m.uniforms.uPixelRatio.value = pr;
    if (auroraLight.current) auroraLight.current.intensity = 0.55 + Math.sin(time * 0.4) * 0.15;
  });

  return (
    <>
      <mesh ref={skyMesh} material={sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[900, 48, 24]} />
      </mesh>
      <hemisphereLight args={['#1f6b55', '#05090c', 0.5]} />
      <directionalLight ref={auroraLight} position={[0, 200, -500]} intensity={0.6} color="#3dffae" />
      <directionalLight position={[300, 150, 200]} intensity={0.2} color="#8fb3ff" />
      <mesh geometry={terrain} position={[0, 0, TERRAIN_Z]}>
        <meshStandardMaterial vertexColors roughness={0.75} metalness={0} />
      </mesh>
      {CURTAINS.map((c, i) => (
        <mesh key={i} geometry={curtainGeo} material={curtains[i]} frustumCulled={false} renderOrder={1} />
      ))}
      <points geometry={glints.g} material={glints.m} frustumCulled={false} />
      <points geometry={snow.g} material={snow.m} frustumCulled={false} />
    </>
  );
}
