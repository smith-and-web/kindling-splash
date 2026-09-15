/* Verify the vendored Press snapshot against its recorded content hashes.
 *
 *   node scripts/check-design-system.mjs          verify (read-only)
 *   node scripts/check-design-system.mjs --write  regenerate the manifest
 *
 * Verification needs nothing but this repository — no ../press checkout, no
 * network — so CI can prove the committed copies are the ones that were synced.
 * `--write` is only reachable from scripts/sync-design-system.sh, which has
 * already refreshed the files from ../press.
 *
 * A Press version label, or even a commit, does not identify a snapshot taken
 * from a dirty working tree. When the source tree is dirty the manifest says so
 * and the hashes are the only identity the snapshot has.
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, relative, join } from 'node:path';
import { globSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '../press');
const manifestPath = resolve(root, 'src/vendor/press/MANIFEST.json');
const write = process.argv.includes('--write');

/* dest glob -> the directory in ../press it was copied from. Ordered as the
   sync script copies them. */
const MAPPINGS = [
  ['src/vendor/press/design-system/*', 'design-system'],
  ['src/vendor/press/assets/fonts/web/*', 'assets/fonts/web'],
  ['src/vendor/press/assets/svg/*', 'assets/svg'],
  ['src/vendor/press/licenses/*/*', 'licenses'],
  ['public/brand/*.svg', 'assets/svg'],
  ['public/favicon.svg', 'assets/favicon'],
  ['public/favicon-16.png', 'assets/favicon'],
  ['public/favicon-32.png', 'assets/favicon'],
  ['public/favicon.ico', 'assets/favicon'],
  ['public/apple-touch-icon.png', 'assets/favicon'],
  ['public/icon-192.png', 'assets/favicon'],
  ['public/icon-512.png', 'assets/favicon'],
  ['public/site.webmanifest', 'assets/favicon'],
  ['public/og-image.png', 'assets/social'],
  ['press/DESIGN.md', '.'],
  ['press/docs/*.md', 'docs'],
];

const EXCLUSIONS = {
  'reference/, ui_kits/, preview/, index.html, components.html': 'QA and catalog surfaces; 31MB of baseline images no CSS consumer reads. This is why the packed tarball is not installed — see scripts/sync-design-system.sh.',
  'design-system/svelte/': 'Application Svelte components. The only island here is SmartDownloadButton, which needs platform detection rather than a shared control.',
  'design-system/fonts.css and assets/fonts/*.ttf': 'Serve the canonical variable TTFs (~3.1MB) for an application that bundles its assets. The site takes design-system/fonts-web.css and assets/fonts/web/ instead, which Press encodes from those same files losslessly.',
  'assets/png/, assets/social/avatar-*': 'Print and social-profile exports with no route on this site.',
  'assets/source/, assets/app-icons/, assets/build_*.py': 'Artwork sources and their build steps; Press regenerates the exports.',
  'docs/ beyond the seven copied': 'BASELINE_*, PROVENANCE, OPEN_DESIGN, CONSOLIDATION_* and the adoption brief are Press maintenance records. press/DESIGN.md links to them by name; read them in ../press.',
};

const files = [];
for (const [pattern, from] of MAPPINGS) {
  const matches = globSync(pattern, { cwd: root }).sort();
  if (!matches.length) throw new Error(`No vendored file matched "${pattern}". Run npm run sync:design-system.`);
  for (const path of matches) {
    const bytes = await readFile(resolve(root, path));
    files.push({
      path,
      from: join('../press', from === '.' ? '' : from, path.split('/').pop()),
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
}

if (write) {
  const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
  let version = 'unknown', commit = 'unknown', dirty = true;
  try {
    version = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8')).version;
    commit = git('rev-parse', 'HEAD');
    dirty = git('status', '--porcelain').length > 0;
  } catch { /* recorded as unknown */ }
  await writeFile(manifestPath, JSON.stringify({
    package: '@kindling/design-system',
    version,
    commit,
    snapshot: dirty ? 'working-tree' : 'commit',
    note: dirty
      ? `Taken from a dirty ../press working tree at ${commit}. The version and commit do NOT identify these bytes; the sha256 values below are the only identity this snapshot has. Re-sync from a committed release before shipping a rollback-able build.`
      : `Taken from ../press at ${commit} with a clean working tree.`,
    syncedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    generator: 'scripts/sync-design-system.sh -> scripts/check-design-system.mjs --write',
    verify: 'npm run check:design-system',
    exclusions: EXCLUSIONS,
    files,
  }, null, 2) + '\n');
  console.log(`recorded ${files.length} files from @kindling/design-system ${version} @ ${commit}${dirty ? ' (working tree dirty)' : ''}`);
} else {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => {
    throw new Error('src/vendor/press/MANIFEST.json is missing. Run npm run sync:design-system.');
  }));
  const recorded = new Map(manifest.files.map((file) => [file.path, file]));
  const problems = [];
  for (const file of files) {
    const expected = recorded.get(file.path);
    if (!expected) problems.push(`${file.path}: present but not recorded in the manifest`);
    else if (expected.sha256 !== file.sha256) problems.push(`${file.path}: modified since sync (hand-edited mirror?)`);
    recorded.delete(file.path);
  }
  for (const path of recorded.keys()) {
    await stat(resolve(root, path)).catch(() => problems.push(`${path}: recorded in the manifest but missing`));
  }
  if (problems.length) {
    console.error(`Vendored Press copies do not match src/vendor/press/MANIFEST.json:\n  ${problems.join('\n  ')}\n\nThese are read-only copies. Make the change in ../press and run npm run sync:design-system.`);
    process.exit(1);
  }
  console.log(`${files.length} vendored files match @kindling/design-system ${manifest.version} @ ${manifest.commit} (${manifest.snapshot} snapshot).`);
}
