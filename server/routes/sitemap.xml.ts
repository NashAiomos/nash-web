import { articlePath, escapeXml, pageUrl, tagPath } from '../../utils/seo'
import { publishedContent } from '../utils/publishedContent'

export default defineEventHandler(async (event) => {
  const posts = (await publishedContent(event).only(['_path', 'date', 'updated', 'tags']).find())
    .filter(post => post.date && post._path)
  const tags = [...new Set(posts.flatMap(post => post.tags || []))] as string[]
  const entries = [
    ...['/', '/blog/', '/projects/', '/tags/'].map(path => ({ path, updated: undefined })),
    ...posts.map(post => ({ path: articlePath(post._path!), updated: post.updated })),
    ...tags.sort().map(tag => ({ path: tagPath(tag), updated: undefined })),
  ]
  // Sitemap membership also drives generation, including unlinked articles and custom _path values.
  setHeader(event, 'x-nitro-prerender', entries.map(entry => entry.path).join(', '))
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  const urls = entries.map(({ path, updated }) => {
    const lastmod = typeof updated === 'string' && !Number.isNaN(Date.parse(updated))
      ? `<lastmod>${escapeXml(updated)}</lastmod>` : ''
    return `<url><loc>${escapeXml(pageUrl(path))}</loc>${lastmod}</url>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})
