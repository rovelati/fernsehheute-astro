import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://fernsehheute.de',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/programm/') &&
        !page.includes('/testkanal-') &&
        !page.includes('/impressum') &&
        !page.includes('/datenschutz') &&
        !page.includes('/admin-seo'),
      serialize(item) {
        if (item.url === 'https://fernsehheute.de/' || item.url === 'https://fernsehheute.de') {
          return { ...item, priority: 1.0, changefreq: 'hourly' }
        }
        if (/\/(das-erste|zdf|sat1|prosieben|rtl|vox|rtl2|kabel-eins)\/?$/.test(item.url)) {
          return { ...item, priority: 0.9, changefreq: 'daily' }
        }
        if (/\/(sixx|super-rtl|nitro|tele5|zdf-neo|zdfinfo|3sat|arte|phoenix|one|sport1|eurosport-1|dmax|tlc|n-tv|ntv|welt|tagesschau24|kika|comedy-central|disney-channel|ard-alpha|sat1-gold|prosieben-maxx|kabel-eins-doku|mdr|ndr|wdr|br|swr|hr|rbb)\/?$/.test(item.url)) {
          return { ...item, priority: 0.8, changefreq: 'daily' }
        }
        if (/\/(film-heute-abend|serien-heute-abend|sport-heute-abend|morgen|heute-abend)\/?$/.test(item.url)) {
          return { ...item, priority: 0.85, changefreq: 'daily' }
        }
        return { ...item, priority: 0.7, changefreq: 'daily' }
      },
    }),
  ],
})
