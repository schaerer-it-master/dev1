'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { NOISE, POINT_SPRITE } from '@/lib/glsl';
import { fbm2, rng } from '@/lib/noise';
import { bakeTerrain, SKY_VERT } from './terrain';

/* No. 3 — Ember Sea: the sun burning itself into the Atlantic off Cabo de São Vicente. */

const HAZE = new THREE.Color().setRGB(0.55, 0.14, 0.035);

const SKY_FN = /* glsl */ `
uniform vec3 uSunDir;
uniform float uSunset;
vec3 skyColor(vec3 d) {
  float h = d.y;
  float sd = max(dot(d, uSunDir), 0.0);
  vec3 zen = vec3(0.006, 0.003, 0.008);
  vec3 mid = mix(vec3(0.34, 0.045, 0.03), vec3(0.22, 0.02, 0.03), uSunset);
  vec3 hor = mix(vec3(1.5, 0.52, 0.1), vec3(1.2, 0.28, 0.05), uSunset);
  vec3 col = mix(hor, mid, smoothstep(-0.01, 0.13, h));
  col = mix(col, zen, smoothstep(0.1, 0.6, h));
  col += vec3(1.5, 0.55, 0.14) * pow(sd, 10.0) * 0.9;
  col += vec3(2.4, 1.0, 0.3) * pow(sd, 120.0) * 2.0;
  col += vec3(16.0, 8.0, 3.0) * smoothstep(0.99955, 0.99975, sd);
  return col;
}
`;

const skyFrag = /* glsl */ `
uniform float uTime;
varying vec3 vDir;
${NOISE}
${SKY_FN}
void main() {
  vec3 d = normalize(vDir);
  vec3 col = skyColor(d);
  float h = d.y;
  float sd = max(dot(d, uSunDir), 0.0);
  vec2 cuv = d.xz / max(h + 0.05, 0.02);
  float c = fbm(cuv * vec2(0.07, 0.55) + vec2(uTime * 0.006, 0.0));
  float clouds = smoothstep(0.46, 0.76, c) * smoothstep(0.012, 0.05, h) * smoothstep(0.45, 0.08, h);
  vec3 cloudCol = mix(vec3(0.05, 0.012, 0.02), vec3(2.2, 0.7, 0.18), pow(sd, 4.0) * 0.95 + 0.04);
  col = mix(col, cloudCol, clouds * 0.9);
  // sun partially hidden by clouds keeps a bright rim
  col += vec3(1.8, 0.6, 0.1) * clouds * pow(sd, 60.0) * 2.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

const oceanVert = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
const float PI = 3.14159265;

vec3 gerstner(vec4 w, vec3 p, inout vec3 tangent, inout vec3 binormal) {
  float steep = w.z;
  float k = 2.0 * PI / w.w;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(w.xy);
  float f = k * (dot(d, p.xz) - c * uTime);
  float a = steep / k;
  tangent += vec3(-d.x * d.x * (steep * sin(f)), d.x * (steep * cos(f)), -d.x * d.y * (steep * sin(f)));
  binormal += vec3(-d.x * d.y * (steep * sin(f)), d.y * (steep * cos(f)), -d.y * d.y * (steep * sin(f)));
  return vec3(d.x * (a * cos(f)), a * sin(f), d.y * (a * cos(f)));
}

void main() {
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  vec3 q = p;
  q += gerstner(vec4(1.0, 0.55, 0.22, 64.0), p, tangent, binormal);
  q += gerstner(vec4(0.35, 1.0, 0.18, 33.0), p, tangent, binormal);
  q += gerstner(vec4(-0.7, 0.45, 0.16, 19.0), p, tangent, binormal);
  q += gerstner(vec4(0.2, -0.9, 0.12, 9.5), p, tangent, binormal);
  q += gerstner(vec4(-0.4, -1.0, 0.08, 5.2), p, tangent, binormal);
  vNormal = normalize(cross(binormal, tangent));
  vWorld = q;
  vHeight = q.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(q, 1.0);
}
`;

