// Rewrites absolute /_next/ URLs in the static export (./out) to relative ones,
// so the site works when served from a sub-path (e.g. an artifact host or a CDN folder).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('out');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));

let changed = 0;
for (const file of walk(root)) {
  const ext = path.extname(file);
  if (!['.html', '.js', '.css', '.txt'].includes(ext)) continue;
  const src = fs.readFileSync(file, 'utf8');
  let out = src;
  if (ext === '.css') {
    // css lives in _next/static/css → media is one level up
    out = out.replaceAll('/_next/static/media/', '../media/');
  } else if (ext === '.js') {
    // webpack public path + any hard-coded asset URLs
    out = out.replaceAll('"/_next/', '"./_next/');
  } else {
    out = out.replace(/(["'(=])\/_next\//g, '$1./_next/');
  }
  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
  }
}
console.log(`relativized ${changed} files`);
