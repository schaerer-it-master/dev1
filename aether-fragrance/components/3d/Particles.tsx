'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { useAether } from '@/lib/store';
import { FRAGRANCES } from '@/lib/fragrances';
import { rng } from '@/lib/noise';
import { POINT_SPRITE } from '@/lib/glsl';

/** Gold dust suspended around the flacon. Repelled by the cursor, swirls on hover. */
export function Dust() {
  const points = useRef<THREE.Points>(null);
  const mouse = useMemo(() => new THREE.Vector3(99, 99, 0), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  const { geo, mat } = useMemo(() => {
    const count = stage.low ? 700 : 2200;
    const r = rng(4);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const rad = 1.6 + Math.pow(r(), 0.7) * 9;
      const a = r() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = (r() - 0.5) * 9;
      pos[i * 3 + 2] = Math.sin(a) * rad - 1.5;
      seed[i * 3] = r();
      seed[i * 3 + 1] = r();
      seed[i * 3 + 2] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: mouse },
        uEnergy: { value: 0 },
        uPixelRatio: { value: 1 },
        uTint: { value: new THREE.Color() },
        uAlpha: { value: 1 },
        uSwirl: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uEnergy;
        uniform float uPixelRatio;
        uniform float uSwirl;
        attribute vec3 aSeed;
        varying float vTw;
        varying float vMix;
        void main() {
          vec3 p = position;
          float ang = uTime * 0.035 * (0.4 + aSeed.x) + uSwirl * (0.6 + aSeed.y);
          float c = cos(ang), s = sin(ang);
          p.xz = mat2(c, -s, s, c) * p.xz;
          p.y += sin(uTime * 0.25 + aSeed.y * 30.0) * 0.35 + uTime * 0.05 * (aSeed.z - 0.3);
          p.y = mod(p.y + 4.5, 9.0) - 4.5;
          vec3 toM = p - uMouse;
          float dm = length(toM);
          p += normalize(toM + 1e-4) * smoothstep(2.2, 0.0, dm) * (0.9 + uEnergy);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vTw = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed.x * 2.0) + aSeed.z * 50.0);
          vMix = aSeed.y;
          gl_PointSize = (2.0 + aSeed.x * 5.5) * uPixelRatio * (6.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTint;
        uniform float uAlpha;
        uniform float uEnergy;
        varying float vTw;
        varying float vMix;
        ${POINT_SPRITE}
        void main() {
          float a = pointSprite(gl_PointCoord) * vTw * uAlpha;
          vec3 gold = vec3(0.9, 0.66, 0.4);
          vec3 col = mix(gold, uTint * 1.6, vMix * 0.6) * (1.2 + uEnergy * 1.5);
          gl_FragColor = vec4(col * a, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, mat: m };
  }, [mouse]);

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );

  useFrame((state, delta) => {
    const p = points.current;
    if (!p) return;
    const visible = (stage.mode === 'hero' && !stage.fullscreen) || stage.mode === 'essence';
    p.visible = visible;
    if (!visible) return;
    ndc.set(stage.px, stage.py);
    ray.setFromCamera(ndc, state.camera);
    ray.ray.intersectPlane(plane, mouse);
    const u = mat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uEnergy.value = stage.energy;
    u.uSwirl.value += Math.min(delta, 0.05) * (stage.energy * 1.4 + stage.dive * 3);
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uTint.value.setRGB(stage.tint[0], stage.tint[1], stage.tint[2]);
    u.uAlpha.value = stage.mode === 'essence' ? stage.essence * 0.7 : stage.intro;
  });

  return <points ref={points} geometry={geo} material={mat} frustumCulled={false} />;
}

/** One-shot explosion of light whenever a new fragrance is chosen. */
export function Burst() {
  const points = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const count = stage.low ? 500 : 1400;
    const r = rng(8);
    const dir = new Float32Array(count * 3);
    const seed = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      dir[i * 3] = s * Math.cos(th);
      dir[i * 3 + 1] = u * 0.8;
      dir[i * 3 + 2] = s * Math.sin(th);
      seed[i * 2] = r();
      seed[i * 2 + 1] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(dir, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: 10 },
        uColor: { value: new THREE.Color(1, 0.8, 0.5) },
        uPixelRatio: { value: 1 },
      },
      vertexShader: /* glsl */ `
        uniform float uT;
        uniform float uPixelRatio;
        attribute vec2 aSeed;
        varying float vA;
        void main() {
          float speed = 2.5 + aSeed.x * 6.0;
          float travel = (1.0 - exp(-uT * (1.2 + aSeed.y * 1.5))) * speed;
          vec3 p = position * travel;
          p.y += uT * uT * -0.35 + aSeed.y * 0.4 * uT;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vA = exp(-uT * (0.9 + aSeed.x)) * smoothstep(0.0, 0.05, uT);
          gl_PointSize = (2.0 + aSeed.y * 6.0) * uPixelRatio * (5.0 / -mv.z) * (0.5 + vA);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vA;
        ${POINT_SPRITE}
        void main() {
          float a = pointSprite(gl_PointCoord) * vA;
          gl_FragColor = vec4(uColor * 4.0 * a, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, mat: m };
  }, []);

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );

  useFrame((state) => {
    const p = points.current;
    if (!p) return;
    const t = state.clock.elapsedTime - stage.burstAt;
    p.visible = t < 5 && stage.mode === 'hero' && !stage.fullscreen;
    if (!p.visible) return;
    mat.uniforms.uT.value = t;
    mat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    mat.uniforms.uColor.value.set(FRAGRANCES[useAether.getState().active].colors.glow);
  });

  return <points ref={points} geometry={geo} material={mat} frustumCulled={false} position={[0, -0.1, 0]} />;
}
