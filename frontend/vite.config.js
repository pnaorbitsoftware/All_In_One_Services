import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const siteUrl = (process.env.VITE_SITE_URL || 'https://servicehub.aparaitech.org').replace(/\/$/, '')
const sitemapRoutes = [
  '/',
  '/contact',
  '/privacy-policy',
  '/terms-and-conditions',
  '/services/electrician-near-me',
  '/services/plumber-near-me',
  '/services/carpenter-near-me',
  '/services/ac-repair-near-me',
  '/services/home-cleaning-services',
  '/services/painting-services',
  '/services/appliance-repair',
  '/locations/pune',
  '/locations/mumbai',
  '/locations/nashik',
  '/locations/baramati',
]

function serviceHubSeoFiles() {
  return {
    name: 'servicehub-seo-files',
    closeBundle() {
      const distDir = path.resolve('dist')
      if (!fs.existsSync(distDir)) return

      const urls = sitemapRoutes
        .map((route) => `  <url><loc>${siteUrl}${route === '/' ? '' : route}</loc><changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq><priority>${route === '/' ? '1.0' : '0.8'}</priority></url>`)
        .join('\n')
      fs.writeFileSync(
        path.join(distDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      )
      fs.writeFileSync(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR || '.vite-cache',
  plugins: [react(), tailwindcss(), serviceHubSeoFiles()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/socket.io-client')) return 'maps'
        },
      },
    },
  },
})
