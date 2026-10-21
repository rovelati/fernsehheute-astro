/**
 * CF Pages Function — /heute-abend/*
 *
 * Redirect permanently (301) legacy /heute-abend/:channel URLs to /:channel/
 * and /heute-abend to / (Homepage).
 * Resolves 15k+ 404 errors in Google Search Console.
 */
import { normCid } from '../_normChannel.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);

  // parts[0] === 'heute-abend'
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
