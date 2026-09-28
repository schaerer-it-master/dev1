'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { scroll } from '@/lib/scroll';
import { useAether } from '@/lib/store';
import { FRAGRANCES } from '@/lib/fragrances';
import { clamp, damp, easeInCubic } from '@/lib/math';
import { portalUniforms, portalVolumeMaterial } from './WorldPortal';

/*
 * The flacon: seven stacked plates of glass (so it can come apart), a liquid core that
 * is a window into the chosen world, a gold collar and an obsidian sphere as cap.
 */

const W = 2.1;
const D = 1.22;
const PLATE_H = 0.44;
const PLATES = 6;
const BEVEL = 0.035;
const BODY_H = PLATE_H * PLATES;
const BASE_H = 0.34;

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function plateGeometry(w: number, d: number, h: number, r: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, d - bevel * 2, r), {
    depth: h - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  g.translate(0, -(bb.min.y + bb.max.y) / 2, 0);
  g.computeVertexNormals();
  return g;
}

function drawLabel(ctx: CanvasRenderingContext2D, index: number, font: string) {
  const f = FRAGRANCES[index];
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#e8cfa4';
  ctx.strokeStyle = 'rgba(232,207,164,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${height * 0.34}px ${font}`;
  // letter-spaced wordmark
  const word = 'AETHER';
  const spacing = height * 0.16;
  const widths = word.split('').map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (word.length - 1);
  let x = width / 2 - total / 2;
  word.split('').forEach((c, i) => {
    ctx.fillText(c, x + widths[i] / 2, height * 0.36);
    x += widths[i] + spacing;
  });
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.62);
  ctx.lineTo(width * 0.7, height * 0.62);
  ctx.stroke();
  ctx.font = `400 ${height * 0.12}px ui-monospace, "DM Mono", monospace`;
  ctx.fillText(`${f.no.toUpperCase()} — ${f.name.toUpperCase()}   ·   EAU DE PARFUM   ·   100 ML`, width / 2, height * 0.8);
}

type Props = { displayFont: string };

