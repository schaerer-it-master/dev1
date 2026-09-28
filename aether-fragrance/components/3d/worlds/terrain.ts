import * as THREE from 'three';

/**
 * Bakes a height field into a plane on the CPU (terrain is static, so the GPU only
 * shades it). Returns the geometry plus the height function for camera collision.
 */
export function bakeTerrain(
  size: number,
  segments: number,
  height: (x: number, z: number) => number,
  colorFn?: (x: number, z: number, h: number, out: THREE.Color) => void,
) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = colorFn ? new Float32Array(pos.count * 3) : null;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = height(x, z);
    pos.setY(i, h);
    if (colors && colorFn) {
      colorFn(x, z, h, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
  }
  if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Shared sky-dome vertex shader: passes the view direction, dome follows the camera. */
export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`;
