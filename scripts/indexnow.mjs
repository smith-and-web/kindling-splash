// Work out which URLs a deploy changes, for IndexNow (Bing, and the search
// engines that share its index). Runs in CI after the build and before the
// deploy, so the live site is still the previous release: a sitemap entry that
// is new, or whose <lastmod> moved, is a page this deploy changes. The llms
// files carry no lastmod and are compared by content.
//
// Writes `urls=<JSON array>` and `key=<key>` to $GITHUB_OUTPUT; the deploy job
// submits them once the new site is live. The key is public by design: IndexNow
// verifies ownership by fetching it from the site root. Its one source is the
// key file, public/<key>.txt, named for and containing the key.
import { readFile, appendFile, readdir } from 'node:fs/promises';

const SITE = 'https://kindlingwriter.com';

const entries = (xml) => new Map(
  [...xml.matchAll(/<url>(.*?)<\/url>/g)].map(([, body]) => [
    body.match(/<loc>([^<]+)<\/loc>/)?.[1],
    body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? '',
  ]),
);

async function live(pathname) {
  try {
    const response = await fetch(SITE + pathname);
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

const built = entries(await readFile('dist/sitemap-0.xml', 'utf8'));
const previous = entries(await live('/sitemap-0.xml'));
const changed = [...built].filter(([loc, lastmod]) => previous.get(loc) !== lastmod).map(([loc]) => loc);

for (const file of ['/llms.txt', '/llms-full.txt']) {
  if ((await readFile(`dist${file}`, 'utf8')) !== (await live(file))) changed.push(SITE + file);
}

console.log(changed.length ? `IndexNow: ${changed.length} changed URL(s)\n${changed.join('\n')}` : 'IndexNow: nothing changed');
const keys = (await readdir('public')).map((name) => name.match(/^([0-9a-f]{32})\.txt$/)?.[1]).filter(Boolean);
if (keys.length !== 1) throw new Error(`Expected one IndexNow key file in public/, found ${keys.length}`);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `urls=${JSON.stringify(changed)}\nkey=${keys[0]}\n`);
