'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode, type ChromaticAberrationEffect, type DepthOfFieldEffect } from 'postprocessing';
import * as THREE from 'three';
import { canvasControl, stage } from '@/lib/stage';
import { scroll } from '@/lib/scroll';
import { useAether } from '@/lib/store';
import { FRAGRANCES } from '@/lib/fragrances';
import { clamp, damp, easeInOutCubic, lerp, range, smooth } from '@/lib/math';
import PerfumeBottle from './PerfumeBottle';
import WorldPortal, { portalUniforms } from './WorldPortal';
import Wordmark3D from './Wordmark3D';
import { Burst, Dust } from './Particles';
import Essence from './Essence';

const tmpColor = new THREE.Color();

/** Turns scroll + UI state into the per-frame choreography of the film. */
function Director() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const click = useRef({ from: 0, to: useAether.getState().active, mix: 1 });
  const lookY = useRef(0);

  useEffect(() => {
    canvasControl.setFrameloop = setFrameloop;
    return () => {
      canvasControl.setFrameloop = null;
    };
  }, [setFrameloop]);

  useFrame((state, delta) => {
    const dt = stage.instant ? 10 : Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    const { active, hovered, loaded } = useAether.getState();

    stage.px = damp(stage.px, scroll.pointer.x, 3.5, dt);
    stage.py = damp(stage.py, scroll.pointer.y, 3.5, dt);
    if (loaded) stage.intro = Math.min(1, stage.intro + dt / 2.6);

    // hero sub-phases
    stage.hero = damp(stage.hero, scroll.hero, 7, dt);
    const h = stage.hero;
    stage.rotate = easeInOutCubic(range(h, 0.03, 0.46));
    stage.lift = easeInOutCubic(range(h, 0.1, 0.42));
    stage.explode = easeInOutCubic(range(h, 0.32, 0.64));
    stage.dive = easeInOutCubic(range(h, 0.6, 0.955));
    const heroEnergy = scroll.bottleHover || hovered !== null ? 1 : 0;
    stage.energy = damp(stage.energy, heroEnergy, 3, dt);

    // fragrance switch → dissolve + burst
    const c = click.current;
    if (active !== c.to) {
      c.from = c.mix > 0.5 ? c.to : c.from;
      c.to = active;
      c.mix = 0;
      stage.burstAt = time;
    }
    c.mix = Math.min(1, c.mix + (stage.instant ? Math.min(delta, 0.05) : dt) / 1.6);

    let from = c.from;
    let to = c.to;
    let mix = easeInOutCubic(c.mix);

    // scroll-driven world chapters override the switcher
    let chapter = -1;
    for (let i = 2; i >= 0; i--) {
      if (scroll.enter[i] > 0) {
        chapter = i;
        break;
      }
    }
    stage.worldT[0] = stage.worldT[1] = stage.worldT[2] = 0;
    if (chapter >= 0) {
      const prev = chapter === 0 ? c.to : chapter - 1;
      if (scroll.enter[chapter] < 1 && prev !== chapter) {
        from = prev;
        to = chapter;
        mix = smooth(scroll.enter[chapter]);
        if (chapter > 0) stage.worldT[prev] = 1;
      } else {
        from = to = chapter;
        mix = 1;
      }
      stage.worldT[chapter] = scroll.local[chapter];
    }
    stage.from = from;
    stage.to = to;
    stage.mix = mix;
    stage.fullscreen = h > 0.955 || chapter >= 0;
    stage.fade = 1 - smooth(scroll.outro);

    const essence = scroll.notesEnter > 0 && scroll.outro > 0.999;
    stage.mode = !scroll.canvasVisible ? 'off' : essence ? 'essence' : stage.fullscreen ? 'worlds' : 'hero';
    stage.essence = stage.mode === 'essence' ? smooth(scroll.notesEnter) : 0;
    const live = stage.mode === 'hero' || stage.mode === 'worlds';
    stage.visible[0] = stage.visible[1] = stage.visible[2] = false;
    if (live) {
      stage.visible[to] = true;
      if (mix < 0.999) stage.visible[from] = true;
    }

    // liquid tint follows the hovered / active / on-screen fragrance
    const tintIndex = chapter >= 0 ? to : hovered ?? active;
    tmpColor.set(FRAGRANCES[tintIndex].colors.liquid);
    const k = 1 - Math.exp(-3 * dt);
    stage.tint[0] = lerp(stage.tint[0], tmpColor.r, k);
    stage.tint[1] = lerp(stage.tint[1], tmpColor.g, k);
    stage.tint[2] = lerp(stage.tint[2], tmpColor.b, k);
    portalUniforms.uTint.value.setRGB(stage.tint[0], stage.tint[1], stage.tint[2]);
    stage.yaw = stage.rotate * 0.25 - stage.px * 0.05;

    // camera
    const aspect = size.width / size.height;
    if (stage.mode === 'essence') {
      camera.fov = 32;
      camera.position.set(stage.px * 0.3, stage.py * 0.2, 7.5);
      camera.lookAt(0, 0, 0);
    } else {
      const fov = 30;
      const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
      // frame the flacon at ~2/3 of the viewport height, narrower screens fit by width
      const dist = Math.max(6.9 / 2 / tan, 4.8 / 2 / (tan * aspect));
      const r = stage.rotate;
      const e = stage.explode;
      const d = stage.dive;
      const orbit = Math.sin(r * Math.PI);
      const z = dist * (1 - 0.12 * r - 0.1 * e) * (1 - d);
      camera.position.set(
        orbit * 1.4 * (1 - d) + stage.px * 0.35 * (1 - d),
        0.1 + orbit * 0.35 + stage.py * 0.22 * (1 - d) - 0.15 * d,
        z,
      );
      // look slightly below the flacon so it sits above the switcher
      const lift = aspect < 1 ? 0.9 : 0.55;
      lookY.current = lerp(-lift * (1 - e * 0.5), -0.25, d);
      camera.lookAt(stage.px * 0.1, lookY.current, -4);
      camera.fov = fov + d * d * 42;
    }
    camera.updateProjectionMatrix();
  }, -2);

  return null;
}