export default function PerfumeBottle({ displayFont }: Props) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const plates = useRef<(THREE.Group | null)[]>([]);
  const base = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const collar = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const pool = useRef<THREE.Mesh>(null);
  const hover = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });

  const plateGeo = useMemo(() => plateGeometry(W, D, PLATE_H, 0.22, BEVEL), []);
  const baseGeo = useMemo(() => plateGeometry(W + 0.16, D + 0.12, BASE_H, 0.28, 0.05), []);

  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        thickness: 0.85,
        ior: 1.46,
        dispersion: 0.45,
        attenuationColor: new THREE.Color('#f1e6d2'),
        attenuationDistance: 6,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        specularIntensity: 1,
        specularColor: new THREE.Color('#fff3df'),
        iridescence: 0.3,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [180, 520],
        envMapIntensity: 2.2,
      }),
    [],
  );
  const smoked = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#bba98f',
        roughness: 0.12,
        transmission: 1,
        thickness: 0.6,
        ior: 1.52,
        attenuationColor: new THREE.Color('#3a2a1c'),
        attenuationDistance: 0.6,
        clearcoat: 1,
        envMapIntensity: 1.2,
      }),
    [],
  );
  const coreMat = useMemo(portalVolumeMaterial, []);

  const label = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { canvas, tex, ctx: canvas.getContext('2d')! };
  }, []);

  const poolMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTint: portalUniforms.uTint, uGold: portalUniforms.uGold, uFade: { value: 1 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTint; uniform vec3 uGold; uniform float uFade; varying vec2 vUv;
          void main(){
            float d = length((vUv - 0.5) * vec2(1.0, 1.9));
            float g = exp(-d * d * 14.0);
            float ring = exp(-pow((d - 0.3) * 18.0, 2.0)) * 0.25;
            vec3 c = mix(uGold, uTint, 0.5) * (g * 0.9 + ring);
            gl_FragColor = vec4(c * uFade, 1.0);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  // redraw the engraved label whenever the fragrance changes
  useEffect(() => {
    const draw = (i: number) => {
      drawLabel(label.ctx, i, displayFont);
      label.tex.needsUpdate = true;
    };
    const fonts = typeof document !== 'undefined' ? document.fonts : null;
    draw(useAether.getState().active);
    fonts?.ready.then(() => draw(useAether.getState().active));
    return useAether.subscribe((s, prev) => {
      if (s.active !== prev.active) draw(s.active);
    });
  }, [label, displayFont]);

  useEffect(
    () => () => {
      plateGeo.dispose();
      baseGeo.dispose();
      glass.dispose();
      smoked.dispose();
      coreMat.dispose();
      label.tex.dispose();
      poolMat.dispose();
    },
    [plateGeo, baseGeo, glass, smoked, coreMat, label, poolMat],
  );

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    scroll.bottleHover = true;
    document.documentElement.dataset.cursor = 'bottle';
  };
  const onOut = () => {
    scroll.bottleHover = false;
    delete document.documentElement.dataset.cursor;
  };

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const visible = stage.mode === 'hero' && !stage.fullscreen;
    g.visible = visible;
    if (!visible) return;

    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const { rotate, lift, explode: e, dive: d, intro } = stage;
    hover.current = damp(hover.current, scroll.bottleHover && d < 0.05 ? 1 : 0, 4, dt);
    tilt.current.x = damp(tilt.current.x, stage.py * (0.12 + hover.current * 0.18), 3, dt);
    tilt.current.y = damp(tilt.current.y, stage.px * (0.18 + hover.current * 0.35), 3, dt);

    // intro: rises from the dark
    const introE = 1 - Math.pow(1 - intro, 3);
    g.position.y = -0.35 - (1 - introE) * 1.6 + Math.sin(time * 0.6) * 0.04 * (1 - d);
    g.scale.setScalar(0.86 + introE * 0.14);

    // a full turn over the rotate phase, plus idle drift and pointer tilt
    const b = body.current!;
    b.rotation.y = rotate * Math.PI * 2 + Math.sin(time * 0.25) * 0.08 * (1 - rotate) + tilt.current.y;
    b.rotation.x = tilt.current.x - Math.sin(rotate * Math.PI) * 0.12;
    b.rotation.z = Math.sin(rotate * Math.PI) * 0.06;

    const breathe = hover.current * 0.06 * (0.6 + 0.4 * Math.sin(time * 2.2));
    const ex = e + breathe;
    const dd = easeInCubic(d);
    // exploded view: the plates fan out like a spiral staircase, then fly past the lens
    plates.current.forEach((p, i) => {
      if (!p) return;
      const k = i - (PLATES - 1) / 2;
      const fan = k * 0.4 * ex;
      const s1 = Math.sin(i * 2.3 + 0.7);
      const s2 = Math.cos(i * 1.7 + 0.2);
      const side = k < 0 ? -1 : 1;
      p.position.set(
        Math.sin(fan) * 1.1 * ex + side * dd * (3.4 + Math.abs(k) * 0.9),
        -BODY_H / 2 + PLATE_H * (i + 0.5) + k * 0.74 * ex + k * dd * 2.2,
        (Math.cos(fan) - 1) * 1.1 * ex + dd * (2.4 + (i % 3) * 0.8),
      );
      p.rotation.set(s2 * 0.07 * ex + dd * s2 * 0.9, fan + dd * k * 0.6, s1 * 0.05 * ex + dd * s1 * 0.7);
    });

    const bs = base.current!;
    bs.position.set(0, -BODY_H / 2 - BASE_H / 2 - ex * 1.3 - dd * 2.5, ex * 0.2);
    bs.rotation.set(ex * 0.18, -ex * 0.35, 0);

    // collar rises with the cap, then swings towards the lens — the camera flies through it
    const c = collar.current!;
    const ringT = clamp(d * 1.4);
    c.position.set(0, BODY_H / 2 + 0.07 + lift * 0.35 + ex * 1.15 - ringT * (BODY_H / 2 + 1.5), ringT * 3.2);
    c.rotation.set(ringT * Math.PI * 0.5, time * 0.2 * ex, 0);
    c.scale.setScalar(1 + ringT * ringT * 4.5);

    // cap: lifts, spins, drifts away into the dark
    const cp = cap.current!;
    const away = clamp((lift - 0.55) / 0.45);
    cp.position.set(
      away * away * 3.4 + ex * 0.6,
      BODY_H / 2 + 0.83 + lift * 1.25 + away * 1.4 + ex * 0.8,
      -away * 1.6,
    );
    cp.rotation.set(lift * 0.9 + time * 0.1 * away, lift * Math.PI * 1.5, -away * 0.5);
    cp.visible = dd < 0.95;

    // liquid core grows as we dive in
    const co = core.current!;
    co.scale.setScalar(1 + dd * 1.9);
    co.position.y = 0.05 * (1 - dd);
    portalUniforms.uRim.value = 1 - clamp(d * 1.6);

    if (pool.current) {
      pool.current.position.y = -BODY_H / 2 - BASE_H - 0.02 - ex * 1.3;
      (pool.current.material as THREE.ShaderMaterial).uniforms.uFade.value = introE * (1 - d) * (0.8 + hover.current * 0.6);
    }

    glass.attenuationColor.setRGB(0.92 + stage.tint[0] * 0.08, 0.86 + stage.tint[1] * 0.1, 0.78 + stage.tint[2] * 0.14);
  });

  return (
    <group ref={root}>
      <group ref={body} onPointerOver={onOver} onPointerOut={onOut}>
        {Array.from({ length: PLATES }, (_, i) => (
          <group key={i} ref={(el) => void (plates.current[i] = el)}>
            <mesh geometry={plateGeo} material={glass} />
            {i === 2 && (
              <mesh position={[0, 0.02, D / 2 + 0.004]}>
                <planeGeometry args={[1.3, 0.325]} />
                <meshStandardMaterial
                  map={label.tex}
                  transparent
                  metalness={0.6}
                  roughness={0.35}
                  emissive="#6b5436"
                  emissiveMap={label.tex}
                  emissiveIntensity={0.6}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        ))}
        <group ref={base}>
          <mesh geometry={baseGeo} material={smoked} />
        </group>
        <RoundedBox ref={core} args={[1.32, BODY_H - 0.46, 0.6]} radius={0.12} smoothness={4} material={coreMat} />
        <group ref={collar}>
          <mesh>
            <cylinderGeometry args={[0.34, 0.34, 0.14, 48, 1, true]} />
            <meshStandardMaterial color="#C9A87C" metalness={1} roughness={0.22} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
            <torusGeometry args={[0.34, 0.022, 16, 64]} />
            <meshStandardMaterial color="#e2c79c" metalness={1} roughness={0.15} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}>
            <torusGeometry args={[0.34, 0.022, 16, 64]} />
            <meshStandardMaterial color="#e2c79c" metalness={1} roughness={0.15} />
          </mesh>
        </group>
        <group ref={cap}>
          <mesh>
            <sphereGeometry args={[0.66, 64, 48]} />
            <meshPhysicalMaterial
              color="#0b0a09"
              metalness={0.35}
              roughness={0.12}
              clearcoat={1}
              clearcoatRoughness={0.04}
              iridescence={0.35}
              iridescenceIOR={1.6}
              envMapIntensity={1.6}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.665, 0.014, 12, 96]} />
            <meshStandardMaterial color="#C9A87C" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.64, 0]}>
            <cylinderGeometry args={[0.2, 0.26, 0.12, 32]} />
            <meshStandardMaterial color="#C9A87C" metalness={1} roughness={0.25} />
          </mesh>
        </group>
      </group>
      <mesh ref={pool} rotation={[-Math.PI / 2, 0, 0]} material={poolMat}>
        <planeGeometry args={[9, 9]} />
      </mesh>
    </group>
  );
}
