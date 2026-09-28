/** Small deterministic CPU noise for baking terrain heights once at startup. */

function hash(x: number, y: number, seed: number) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

export function valueNoise(x: number, y: number, seed = 1) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm2(x: number, y: number, octaves = 5, seed = 1) {
  let sum = 0;
  let amp = 0.5;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(fx, fy, seed + i * 17);
    const nx = 0.8 * fx - 0.6 * fy;
    const ny = 0.6 * fx + 0.8 * fy;
    fx = nx * 2.02 + 5.3;
    fy = ny * 2.02 + 1.7;
    amp *= 0.5;
  }
  return sum;
}

/** Seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
