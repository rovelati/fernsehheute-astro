/**
 * adsense.ts — FernsehHeute.de AdSense Konstanten
 * Zentralisierte Slot-IDs und Publisher-ID.
 */

export const ADSENSE_CLIENT_ID = 'ca-pub-2168172914069272';

export const ADSENSE_SLOTS = {
  IN_FEED_SENDERLISTE: '3881971380', // FH_InFeed_Senderliste (nach den Top-8-Sendern / Filmen)
  SENDER_MID_CONTENT:  '4452817027', // FH_Sender_MidContent (Sender-Detailseite nach Prime Time & Overlay)
  CONTENT_FOOTER_FAQ:  '1255808043', // FH_Content_Footer_FAQ (vor FAQ / Seitenende)
} as const;
