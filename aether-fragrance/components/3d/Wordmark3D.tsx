'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from '@/public/fonts/bodoni-moda.typeface.json';
import { stage } from '@/lib/stage';
import { clamp, damp } from '@/lib/math';

/** Monumental extruded AETHER behind the flacon — refracted by the glass as it turns. */

const WORD = 'AETHER';
const SIZE = 1.55;
const TRACKING = 0.42;

export default function Wordmark3D() {
  const group = useRef<THREE.Group>(null);
  const letters = useRef<(THREE.Mesh | null)[]>([]);
  const aspect = useThree((s) => s.size.width / s.size.height);

  const glyphs = useMemo(() => {
    const font = new Font(fontData as unknown as ConstructorParameters<typeof Font>[0]);
    const res = (fontData as { resolution: number }).resolution;
    const data = fontData as unknown as { glyphs: Record<string, { ha: number }> };
    let x = 0;
    const out = WORD.split('').map((ch) => {
      const geo = new TextGeometry(ch, {
        font,
        size: SIZE,
        depth: 0.22,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.012,
        bevelSegments: 3,
      });
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const cx = (bb.min.x + bb.max.x) / 2;
      const cy = (bb.min.y + bb.max.y) / 2;
      geo.translate(-cx, -cy, -0.11);
      const advance = (data.glyphs[ch].ha / res) * SIZE;
      const item = { geo, x: x + cx, w: advance };
      x += advance + TRACKING;
      return item;
    });
    const total = x - TRACKING;
    out.forEach((g) => (g.x -= total / 2));
    return out;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#C9A87C',
        metalness: 1,
        roughness: 0.3,
        envMapIntensity: 1.1,
        emissive: new THREE.Color('#2b2013'),
      }),
    [],
  );

  useEffect(
    () => () => {
      glyphs.forEach((g) => g.geo.dispose());
      mat.dispose();
    },
    [glyphs, mat],
  );

  const sway = useRef(0);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const visible = stage.mode === 'hero' && stage.dive < 0.98;
    g.visible = visible;
    if (!visible) return;
    const time = state.clock.elapsedTime;
    const { intro, rotate, explode, dive } = stage;
    sway.current = damp(sway.current, stage.px, 2, Math.min(delta, 0.05));
    const fit = clamp(aspect / 1.45, 0.42, 1);
    g.scale.setScalar(fit);
    g.position.set(-sway.current * 0.35, 0.55 + rotate * 0.6, -4.6 - explode * 2.5 - dive * 4);

    letters.current.forEach((m, i) => {
      if (!m) return;
      const k = i - (WORD.length - 1) / 2;
      const delay = i * 0.08;
      const inT = clamp((intro - delay) / 0.5);
      const e = 1 - Math.pow(1 - inT, 4);
      const spread = rotate * 0.35 + explode * 0.9;
      m.position.set(
        glyphs[i].x * (1 + spread),
        (1 - e) * -2.2 + Math.sin(time * 0.5 + i) * 0.05 + Math.sin(i * 2.1) * explode * 0.9,
        Math.cos(i * 1.7) * explode * 1.2,
      );
      m.rotation.set((1 - e) * 1.2 + explode * Math.sin(i * 3.3) * 0.5, k * 0.18 * spread + sway.current * 0.15, Math.sin(i * 1.3) * explode * 0.25);
      m.scale.setScalar(0.001 + e);
    });
    mat.emissiveIntensity = 0.6 + Math.sin(time * 0.8) * 0.15;
  });

  return (
    <group ref={group}>
      {glyphs.map((g, i) => (
        <mesh key={i} ref={(el) => void (letters.current[i] = el)} geometry={g.geo} material={mat} />
      ))}
    </group>
  );
}
