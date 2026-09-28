'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { NOISE } from '@/lib/glsl';
import ThunderWorld from './worlds/ThunderWorld';
import AuroraWorld from './worlds/AuroraWorld';
import EmberSeaWorld from './worlds/EmberSeaWorld';

/**
 * The worlds live in their own scenes and are rendered into off-screen targets.
 * Anything using the portal material samples them in *screen space* — so the liquid
 * inside the bottle behaves like a window into another sky, and once the camera is
 * inside the liquid, the window becomes the whole screen.
 */
export const portalUniforms = {
  uFrom: { value: null as THREE.Texture | null },
  uTo: { value: null as THREE.Texture | null },
  uMix: { value: 1 },
  uTime: { value: 0 },
  uFade: { value: 1 },
  uTint: { value: new THREE.Color(0.55, 0.48, 0.38) },
  uRim: { value: 1 },
  uGold: { value: new THREE.Color('#C9A87C') },
};

const PORTAL_COMMON = /* glsl */ `
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uMix;
uniform float uTime;
uniform float uFade;
uniform vec3 uGold;
${NOISE}
vec3 portalColor(vec2 uv) {
  // noise field + diagonal sweep → the next world burns in from the lower left
  float n = fbm(uv * vec2(4.5, 3.2) + vec2(uTime * 0.03, -uTime * 0.02));
  float sweep = uv.x * 0.55 + (1.0 - uv.y) * 0.45;
  float field = n * 0.55 + sweep * 0.45;
  float m = mix(-0.08, 1.08, uMix);
  float k = smoothstep(m - 0.018, m + 0.018, field);
  float band = 1.0 - smoothstep(0.0, 0.035, abs(field - m));
  vec2 warp = (vec2(fbm3o(uv * 9.0 + uTime * 0.3), fbm3o(uv * 9.0 - uTime * 0.3)) - 0.5) * band * 0.035;
  vec3 a = texture2D(uFrom, uv + warp).rgb;
  vec3 b = texture2D(uTo, uv + warp).rgb;
  vec3 col = mix(b, a, k);
  col += uGold * band * band * 0.9 + vec3(1.0, 0.8, 0.55) * pow(band, 14.0) * 1.1;
  return col * uFade;
}
`;

export const portalVolumeMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: portalUniforms,
    vertexShader: /* glsl */ `
      varying vec4 vClip;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vClip = projectionMatrix * viewMatrix * wp;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = vClip;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint;
      uniform float uRim;
      varying vec4 vClip;
      varying vec3 vN;
      varying vec3 vV;
      ${PORTAL_COMMON}
      void main() {
        vec2 uv = vClip.xy / vClip.w * 0.5 + 0.5;
        vec3 w = portalColor(uv) * (1.0 + 0.8 * uRim);
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        vec3 col = w * mix(vec3(1.0), 0.65 + uTint * 0.8, 0.45 * uRim);
        col += uTint * f * 1.3 * uRim + uGold * pow(f, 6.0) * 2.6 * uRim;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });

const fullscreenMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: portalUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      ${PORTAL_COMMON}
      void main() {
        gl_FragColor = vec4(portalColor(vUv), 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

export default function WorldPortal() {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const scenes = useMemo(() => [new THREE.Scene(), new THREE.Scene(), new THREE.Scene()], []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(55, 1, 0.5, 2600), []);
  const targets = useMemo(
    () =>
      [0, 1].map(
        () =>
          new THREE.WebGLRenderTarget(2, 2, {
            type: THREE.HalfFloatType,
            depthBuffer: true,
            samples: stage.low ? 0 : 4,
          }),
      ),
    [],
  );
  const quadMat = useMemo(fullscreenMaterial, []);
  const quad = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const scale = stage.low ? 0.55 : 0.8;
    const dpr = Math.min(gl.getPixelRatio(), 1.5);
    const w = Math.max(2, Math.floor(size.width * dpr * scale));
    const h = Math.max(2, Math.floor(size.height * dpr * scale));
    targets.forEach((t) => t.setSize(w, h));
    camera.aspect = size.width / size.height;
    camera.fov = size.width / size.height < 1 ? 70 : 55;
    camera.updateProjectionMatrix();
  }, [gl, size, targets, camera]);

  // compile the three worlds behind the preloader
  useEffect(() => {
    const id = setTimeout(() => {
      const prev = gl.getRenderTarget();
      gl.setRenderTarget(targets[0]);
      scenes.forEach((sc, i) => {
        stage.rigs[i]?.(camera, 0, 0);
        gl.compileAsync(sc, camera).catch(() => {});
      });
      gl.setRenderTarget(prev);
    }, 500);
    return () => clearTimeout(id);
  }, [gl, scenes, camera, targets]);

  useEffect(
    () => () => {
      targets.forEach((t) => t.dispose());
      quadMat.dispose();
    },
    [targets, quadMat],
  );

  useFrame((state) => {
    if (quad.current) quad.current.visible = stage.fullscreen && stage.mode === 'worlds';
    portalUniforms.uTime.value = state.clock.elapsedTime;
    if (stage.mode === 'essence' || stage.mode === 'off') return;

    const time = state.clock.elapsedTime;
    const previous = gl.getRenderTarget();
    const draw = (i: number, target: THREE.WebGLRenderTarget) => {
      const rig = stage.rigs[i];
      if (rig) rig(camera, stage.worldT[i], time);
      gl.setRenderTarget(target);
      gl.clear(true, true, false);
      gl.render(scenes[i], camera);
    };
    const blending = stage.mix < 0.999 && stage.from !== stage.to;
    draw(stage.to, targets[1]);
    if (blending) draw(stage.from, targets[0]);
    gl.setRenderTarget(previous);

    portalUniforms.uTo.value = targets[1].texture;
    portalUniforms.uFrom.value = blending ? targets[0].texture : targets[1].texture;
    portalUniforms.uMix.value = blending ? stage.mix : 1;
    portalUniforms.uFade.value = stage.fade;
  }, -1);

  return (
    <>
      {createPortal(<ThunderWorld scene={scenes[0]} index={0} />, scenes[0], { camera })}
      {createPortal(<AuroraWorld scene={scenes[1]} index={1} />, scenes[1], { camera })}
      {createPortal(<EmberSeaWorld scene={scenes[2]} index={2} />, scenes[2], { camera })}
      <mesh ref={quad} material={quadMat} frustumCulled={false} renderOrder={-100} visible={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}
