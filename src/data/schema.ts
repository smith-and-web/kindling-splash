/*
 * Structured data (JSON-LD), built in one place.
 *
 * Each page used to carry its own hand-copied SoftwareApplication, and the
 * copies drifted: some had a screenshot, one a featureList, all of them used
 * the generic social card as the "screenshot", and blog posts named a
 * favicon.svg as the publisher logo. Pages now pass only what is theirs (a
 * description, a feature list) and get the rest from here.
 *
 * Nodes carry stable @ids so a page's graph can reference the organisation
 * and site. Google reads @id references within a page only, so every
 * reference also carries the name and URL it needs on its own.
 *
 * `test:launch` parses the JSON-LD on every built page and checks the shapes
 * below. No rich result is promised: SoftwareApplication results need genuine
 * ratings, which the site does not have, and FAQ results are restricted.
 */
import { APP_VERSION } from './downloads';
import productScreenshot from '../assets/beat-with-prose.png';

export const SITE = 'https://kindlingwriter.com';
const ORG_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;
const APP_ID = `${SITE}/#software`;

type Node = Record<string, unknown>;

const absolute = (path: string) => new URL(path, SITE).href;

/** A self-sufficient reference to the organisation, for author/publisher. */
export const organizationRef: Node = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'kindling',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: absolute('/icon-512.png'), width: 512, height: 512 },
};

/** The full organisation node. On the home page, where Google looks for it. */
export const organization = (): Node => ({
  ...organizationRef,
  alternateName: 'Kindling Writer',
  description: 'kindling makes free, open-source (MIT) desktop writing software for fiction writers who outline.',
  sameAs: ['https://github.com/smith-and-web/kindling'],
});

export const website = (): Node => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: 'kindling',
  alternateName: 'Kindling Writer',
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
});

/** The app. A page supplies its own description (and optional feature list). */
export const softwareApplication = ({ description, featureList }: { description: string; featureList?: string[] }): Node => ({
  '@type': 'SoftwareApplication',
  '@id': APP_ID,
  name: 'kindling Writer',
  description,
  url: `${SITE}/`,
  applicationCategory: 'DesktopApplication',
  operatingSystem: 'Windows, macOS, Linux',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  softwareVersion: APP_VERSION,
  license: 'https://opensource.org/licenses/MIT',
  downloadUrl: `${SITE}/download/`,
  screenshot: {
    '@type': 'ImageObject',
    url: absolute(productScreenshot.src),
    width: productScreenshot.width,
    height: productScreenshot.height,
    caption: 'The kindling editor: a scene\'s beats beside its prose',
  },
  author: organizationRef,
  publisher: organizationRef,
  ...(featureList ? { featureList } : {}),
});

/** Home › … › page. Each crumb is [name, path]; the last is the page itself. */
export const breadcrumb = (crumbs: [string, string][]): Node => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: absolute(path),
  })),
});

/** One JSON-LD document for a page's nodes. */
export const graph = (...nodes: Node[]): Node => ({ '@context': 'https://schema.org', '@graph': nodes });

export { absolute as absoluteUrl };
