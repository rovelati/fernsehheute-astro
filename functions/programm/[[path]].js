/**
 * CF Pages Function — /programm/*
 *
 * Redirect permanently (301) from deprecated program-detail pages
 * (/programm/:channelSlug/:programSlug) to the live channel schedule page (/:channelSlug/)
 * IF the channel exists.
 * IF the channel is dead or nonexistent, return 410 Gone immediately to purge from Google index
 * and save crawl budget.
 */
import { normCid, CHANNEL_SLUGS } from '../_normChannel.js';
import { VALID_CHANNELS } from '../_validChannels.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);

  // parts[0] === 'programm'
  const rawChannel = parts[1];

  if (rawChannel) {
    const channelSlug = normCid(rawChannel);
    if (channelSlug && (VALID_CHANNELS.has(channelSlug) || CHANNEL_SLUGS[channelSlug])) {
      const canonicalSlug = CHANNEL_SLUGS[channelSlug] || channelSlug;
      return Response.redirect(`${url.origin}/${canonicalSlug}/`, 301);
    }
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