function Effects() {
  const dof = useRef<DepthOfFieldEffect>(null);
  const ca = useRef<ChromaticAberrationEffect>(null);
  const low = stage.low;
  const focus = useMemo(() => new THREE.Vector3(0, -0.35, 0), []);
  const offset = useMemo(() => new THREE.Vector2(0.0005, 0.0005), []);

  useFrame(() => {
    const d = stage.dive;
    if (dof.current) {
      dof.current.target = focus;
      const hero = stage.mode === 'hero';
      dof.current.bokehScale = hero ? lerp(5.5, 0, clamp(d * 1.4)) : stage.mode === 'essence' ? 3 : 0;
      focus.set(stage.mode === 'essence' ? 1.2 : 0, stage.mode === 'essence' ? 0 : -0.35, 0);
    }
    if (ca.current) {
      const kick = Math.sin(clamp(d) * Math.PI) * 0.006 + Math.min(Math.abs(scroll.velocity) * 0.00012, 0.002);
      offset.set(0.0004 + kick, 0.0004 + kick * 0.6);
      ca.current.offset = offset;
    }
  });

  return (
    <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType}>
      {!low && <DepthOfField ref={dof} target={focus} focusRange={2.4} bokehScale={5} />}
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.78} />
      <ChromaticAberration ref={ca} offset={offset} radialModulation modulationOffset={0.25} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

function Lights() {
  const rim = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (!rim.current) return;
    rim.current.color.setRGB(stage.tint[0] * 1.2, stage.tint[1] * 1.2, stage.tint[2] * 1.2);
    rim.current.intensity = (1.2 + stage.energy * 2.5) * stage.intro;
  });
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} color="#fff1dd" />
      <directionalLight ref={rim} position={[-2, 2, -6]} intensity={1.2} />
      <spotLight position={[0, 9, 2]} angle={0.35} penumbra={1} intensity={60} color="#ffe6c2" decay={1.6} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[9, 3, 1]} />
        <Lightformer form="rect" intensity={5} color="#fff4e2" position={[-5, 1, 1.5]} rotation-y={Math.PI / 2} scale={[0.4, 8, 1]} />
        <Lightformer form="rect" intensity={5} color="#fff4e2" position={[5, 1, 1.5]} rotation-y={-Math.PI / 2} scale={[0.4, 8, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#C9A87C" position={[0, -3, 5]} scale={[12, 0.6, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#C9A87C" position={[3.5, 3, -6]} scale={2.5} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, 1, 7]} scale={[3, 1.2, 1]} />
      </Environment>
    </>
  );
}

/** Compile every program up-front (behind the preloader) so no scene change hitches later. */
function Precompile() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const id = setTimeout(() => {
      // the composer renders into an off-screen target, so compile that program variant
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
      const prev = gl.getRenderTarget();
      gl.setRenderTarget(rt);
      const done = gl.compileAsync(scene, camera);
      gl.setRenderTarget(prev);
      done.catch(() => {}).finally(() => rt.dispose());
    }, 300);
    return () => clearTimeout(id);
  }, [gl, scene, camera]);
  return null;
}

export default function Experience({ displayFont }: { displayFont: string }) {
  const low = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const cores = navigator.hardwareConcurrency || 4;
    return coarse || small || cores <= 4;
  }, []);
  stage.low = low;
  const max = low ? 1.3 : 1.75;
  const [dpr, setDpr] = useState(max);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.05, far: 120, position: [0, 0.2, 11] }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
        gl.setClearColor('#0A0A0A');
      }}
    >
      <color attach="background" args={['#0A0A0A']} />
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(max, d + 0.25))}
        flipflops={4}
      />
      <Precompile />
      <Director />
      <Lights />
      <WorldPortal />
      <Wordmark3D />
      <PerfumeBottle displayFont={displayFont} />
      <Dust />
      <Burst />
      <Essence />
      <Effects />
    </Canvas>
  );
}
