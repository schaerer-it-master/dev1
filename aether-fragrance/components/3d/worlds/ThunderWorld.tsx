'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { NOISE, POINT_SPRITE } from '@/lib/glsl';
import { fbm2, rng } from '@/lib/noise';
import { damp } from '@/lib/math';
import { bakeTerrain, SKY_VERT } from './terrain';

/* No. 1 — Thunder: a dry electrical storm over the dunes of Wadi Rum. */

const HORIZON = new THREE.Color().setRGB(0.16, 0.095, 0.058);
const TERRAIN_Z = -420;

function duneHeight(x: number, z: number) {
  const warp = fbm2(x * 0.004, z * 0.004, 3, 3) * 150;
  const q = x + warp;
  const ridge = Math.pow(1 - Math.abs(Math.sin(q * 0.015 + z * 0.0045)), 2.6);
  const big = fbm2(x * 0.0021 + 3.1, z * 0.0021, 3, 7);
  return ridge * 17 * (0.3 + big) + big * 36 - 20;
}

const skyFrag = /* glsl */ `
uniform float uTime;
uniform float uFlash;
uniform vec3 uFlashDir;
uniform vec3 uHorizon;
varying vec3 vDir;
${NOISE}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 zenith = vec3(0.012, 0.011, 0.014);
  vec3 col = mix(uHorizon, zenith, smoothstep(-0.03, 0.42, h));

  // storm deck projected on a cloud plane
  vec2 cuv = d.xz / max(h + 0.1, 0.04);
  float t = uTime * 0.018;
  float c1 = fbm(cuv * 0.32 + vec2(t, t * 0.35));
  float c2 = fbm(cuv * 0.85 - vec2(t * 1.6, 0.0) + c1 * 1.7);
  float clouds = smoothstep(0.3, 0.78, c1 * 0.55 + c2 * 0.55);
  float mask = smoothstep(-0.02, 0.1, h);
  vec3 cloudCol = mix(vec3(0.028, 0.024, 0.026), vec3(0.11, 0.085, 0.075), c2);

  float fd = max(dot(d, uFlashDir), 0.0);
  float local = pow(fd, 7.0) * uFlash;
  cloudCol += vec3(0.72, 0.76, 1.0) * (local * 3.2 + uFlash * 0.22) * (0.35 + c2 * 1.2);
  col = mix(col, cloudCol, clouds * mask);
  col += vec3(0.75, 0.8, 1.0) * local * 0.35;
  // dust haze hugging the horizon
  col += uHorizon * 0.9 * exp(-abs(h) * 16.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

const dustVert = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
uniform float uPixelRatio;
attribute vec3 aSeed;
varying float vAlpha;
void main() {
  vec3 box = vec3(260.0, 26.0, 260.0);
  vec3 p = aSeed * box;
  p.x += uTime * (22.0 + aSeed.y * 14.0);
  p.z += sin(uTime * 0.3 + aSeed.x * 20.0) * 4.0;
  p.y += sin(uTime * 0.8 + aSeed.z * 30.0) * 1.5;
  vec3 rel = mod(p - uCam + box * 0.5, box) - box * 0.5;
  vec3 world = uCam + rel - vec3(0.0, 4.0, 0.0);
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.35 + aSeed.y * 0.8) * uPixelRatio * (260.0 / -mv.z);
  vAlpha = smoothstep(260.0, 40.0, -mv.z) * smoothstep(0.5, 6.0, -mv.z);
}
`;

const dustFrag = /* glsl */ `
uniform float uFlash;
varying float vAlpha;
${POINT_SPRITE}
void main() {
  float a = pointSprite(gl_PointCoord) * vAlpha;
  vec3 col = mix(vec3(0.55, 0.38, 0.22), vec3(0.9, 0.92, 1.0), uFlash * 0.6);
  gl_FragColor = vec4(col * (0.6 + uFlash * 2.0), a * 0.55);
}
`;

type Strike = { start: number; next: number; pulses: { t: number; a: number }[]; bolt: boolean };

function boltPath(start: THREE.Vector3, end: THREE.Vector3, r: () => number, detail: number, spread: number) {
  let pts = [start.clone(), end.clone()];
  let disp = spread;
  for (let k = 0; k < detail; k++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const mid = pts[i].clone().lerp(pts[i + 1], 0.5);
      mid.x += (r() - 0.5) * disp;
      mid.z += (r() - 0.5) * disp * 0.6;
      mid.y += (r() - 0.5) * disp * 0.15;
      next.push(mid, pts[i + 1]);
    }
    pts = next;
    disp *= 0.56;
  }
  return pts;
}

function buildBolt(r: () => number, origin: THREE.Vector3) {
  const top = origin.clone().add(new THREE.Vector3(0, 320, 0));
  const bottom = origin.clone().add(new THREE.Vector3((r() - 0.5) * 60, 0, (r() - 0.5) * 30));
  const main = boltPath(top, bottom, r, 7, 90);
  const geos: THREE.BufferGeometry[] = [];
  const tube = (pts: THREE.Vector3[], radius: number) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), pts.length * 2, radius, 4, false);
  geos.push(tube(main, 0.9));
  const branches = 3 + Math.floor(r() * 4);
  for (let b = 0; b < branches; b++) {
    const i = Math.floor(8 + r() * main.length * 0.55);
    const s = main[i];
    const dir = new THREE.Vector3((r() - 0.5) * 2.2, -0.6 - r() * 0.8, (r() - 0.5) * 0.8).normalize();
    const e = s.clone().addScaledVector(dir, 50 + r() * 110);
    geos.push(tube(boltPath(s, e, r, 5, 40), 0.45));
  }
  return geos;
}

