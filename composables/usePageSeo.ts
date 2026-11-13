import { siteConfig } from '../site.config'
import { pageUrl, serializeSchema, siteUrl } from '../utils/seo'

interface PageSeo {
  title: string
  description: string
  path: string
  lang?: string
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
  author?: string
  published?: string
  modified?: string
  alternates?: Record<string, string>
  schema?: Record<string, unknown>[]
}

export function usePageSeo(input: PageSeo | (() => PageSeo)) {
  useHead(() => {
    const seo = typeof input === 'function' ? input() : input
    const title = seo.title.includes(siteConfig.title) ? seo.title : `${seo.title} | ${siteConfig.title}`
    const url = pageUrl(seo.path)
    const lang = seo.lang || siteConfig.lang
    const image = siteUrl(siteConfig.socialImage)
    return {
      title,
      htmlAttrs: { lang },
      meta: [
        { name: 'description', content: seo.description },
        { name: 'author', content: seo.author || siteConfig.author },
        { name: 'robots', content: seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large' },
        { property: 'og:type', content: seo.type || 'website' },
        { property: 'og:site_name', content: siteConfig.title },
        { property: 'og:title', content: title },
        { property: 'og:description', content: seo.description },
        { property: 'og:url', content: url },
        { property: 'og:locale', content: lang.startsWith('zh') ? 'zh_CN' : 'en_US' },
        { property: 'og:image', content: image },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: siteConfig.socialImageAlt },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@nashaiomos' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: seo.description },
        { name: 'twitter:image', content: image },
        { name: 'twitter:image:alt', content: siteConfig.socialImageAlt },
        ...(seo.published ? [{ property: 'article:published_time', content: seo.published }] : []),
        ...(seo.modified ? [{ property: 'article:modified_time', content: seo.modified }] : []),
      ],
      link: [
        { rel: 'canonical', href: url },
        ...Object.entries(seo.alternates || {}).map(([hreflang, path]) => ({ rel: 'alternate', hreflang, href: pageUrl(path) })),
      ],
      script: seo.schema?.length ? [{
        key: 'page-schema',
        type: 'application/ld+json',
        innerHTML: serializeSchema({ '@context': 'https://schema.org', '@graph': seo.schema }),
      }] : [],
    }
  })
}
