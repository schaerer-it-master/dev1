import { create } from 'zustand';

type AetherState = {
  /** Fragrance selected in the hero switcher (0 Thunder, 1 Aurora, 2 Ember Sea). */
  active: number;
  /** Fragrance button currently hovered (previews the world inside the bottle). */
  hovered: number | null;
  /** Increments on every switch — used to fire particle bursts. */
  switchId: number;
  /** Colour of the ingredient hovered in the Notes section (drives the essence blob). */
  noteColor: string | null;
  loaded: boolean;
  setActive: (i: number) => void;
  setHovered: (i: number | null) => void;
  setNoteColor: (c: string | null) => void;
  setLoaded: (v: boolean) => void;
};

export const useAether = create<AetherState>((set, get) => ({
  active: 0,
  hovered: null,
  switchId: 0,
  noteColor: null,
  loaded: false,
  setActive: (i) => {
    if (get().active === i) return;
    set({ active: i, switchId: get().switchId + 1 });
  },
  setHovered: (i) => set({ hovered: i }),
  setNoteColor: (c) => set({ noteColor: c }),
  setLoaded: (v) => set({ loaded: v }),
}));
