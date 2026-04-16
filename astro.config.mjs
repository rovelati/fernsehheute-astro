import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import node from '@astrojs/node'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// Node adapter locale per evitare bug @cloudflare/vite-plugin (require_dist)
// Imposta ASTRO_ADAPTER=cloudflare per forzare il Cloudflare adapter (in CI)
const useCloudflare = process.env.ASTRO_ADAPTER === 'cloudflare'

export default defineConfig({
  site: 'https://fernsehheute.de',
  output: 'static',
  adapter: useCloudflare
    ? cloudflare({ prerenderEnvironment: 'node', imageService: 'compile', platformProxy: { enabled: false }, sessions: false })
    : node({ mode: 'standalone' }),
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
