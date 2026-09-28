'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { scroll } from '@/lib/scroll';
import { useAether } from '@/lib/store';
import { FRAGRANCES } from '@/lib/fragrances';
import { NOISE } from '@/lib/glsl';
import { damp } from '@/lib/math';

/** A drop of pure essence — morphs and takes the colour of the ingredient under the cursor. */
export default function Essence() {
  const mesh = useRef<THREE.Mesh>(null);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const target = useMemo(() => new THREE.Color(), []);
  const energy = useRef(0);

  const { geo, mat } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.35, stage.low ? 40 : 72);
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.14 },
        uFreq: { value: 0.8 },
        uColor: { value: new THREE.Color('#C9A87C') },
        uGold: { value: new THREE.Color('#C9A87C') },
        uAlpha: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uAmp;
        uniform float uFreq;
        varying vec3 vN;
        varying vec3 vView;
        ${NOISE}
        float disp(vec3 p) {
          return snoise(p * uFreq + vec3(0.0, uTime * 0.2, uTime * 0.05)) * uAmp
               + snoise(p * uFreq * 2.1 - vec3(uTime * 0.1)) * uAmp * 0.18;
        }
        void main() {
          vec3 n = normalize(normal);
          vec3 p = position + n * disp(position);
          vec3 t = normalize(cross(n, abs(n.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
          vec3 b = cross(n, t);
          float e = 0.012;
          vec3 q1 = position + t * e;
          q1 += normalize(q1) * disp(q1);
          vec3 q2 = position + b * e;
          q2 += normalize(q2) * disp(q2);
          vec3 dn = normalize(cross(q1 - p, q2 - p));
          if (dot(dn, n) < 0.0) dn = -dn;
          vN = normalize(normalMatrix * dn);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uGold;
        uniform float uTime;
        uniform float uAlpha;
        varying vec3 vN;
        varying vec3 vView;
        void main() {
          vec3 n = normalize(vN);
          vec3 v = normalize(vView);
          float ndv = max(dot(n, v), 0.0);
          float fres = pow(1.0 - ndv, 3.0);
          vec3 r = reflect(-v, n);
          // soft studio: dark floor, bright sky, two strip lights
          float sky = smoothstep(-0.3, 1.0, r.y);
          float s1 = smoothstep(0.86, 0.99, dot(r, normalize(vec3(-0.9, 0.3, 0.3))));
          float s2 = smoothstep(0.9, 0.995, dot(r, normalize(vec3(0.95, 0.1, 0.25))));
          float top = smoothstep(0.9, 0.99, r.y);
          vec3 metal = mix(uColor, uGold, 0.35);
          vec3 env = metal * (0.05 + sky * 0.9) + vec3(1.0, 0.94, 0.85) * (s1 * 1.4 + s2 * 1.1 + top * 0.9);
          vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.2 + uTime * 0.03));
          vec3 col = env * mix(vec3(1.0), metal * 1.3, 0.55);
          col += fres * mix(metal, irid, 0.35) * 1.3;
          col += uGold * pow(fres, 7.0) * 1.6;
          gl_FragColor = vec4(col * uAlpha, 1.0);
        }
      `,
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

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const on = stage.mode === 'essence';
    m.visible = on && stage.essence > 0.001;
    if (!m.visible) return;
    const dt = Math.min(delta, 0.05);
    const { noteColor, active } = useAether.getState();
    target.set(noteColor ?? FRAGRANCES[active].colors.accent);
    mat.uniforms.uColor.value.lerp(target, 1 - Math.exp(-4 * dt));
    energy.current = damp(energy.current, noteColor ? 1 : 0, 3, dt);
    mat.uniforms.uTime.value = state.clock.elapsedTime * (1 + energy.current * 1.5);
    mat.uniforms.uAmp.value = 0.13 + energy.current * 0.14 + Math.min(Math.abs(scroll.velocity) * 0.004, 0.08);
    mat.uniforms.uFreq.value = 0.8 + energy.current * 0.5;
    mat.uniforms.uAlpha.value = stage.essence;
    const e = stage.essence;
    const s = (0.5 + e * 0.4) * (aspect < 1 ? 0.7 : 1);
    m.scale.setScalar(s);
    m.position.set(aspect < 1 ? 0 : 1.9, aspect < 1 ? 0.9 : 0.1, 0);
    m.rotation.set(scroll.notes * 2.4 + stage.py * 0.3, scroll.notes * 3.2 + state.clock.elapsedTime * 0.1 + stage.px * 0.4, 0);
  });

  return <mesh ref={mesh} geometry={geo} material={mat} visible={false} />;
}
