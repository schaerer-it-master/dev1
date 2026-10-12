# Aether — Parfums du Ciel

A cinematic, scroll-driven one-pager for the (fictional) fragrance house **Aether** and its three scents:
**No. 1 Thunder** (dry lightning over the desert), **No. 2 Aurora** (northern lights over snow) and
**No. 3 Ember Sea** (a burning sunset over the ocean).

Everything is real-time code: no video, no photography, no AI imagery.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Static, self-contained build (relative asset paths, deployable to any sub-path):

```bash
STATIC_EXPORT=1 npx next build   # → ./out
```

Append `?instant` to the URL to disable all damping and the preloader delay (used for automated screenshots).

## Deploy to Netlify

- **Drag & drop:** run `npm run export`, then drop the `out` folder (or a ZIP of its contents) onto https://app.netlify.com/drop.
- **From Git:** connect the repository, set *Base directory* to `aether-fragrance`. Build command and publish folder come from `netlify.toml` (`npm run export` → `out`).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger + SplitText · Lenis ·
Three.js + React Three Fiber + Drei · @react-three/postprocessing · Framer Motion (UI only) · Zustand

## The film, scene by scene

| Section | What happens |
| --- | --- |
| Preloader | Counter + wordmark while shaders compile, then the curtain splits. |
| Hero (460vh, sticky) | A glass flacon of seven stacked plates. Scrolling turns it a full revolution, lifts the obsidian cap away, fans the plates out like a spiral staircase and dives the camera through the gold collar into the liquid — which is a live window into the chosen world. Letterbox bars, a light flash and chromatic aberration mark the moment of entry. The switcher below the flacon dissolves between worlds (noise burn with a gold edge) and fires a particle burst; hovering a scent previews its tint. |
| Die Welten | Three pinned chapters over full-screen procedural worlds. Scroll drives each world's camera path and the dissolve to the next world. Names arrive letter by letter with overshoot, notes fly in from left/right/bottom, numerals, marquees and scrims run on separate parallax planes. |
| Anatomie (notes) | Horizontal, pinned ingredient gallery — three editorial card types with generative SVG motifs. A morphing liquid-metal essence in WebGL takes the colour of whichever ingredient is hovered. |
| Manifest / Atelier / Window | Word-by-word manifesto, atelier steps flying in from alternating sides with self-drawing line art, counters, and a pill-shaped window that opens into a full-bleed sky. WebGL is paused here. |
| Footer | Discovery set, newsletter, live Grasse clock and a monumental gold wordmark rising letter by letter. |

## Structure

```
app/                     layout, fonts, global styles (Tailwind v4 theme tokens, grain, vignette)
components/
  3d/
    Experience.tsx       Canvas, Director (scroll → choreography), lights, post-processing
    PerfumeBottle.tsx    the flacon: plates, liquid window, collar, cap, engraved label
    WorldPortal.tsx      renders the worlds off-screen + dissolve shader
    Wordmark3D.tsx       extruded Bodoni wordmark behind the glass
    Particles.tsx        gold dust (cursor-repelled) + switch burst
    Essence.tsx          liquid-metal blob for the notes section
    worlds/              ThunderWorld, AuroraWorld, EmberSeaWorld, terrain helpers
  sections/              Nav, Hero, Worlds, WorldChapter, Notes, Story, Footer
  ui/                    MagneticButton, Cursor, Preloader, BuildBanner, NoteMotif, ParallaxDust
  providers/             SmoothScroll (Lenis on the GSAP ticker)
lib/                     fragrance data, scroll + stage state, GLSL chunks, math, noise
public/fonts/            Bodoni Moda subset as three.js typeface JSON (built by scripts/ttf-to-typeface.mjs)
```

## Performance notes

- One WebGL context for the whole page; it pauses (`frameloop="never"`) once the opaque story section covers it.
- DOM ↔ WebGL communication goes through plain mutable objects (`lib/scroll.ts`, `lib/stage.ts`) — no React re-renders per frame.
- Worlds render at reduced resolution into half-float targets, only the one(s) on screen; terrain is baked once on the CPU.
- A quality tier (touch / small screen / ≤4 cores) drops DOF, MSAA and particle counts; `PerformanceMonitor` lowers the pixel ratio if frames drop.
- All shader programs are compiled behind the preloader.
