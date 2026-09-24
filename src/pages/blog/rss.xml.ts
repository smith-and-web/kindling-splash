import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

// The blog feed: a discovery path for feed readers, aggregators and crawlers,
// and a second fetch trigger for new posts. Linked from every marketing page's
// <head> (MarketingLayout). Titles and descriptions are the posts' own.
export async function GET(context: APIContext) {
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => new Date(b.data.publishedDate).getTime() - new Date(a.data.publishedDate).getTime());
  return rss({
    title: 'kindling Blog',
    description: 'News, updates, and writing tips from the kindling team: free, open-source writing software for writers who outline.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.publishedDate),
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en</language>',
  });
}