const oceanFrag = /* glsl */ `
uniform float uTime;
uniform float uBurn;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
${NOISE}
${SKY_FN}
void main() {
  vec3 v = normalize(cameraPosition - vWorld);
  float dist = length(vWorld.xz - cameraPosition.xz);
  vec2 np = vWorld.xz * 0.18 + uTime * vec2(0.35, 0.12);
  float detail = smoothstep(260.0, 20.0, dist);
  vec3 n = normalize(vNormal + vec3(vnoise(np) - 0.5, 0.0, vnoise(np + 7.3) - 0.5) * 0.5 * detail);
  vec3 r = reflect(-v, n);
  r.y = abs(r.y);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 deep = vec3(0.01, 0.003, 0.004);
  vec3 col = mix(deep, skyColor(r), fres);
  float rs = max(dot(r, uSunDir), 0.0);
  col += vec3(1.0, 0.5, 0.18) * pow(rs, 700.0) * 60.0;
  col += vec3(1.0, 0.4, 0.12) * pow(rs, 36.0) * 1.2;

  // fire walking on the water
  vec2 fp = vWorld.xz * vec2(0.03, 0.011) + vec2(0.0, uTime * 0.22);
  float flame = fbm(fp + fbm(fp * 1.8 - vec2(uTime * 0.12, 0.0)));
  float lane = exp(-abs(vWorld.x - cameraPosition.x) / (26.0 + dist * 0.5));
  float fire = smoothstep(0.52, 0.82, flame) * lane * smoothstep(30.0, 160.0, dist) * smoothstep(900.0, 300.0, dist);
  fire *= 0.35 + smoothstep(-1.5, 2.5, vHeight);
  vec3 fireCol = mix(vec3(1.4, 0.22, 0.02), vec3(3.4, 1.5, 0.35), smoothstep(0.6, 0.85, flame));
  col += fireCol * fire * 2.6 * uBurn;
  // embers glitter on the crests
  vec2 cell = vWorld.xz * 0.9;
  vec2 fc = fract(cell) - 0.5;
  float sparkle = step(0.975, hash12(floor(cell) + floor(uTime * 5.0))) * smoothstep(0.3, 0.0, length(fc)) * lane * detail;
  col += vec3(3.0, 1.2, 0.3) * sparkle * uBurn;

  col = mix(col, skyColor(normalize(vec3(r.x, 0.002, r.z))), smoothstep(380.0, 900.0, dist));
  gl_FragColor = vec4(col, 1.0);
}
`;

