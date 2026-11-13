import { siteConfig } from '../../site.config'
import { articleUrl, escapeXml, siteUrl } from '../../utils/seo'
import { publishedContent } from '../utils/publishedContent'

export default defineEventHandler(async (event) => {
  const posts = await publishedContent(event)
    .only(['_path', 'title', 'description', 'date'])
    .sort({ date: -1 }).find()
  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  const items = posts.filter(post => post.date).map(post => {
    const url = escapeXml(articleUrl(post._path!))
    return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(post.description)}</description><pubDate>${new Date(post.date).toUTCString()}</pubDate></item>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(siteConfig.title)}</title><link>${escapeXml(siteConfig.url)}</link><description>${escapeXml(siteConfig.description)}</description><atom:link href="${escapeXml(siteUrl('rss.xml'))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`
})
