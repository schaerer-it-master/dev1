// Converts a TTF into a three.js typeface JSON (subset), mirroring three's TTFLoader.
// Usage: node scripts/ttf-to-typeface.mjs <in.ttf> <out.json> [chars]
import fs from 'node:fs';
import opentype from 'opentype.js';

const [, , input, output, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .'] = process.argv;
const buf = fs.readFileSync(input);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const round = Math.round;
const scale = 100000 / ((font.unitsPerEm || 2048) * 72);
const glyphs = {};

for (const ch of chars) {
  const glyph = font.charToGlyph(ch);
  const token = {
    ha: round(glyph.advanceWidth * scale),
    x_min: round((glyph.xMin ?? 0) * scale),
    x_max: round((glyph.xMax ?? 0) * scale),
    o: '',
  };
  for (const c of glyph.path.commands) {
    const type = c.type.toLowerCase() === 'c' ? 'b' : c.type.toLowerCase();
    token.o += type + ' ';
    if (c.x !== undefined) token.o += round(c.x * scale) + ' ' + round(c.y * scale) + ' ';
    if (c.x1 !== undefined) token.o += round(c.x1 * scale) + ' ' + round(c.y1 * scale) + ' ';
    if (c.x2 !== undefined) token.o += round(c.x2 * scale) + ' ' + round(c.y2 * scale) + ' ';
  }
  glyphs[ch] = token;
}

fs.writeFileSync(
  output,
  JSON.stringify({
    glyphs,
    familyName: font.getEnglishName('fullName'),
    ascender: round(font.ascender * scale),
    descender: round(font.descender * scale),
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: {
      xMin: font.tables.head.xMin,
      xMax: font.tables.head.xMax,
      yMin: font.tables.head.yMin,
      yMax: font.tables.head.yMax,
    },
    resolution: 1000,
  }),
);
console.log('wrote', output, Object.keys(glyphs).length, 'glyphs');
