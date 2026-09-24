import type { APIRoute } from 'astro';
import { llmsFullTxt } from '../data/llms';

// Built from the site's collections and download data; see src/data/llms.ts.
export const GET: APIRoute = async () =>
  new Response(await llmsFullTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
