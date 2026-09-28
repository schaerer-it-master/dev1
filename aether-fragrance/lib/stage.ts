import type * as THREE from 'three';

export type StageMode = 'hero' | 'worlds' | 'essence' | 'off';

export type WorldRig = (camera: THREE.PerspectiveCamera, t: number, time: number) => void;

/**
 * Runtime state of the WebGL "film". Written by the Director once per frame,
 * read by every 3D component. Plain object on purpose — zero React churn.
 */
export const stage = {
  mode: 'hero' as StageMode,
  /** Damped hero progress 0..1. */
  hero: 0,
  /** Sub-phases of the hero story, each 0..1. */
  rotate: 0,
  lift: 0,
  explode: 0,
  dive: 0,
  /** World dissolve: render `from` and `to`, blend by `mix`. */
  from: 0,
  to: 0,
  mix: 1,
  /** 0 → black, 1 → full brightness (outro fade). */
  fade: 1,
  /** True once the camera is inside the bottle — the world is drawn as a fullscreen layer. */
  fullscreen: false,
  /** Per world camera-path progress. */
  worldT: [0, 0, 0],
  /** Which worlds must be rendered this frame. */
  visible: [true, false, false],
  /** Camera rig per world, registered by the world components. */
  rigs: [null, null, null] as (WorldRig | null)[],
  /** Liquid tint currently shown (lerped towards active / hovered fragrance). */
  tint: [0.55, 0.48, 0.38] as [number, number, number],
  /** 0..1 intro reveal after the preloader. */
  intro: 0,
  /** Seconds (clock time) of the last fragrance switch — drives the particle burst. */
  burstAt: -100,
  /** 0..1 visibility of the essence blob (notes section). */
  essence: 0,
  /** Coupling between the bottle's turn and the look direction inside the world. */
  yaw: 0,
  /** Damped pointer. */
  px: 0,
  py: 0,
  /** Pointer hover energy on the bottle / buttons (0..1). */
  energy: 0,
  /** Rendering quality tier chosen at startup. */
  low: false,
  /** `?instant` — skip all damping (used for automated screenshots). */
  instant: typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('instant'),
};

/** Lets DOM scroll triggers pause / resume the WebGL render loop. */
export const canvasControl: { setFrameloop: ((v: 'always' | 'never') => void) | null } = { setFrameloop: null };