export default function ThunderWorld({ scene, index }: { scene: THREE.Scene; index: number }) {
  const low = stage.low;
  const terrain = useMemo(
    () =>
      bakeTerrain(
        1500,
        low ? 150 : 230,
        (x, z) => duneHeight(x, z + TERRAIN_Z),
        (x, z, h, out) => {
          const k = THREE.MathUtils.clamp((h + 20) / 50, 0, 1);
          out.setRGB(0.07 + k * 0.2, 0.042 + k * 0.12, 0.024 + k * 0.06);
        },
      ),
    [low],
  );

  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: skyFrag,
        uniforms: {
          uTime: { value: 0 },
          uFlash: { value: 0 },
          uFlashDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() },
          uHorizon: { value: HORIZON },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  const dust = useMemo(() => {
    const count = low ? 1200 : 3200;
    const r = rng(11);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = r();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uPixelRatio: { value: 1 },
        uFlash: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    return { g, m };
  }, [low]);

  const boltMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(9, 9.5, 12),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(1.2, 1.3, 2.2),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  const boltGroup = useRef<THREE.Group>(null);
  const flashLight = useRef<THREE.DirectionalLight>(null);
  const skyMesh = useRef<THREE.Mesh>(null);
  const strike = useRef<Strike>({ start: -10, next: 1.2, pulses: [], bolt: true });
  const random = useMemo(() => rng(1337), []);
  const camY = useRef<number | null>(null);

  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2(HORIZON.clone(), 0.0026);
    scene.background = HORIZON.clone();
  }, [scene]);

  useEffect(() => {
    stage.rigs[index] = (cam, t, time) => {
      const z = 110 - t * 190 - stage.dive * 40 * (1 - t);
      const x = Math.sin(t * 2.2) * 22 + Math.sin(time * 0.05) * 3;
      const ground = Math.max(duneHeight(x, z), duneHeight(x, z - 18), duneHeight(x, z - 40) - 4);
      const target = ground + 7.5 + t * 7;
      camY.current = camY.current === null ? target : damp(camY.current, target, 3, stage.instant ? 10 : 1 / 60);
      cam.position.set(x, camY.current, z);
      cam.lookAt(x * 0.25 + stage.px * 26 + stage.yaw * 60, camY.current + 12 + t * 34 + stage.py * 12, z - 220);
      cam.rotateZ(Math.sin(time * 0.21) * 0.012 - stage.px * 0.02);
    };
    return () => {
      stage.rigs[index] = null;
    };
  }, [index]);

  useEffect(
    () => () => {
      terrain.dispose();
      sky.dispose();
      dust.g.dispose();
      dust.m.dispose();
    },
    [terrain, sky, dust],
  );

  useFrame((state) => {
    if (!stage.visible[index]) return;
    const time = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;
    const s = strike.current;
    const t = stage.worldT[index];

    if (time > s.next) {
      s.start = time;
      s.next = time + 0.9 + random() * (3.2 - t * 1.6);
      s.bolt = random() > 0.3;
      const n = 2 + Math.floor(random() * 3);
      s.pulses = Array.from({ length: n }, (_, i) => ({ t: i === 0 ? 0 : i * (0.06 + random() * 0.1), a: 0.5 + random() * 0.6 }));
      const origin = new THREE.Vector3(
        cam.position.x + (random() - 0.5) * 520,
        -10,
        cam.position.z - 260 - random() * 420,
      );
      const g = boltGroup.current;
      if (g) {
        g.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
        g.clear();
        if (s.bolt) {
          for (const geo of buildBolt(random, origin)) {
            g.add(new THREE.Mesh(geo, boltMat));
            const halo = new THREE.Mesh(geo, haloMat);
            halo.scale.setScalar(1);
            g.add(halo);
          }
        }
      }
      sky.uniforms.uFlashDir.value.copy(origin.clone().add(new THREE.Vector3(0, 240, 0)).sub(cam.position).normalize());
      if (flashLight.current) flashLight.current.position.copy(origin).add(new THREE.Vector3(0, 300, 0));
    }

    let flash = 0;
    for (const p of s.pulses) {
      const dt = time - s.start - p.t;
      if (dt >= 0) flash += p.a * Math.exp(-dt * 16);
    }
    flash = Math.min(flash, 1.4) * (s.bolt ? 1 : 0.55);
    boltMat.opacity = Math.min(1, flash * 1.3);
    haloMat.opacity = flash * 0.18;

    sky.uniforms.uTime.value = time;
    sky.uniforms.uFlash.value = flash;
    if (skyMesh.current) skyMesh.current.position.copy(cam.position);
    if (flashLight.current) flashLight.current.intensity = flash * 7;
    const fog = scene.fog as THREE.FogExp2;
    fog.color.copy(HORIZON).lerp(new THREE.Color(0.35, 0.36, 0.45), flash * 0.35);

    dust.m.uniforms.uTime.value = time;
    dust.m.uniforms.uCam.value.copy(cam.position);
    dust.m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    dust.m.uniforms.uFlash.value = flash;
  });

  return (
    <>
      <mesh ref={skyMesh} material={sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[900, 48, 24]} />
      </mesh>
      <hemisphereLight args={['#3b2b25', '#120a06', 0.55]} />
      <directionalLight position={[40, 60, -500]} intensity={0.9} color="#ff9656" />
      <directionalLight position={[-200, 120, 200]} intensity={0.12} color="#9aa6c8" />
      <directionalLight ref={flashLight} intensity={0} color="#dfe6ff" />
      <mesh geometry={terrain} position={[0, 0, TERRAIN_Z]}>
        <meshStandardMaterial vertexColors roughness={0.94} metalness={0} />
      </mesh>
      <group ref={boltGroup} />
      <points geometry={dust.g} material={dust.m} frustumCulled={false} />
    </>
  );
}
