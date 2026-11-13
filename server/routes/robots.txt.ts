import { siteUrl } from '../../utils/seo'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `# Crawlers only use this file when served at the origin root /robots.txt.\n# On GitHub project Pages, copy it to the user-site repository (see docs/seo.md).\nUser-agent: *\nAllow: /\n\nSitemap: ${siteUrl('sitemap.xml')}\n`
})
