#!/usr/bin/env node
/**
 * Give every product screenshot under public/docs/ its display size.
 *
 *   node scripts/size-docs-images.mjs          # rewrite the Markdown in place
 *   node scripts/size-docs-images.mjs --check  # exit 1 if anything is stale
 *
 * The captures are 2x PNGs. A Markdown `![alt](/docs/x.png)` renders at its
 * full pixel width, capped only by the column, so a small capture shows the
 * interface at double size — a 256pt sidebar became a 512px, 1446px-tall
 * figure. Each reference is written as an <img> whose width and height are
 * half the PNG's pixel dimensions, which is the size the interface actually
 * had on screen. Re-run after `npm run shots` or a new crop: the attributes
 * are derived from the files, never typed by hand.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src/content/docs', 'src/content/blog'];
const CHECK = process.argv.includes('--check');

/** PNG width and height from the IHDR chunk. */
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

function displaySize(src) {
  const file = path.join(REPO, 'public', src);
  if (!fs.existsSync(file)) throw new Error(`missing image ${src}`);
  const [w, h] = pngSize(file);
  return [Math.round(w / 2), Math.round(h / 2)];
}

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function rewrite(text) {
  // Markdown image syntax → a sized <img>.
  text = text.replace(/!\[([^\]]*)\]\((\/docs\/[^)\s]+\.png)\)/g, (_, alt, src) => {
    const [w, h] = displaySize(src);
    return `<img src="${src}" alt="${escapeAttr(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async" />`;
  });
  // Existing <img> tags: refresh width and height from the file.
  text = text.replace(/<img\b[^>]*\bsrc="(\/docs\/[^"]+\.png)"[^>]*>/g, (tag, src) => {
    const [w, h] = displaySize(src);
    return tag.replace(/\bwidth="\d+"/, `width="${w}"`).replace(/\bheight="\d+"/, `height="${h}"`);
  });
  return text;
}

const files = DIRS.flatMap((d) =>
  execFileSync('find', [path.join(REPO, d), '-name', '*.md', '-o', '-name', '*.mdx'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
);

let stale = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = rewrite(before);
  if (after === before) continue;
  stale++;
  const rel = path.relative(REPO, f);
  if (CHECK) console.error(`stale screenshot sizes: ${rel}`);
  else {
    fs.writeFileSync(f, after);
    console.log(`sized  ${rel}`);
  }
}
if (CHECK && stale) process.exit(1);
