/**
 * CF Pages Function — /heute-abend/*
 *
 * Redirect permanently (301) legacy /heute-abend/:channel URLs to /:channel/
 * and /heute-abend to / (Homepage).
 * Dead or invalid channel patterns return 410 Gone to clear Google Search Console 404s.
 */
import { normCid, CHANNEL_SLUGS } from '../_normChannel.js';
import { VALID_CHANNELS } from '../_validChannels.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);

  // parts[0] === 'heute-abend'
  const rawChannel = parts[1];

  if (!rawChannel) {
    // /heute-abend or /heute-abend/ -> 301 to Homepage
    return Response.redirect(`${url.origin}/`, 301);
  }

  const channelSlug = normCid(rawChannel);
  if (channelSlug && (VALID_CHANNELS.has(channelSlug) || CHANNEL_SLUGS[channelSlug])) {
    const canonicalSlug = CHANNEL_SLUGS[channelSlug] || channelSlug;
    return Response.redirect(`${url.origin}/${canonicalSlug}/`, 301);
  }

  // Dead pattern without equivalent -> 410 Gone
  return new Response('410 Gone - Dieser Inhalt oder Sender ist nicht mehr verfügbar.', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=604800',
    },
  });
}
