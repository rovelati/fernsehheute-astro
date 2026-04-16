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
      filter: (page) => !page.includes('/programm/'),
      serialize(item) {
        if (item.url === 'https://fernsehheute.de/') {
          return { ...item, priority: 1.0, changefreq: 'hourly' }
        }
        if (/\/(das-erste|zdf|sat1|prosieben|rtl|vox|rtl2|kabel-eins)$/.test(item.url)) {
          return { ...item, priority: 0.9, changefreq: 'daily' }
        }
        if (/\/(film-heute-abend|serien-heute-abend|sport-heute-abend|morgen|heute-abend)$/.test(item.url)) {
          return { ...item, priority: 0.85, changefreq: 'daily' }
        }
        return { ...item, priority: 0.7, changefreq: 'daily' }
      },
    }),
  ],
})
