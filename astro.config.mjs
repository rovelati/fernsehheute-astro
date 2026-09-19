import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://fernsehheute.de',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const url = page.toLowerCase();
        // Exclude utility / legal / error pages
        if (url.includes('/404') || url.includes('/impressum') || url.includes('/datenschutz') || url.includes('/admin-seo')) {
          return false;
        }
        // Exclude test channels
        if (url.includes('/testkanal')) {
          return false;
        }
        // Exclude redirect alias pages (they 301 to hub pages)
        if (url.endsWith('/filme/') || url.endsWith('/spielfilme/') || url.endsWith('/serien/') || url.endsWith('/sport/')) {
          return false;
        }
        // Exclude URLs with spaces or illegal characters
        if (url.includes('%20') || url.includes('+') || url.includes(' ') || url.includes('/programm/')) {
          return false;
        }
        return true;
      },
      serialize(item) {
        const now = new Date();
        const url = item.url.replace(/\/$/, '') + '/';

        // Homepage
        if (url === 'https://fernsehheute.de/' || item.url === 'https://fernsehheute.de') {
          return {
            ...item,
            lastmod: now,
            priority: 1.0,
            changefreq: 'hourly',
          };
        }

        // Top Category Hubs
        if (/\/(film-heute-abend|serien-heute-abend|sport-heute-abend|morgen)\/?$/.test(item.url)) {
          return {
            ...item,
            lastmod: now,
            priority: 0.9,
            changefreq: 'daily',
          };
        }

        // Top Free-To-Air German Channels
        if (/\/(das-erste|zdf|sat1|prosieben|rtl|vox|rtl2|kabel-eins|3sat|arte|nitro|super-rtl|tele5|zdf-neo|zdfinfo|one|sixx|phoenix|tagesschau24|n-tv|welt|sport1|dmax|kika|ard-alpha)\/?$/.test(item.url)) {
          return {
            ...item,
            lastmod: now,
            priority: 0.85,
            changefreq: 'daily',
          };
        }

        // Other valid channels
        return {
          ...item,
          lastmod: now,
          priority: 0.7,
          changefreq: 'daily',
        };
      },
    }),
  ],
})
