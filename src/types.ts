export interface Program {
  id: string;
  title: string;
  start_time: string;  // ISO format — snake_case (DE) — diverso da startTime (IT)
  end_time: string;    // ISO format — snake_case (DE)
  date?: string;       // YYYY-MM-DD (Europe/Berlin)
  category: string;
  description: string;
  slug?: string;
  poster_url?: string | null;
  indexable?: boolean; // true solo per film con synopsis > 300 Wörter
  isLive?: boolean;
  channel_id?: string;
  // Enrichment opzionale (content_enrichment_de)
  cast_json?: string | null;
}

export interface Channel {
  id: string;
  name: string;
  number: number;
  logo: string;
  type: 'Generalista' | 'Tematico' | 'Film' | 'Sport' | 'News' | 'Radio';
  programs: Program[];
  color?: string;
  isRadio?: boolean;
  streamUrl?: string;
  website?: string;
  visible?: boolean;
  position?: number;
  source?: string;
}

export type TimeSlotFilter = 'Alle' | 'Film' | 'Nachrichten' | 'Dokumentation' | 'Show' | 'Serie' | 'Sport' | 'Kinder' | 'Kultur';
export type ChannelViewMode = 'heute' | 'jetzt' | 'heute-abend';

export interface HubChannel {
  id: string;
  name: string;
  number?: number;
}
