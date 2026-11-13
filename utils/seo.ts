import { siteConfig, socialLinks } from '../site.config'

// Paths passed here are site-relative, not origin-relative. Keep the Pages base path.
export function siteUrl(path = '', page = false) {
  const relative = path.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')
  const url = new URL(relative, siteConfig.url)
  if (page && !url.pathname.endsWith('/')) url.pathname += '/'
  return url.href
}

export const pageUrl = (path = '') => siteUrl(path, true)
export const articleUrl = (path: string) => pageUrl(`p${path}`)
export const articlePath = (path: string) => `/p${path}/`
// Ampersands are valid path characters. Encoding them triggers Nitro's double-encoding
// of reserved characters during prerendering and produces broken static directories.
export const tagPath = (tag: string) => `/tags/${encodeURIComponent(tag).replace(/%26/g, '&')}/`

export function articleAuthor(article: Record<string, unknown>) {
  return typeof article.author === 'string' && article.author
    ? { '@type': 'Person', name: article.author, ...(typeof article.authorUrl === 'string' ? { url: article.authorUrl } : {}) }
    : { '@type': 'Person', '@id': `${siteConfig.url}#person`, name: siteConfig.author, url: siteConfig.url }
}

export const personSchema = {
  '@type': 'Person',
  '@id': `${siteConfig.url}#person`,
  name: siteConfig.author,
  alternateName: siteConfig.alternateNames,
  url: siteConfig.url,
  description: 'Software engineer, writer, and author of Constellation Book, an illustrated guide to Internet Computer architecture and dApp development.',
  sameAs: socialLinks.map(link => link.path),
}

export const websiteSchema = {
  '@type': 'WebSite',
  '@id': `${siteConfig.url}#website`,
  name: siteConfig.title,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: ['en', 'zh-Hans'],
  publisher: { '@id': personSchema['@id'] },
}

export function escapeXml(value: unknown) {
  return String(value ?? '').replace(/[<>&"']/g, char => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[char]!)
}

// Escape script delimiters even when a title or description contains HTML.
export const serializeSchema = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
