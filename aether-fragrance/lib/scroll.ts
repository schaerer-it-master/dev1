/**
 * Mutable, render-loop friendly scroll state. DOM ScrollTriggers write into it,
 * the WebGL scene reads (and damps) it every frame — no React re-renders involved.
 */
export const scroll = {
  /** 0..1 progress of the pinned hero story. */
  hero: 0,
  /** Per world chapter: 0..1 while the chapter slides in (drives the scene dissolve). */
  enter: [0, 0, 0],
  /** Per world chapter: 0..1 while the chapter is pinned (drives the world camera). */
  local: [0, 0, 0],
  /** 0..1 fade to black after the last world. */
  outro: 0,
  /** 0..1 as the notes section scrolls into view. */
  notesEnter: 0,
  /** 0..1 horizontal progress through the notes track. */
  notes: 0,
  /** False once the opaque story section covers the canvas — rendering pauses. */
  canvasVisible: true,
  /** Normalised pointer (-1..1). */
  pointer: { x: 0, y: 0 },
  /** Lenis velocity (px/frame), used for motion-reactive effects. */
  velocity: 0,
  /** Pointer is over the bottle (set by the 3D raycaster). */
  bottleHover: false,
};

export type ScrollState = typeof scroll;
