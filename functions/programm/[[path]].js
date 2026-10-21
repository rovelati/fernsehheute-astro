/**
 * CF Pages Function — /programm/*
 *
 * Redirect permanently (301 Moved Permanently) from deprecated program-detail pages
 * (/programm/:channelSlug/:programSlug) to the live channel schedule page (/:channelSlug/).
 * This transfers SEO equity to channel hubs and resolves Google Search Console
 * "404 Not Found" and "Excluded by 'noindex' tag" warnings.
 */
import { normCid } from '../_normChannel.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);

  // parts[0] === 'programm'
  const rawChannel = parts[1];

  let targetUrl = `${url.origin}/`;

  if (rawChannel) {
    const channelSlug = normCid(rawChannel);
    if (channelSlug) {
      targetUrl = `${url.origin}/${channelSlug}/`;
    }
  }

  return Response.redirect(targetUrl, 301);
}