const emberVert = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
uniform float uPixelRatio;
attribute vec3 aSeed;
varying float vAlpha;
varying float vHeat;
void main() {
  vec3 box = vec3(180.0, 60.0, 220.0);
  vec3 p = aSeed * box;
  p.y += uTime * (2.5 + aSeed.x * 5.0);
  p.x += sin(uTime * 0.7 + aSeed.z * 40.0) * 4.0 + uTime * 2.0;
  vec3 rel = mod(p - uCam + box * 0.5, box) - box * 0.5;
  vec3 world = uCam + rel + vec3(0.0, 18.0, -40.0);
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;
  float flick = 0.5 + 0.5 * sin(uTime * (4.0 + aSeed.y * 9.0) + aSeed.x * 50.0);
  vHeat = flick;
  gl_PointSize = (0.3 + aSeed.z * 0.9) * (0.6 + flick * 0.6) * uPixelRatio * (260.0 / -mv.z);
  vAlpha = smoothstep(220.0, 30.0, -mv.z) * smoothstep(0.3, 5.0, -mv.z);
}
`;

const emberFrag = /* glsl */ `
varying float vAlpha;
varying float vHeat;
${POINT_SPRITE}
void main() {
  float a = pointSprite(gl_PointCoord) * vAlpha;
  vec3 col = mix(vec3(2.2, 0.5, 0.08), vec3(4.0, 2.2, 0.8), vHeat);
  gl_FragColor = vec4(col * a, a);
}
`;

const CLIFF_X = 260;
const CLIFF_Z = -760;

/** A headland that rises out of the sea on the right and tapers back into it at both ends. */
function cliffHeight(x: number, z: number) {
  const lz = z - CLIFF_Z;
  const edge = THREE.MathUtils.smoothstep(x + fbm2(z * 0.012, 3, 3, 9) * 70, CLIFF_X - 120, CLIFF_X - 40);
  const taper = (1 - THREE.MathUtils.smoothstep(lz, 120, 330)) * THREE.MathUtils.smoothstep(lz, -340, -150);
  const top = 55 + fbm2(x * 0.012, z * 0.012, 4, 4) * 55;
  return -40 + edge * taper * (top + 40);
}

export default function EmberSeaWorld({ scene, index }: { scene: THREE.Scene; index: number }) {
  const low = stage.low;
  const sunDir = useMemo(() => new THREE.Vector3(0, 0.05, -1).normalize(), []);

  const ocean = useMemo(() => {
    const seg = low ? 160 : 280;
    const g = new THREE.PlaneGeometry(2, 2, seg, seg);
    g.rotateX(-Math.PI / 2);
    // concentrate vertices near the camera: x' = sign(x)·|x|^2
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setX(i, Math.sign(x) * x * x * 1100);
      pos.setZ(i, Math.sign(z) * z * z * 1100);
    }
    g.computeBoundingSphere();
    const m = new THREE.ShaderMaterial({
      vertexShader: oceanVert,
      fragmentShader: oceanFrag,
      uniforms: {
        uTime: { value: 0 },
        uBurn: { value: 1 },
        uSunDir: { value: sunDir },
        uSunset: { value: 0 },
      },
    });
    return { g, m };
  }, [low, sunDir]);

  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: skyFrag,
        uniforms: { uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunset: { value: 0 } },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [sunDir],
  );

  const embers = useMemo(() => {
    const count = low ? 900 : 2600;
    const r = rng(99);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = r();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: emberVert,
      fragmentShader: emberFrag,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPixelRatio: { value: 1 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { g, m };
  }, [low]);

  const cliff = useMemo(() => bakeTerrain(760, low ? 80 : 140, (x, z) => cliffHeight(x + CLIFF_X + 100, z + CLIFF_Z)), [low]);
  const beam = useRef<THREE.Group>(null);
  const skyMesh = useRef<THREE.Mesh>(null);
  const oceanMesh = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2(HAZE.clone(), 0.0019);
    scene.background = HAZE.clone();
  }, [scene]);

  useEffect(() => {
    stage.rigs[index] = (cam, t, time) => {
      const z = 60 - t * 170 - stage.dive * 36 * (1 - t);
      const x = Math.sin(time * 0.07) * 3 - t * 6;
      cam.position.set(x, 6 + Math.sin(time * 0.55) * 0.5 + t * 3, z);
      cam.lookAt(x + stage.px * 32 + stage.yaw * 70, 7 + stage.py * 12 - t * 2, z - 300);
      cam.rotateZ(Math.sin(time * 0.35) * 0.012);
    };
    return () => {
      stage.rigs[index] = null;
    };
  }, [index]);

  useEffect(
    () => () => {
      ocean.g.dispose();
      ocean.m.dispose();
      sky.dispose();
      embers.g.dispose();
      embers.m.dispose();
      cliff.dispose();
    },
    [ocean, sky, embers, cliff],
  );

  useFrame((state) => {
    if (!stage.visible[index]) return;
    const time = state.clock.elapsedTime;
    const cam = state.camera;
    const t = stage.worldT[index];
    sunDir.set(0, 0.05 - t * 0.05, -1).normalize();
    sky.uniforms.uTime.value = time;
    sky.uniforms.uSunset.value = t;
    ocean.m.uniforms.uTime.value = time;
    ocean.m.uniforms.uSunset.value = t;
    ocean.m.uniforms.uBurn.value = 0.8 + t * 0.6;
    embers.m.uniforms.uTime.value = time;
    embers.m.uniforms.uCam.value.copy(cam.position);
    embers.m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (skyMesh.current) skyMesh.current.position.copy(cam.position);
    if (oceanMesh.current) {
      const snap = 8;
      oceanMesh.current.position.set(Math.round(cam.position.x / snap) * snap, 0, Math.round(cam.position.z / snap) * snap);
    }
    if (beam.current) beam.current.rotation.y = time * 0.9;
  });

  return (
    <>
      <mesh ref={skyMesh} material={sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[900, 48, 24]} />
      </mesh>
      <hemisphereLight args={['#ff6a2a', '#0a0203', 0.35]} />
      <directionalLight position={[0, 30, -600]} intensity={1.6} color="#ff7a30" />
      <mesh ref={oceanMesh} geometry={ocean.g} material={ocean.m} frustumCulled={false} />
      <mesh geometry={cliff} position={[CLIFF_X + 100, 0, CLIFF_Z]}>
        <meshStandardMaterial color="#120706" roughness={0.9} />
      </mesh>
      {/* lighthouse of São Vicente */}
      <group position={[CLIFF_X + 30, cliffHeight(CLIFF_X + 30, CLIFF_Z + 60) - 2, CLIFF_Z + 60]}>
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry args={[2.2, 3, 18, 12]} />
          <meshStandardMaterial color="#1a0d0a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 18, 0]}>
          <sphereGeometry args={[1.6, 16, 12]} />
          <meshBasicMaterial color={new THREE.Color(8, 5, 2.4)} toneMapped={false} fog={false} />
        </mesh>
        <group ref={beam} position={[0, 18, 0]}>
          <mesh position={[-90, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[14, 180, 24, 1, true]} />
            <meshBasicMaterial
              color={new THREE.Color(0.9, 0.55, 0.25)}
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              fog={false}
            />
          </mesh>
        </group>
      </group>
      <points geometry={embers.g} material={embers.m} frustumCulled={false} />
    </>
  );
}
