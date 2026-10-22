/*
 * The date a file was last committed, shared by the sitemap <lastmod>
 * (astro.config.mjs) and the visible "Updated" line and `dateModified` on the
 * pages that carry the facts table. One mechanism, so the sitemap, the page and
 * the structured data cannot disagree.
 *
 * It needs full history in CI: a shallow checkout would give every file the
 * deploy date. See `fetch-depth: 0` in `.github/workflows/deploy.yml`.
 */
import { execFileSync } from 'node:child_process';

/** Strict ISO 8601 committer date of the last commit touching `file`, or undefined. */
export function lastCommitDate(file) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Calendar date (YYYY-MM-DD) of the last commit touching `file`, as the committer wrote it. */
export function lastCommitDay(file) {
  return lastCommitDate(file)?.slice(0, 10);
}
