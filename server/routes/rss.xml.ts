import { serverQueryContent } from '#content/server'
import { siteConfig } from '../../site.config'

const escapeXml = (value: unknown) => String(value ?? '').replace(/[<>&"']/g, char => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[char]!)

export default defineEventHandler(async (event) => {
  const posts = await serverQueryContent(event)
    .where({ _file: { $regex: /^blog\// } })
    .only(['_path', 'title', 'description', 'date'])
    .sort({ date: -1 }).find()
  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  const items = posts.filter(post => post.date).map(post => {
    const url = escapeXml(new URL(`p${post._path}/`, siteConfig.url).href)
    return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(post.description)}</description><pubDate>${new Date(post.date).toUTCString()}</pubDate></item>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(siteConfig.title)}</title><link>${escapeXml(siteConfig.url)}</link><description>${escapeXml(siteConfig.description)}</description>${items}</channel></rss>`
})
