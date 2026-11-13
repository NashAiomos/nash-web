import { serverQueryContent } from '#content/server'
import { projectList, siteConfig, socialLinks } from '../../site.config'
import { contentText } from '../../utils/content'
import { articleAuthor, articleUrl, pageUrl, siteUrl } from '../../utils/seo'
import { publishedContent } from '../utils/publishedContent'

export default defineEventHandler(async (event) => {
  const [about, posts] = await Promise.all([
    serverQueryContent(event, '/me').findOne(),
    publishedContent(event).find(),
  ])
  return {
    version: 1,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    languages: ['en', 'zh-Hans'],
    author: { name: siteConfig.author, alternateNames: siteConfig.alternateNames, url: siteConfig.url, sameAs: socialLinks.map(link => link.path) },
    sitemap: siteUrl('sitemap.xml'),
    feed: siteUrl('rss.xml'),
    articleIndex: siteUrl('article-index.json'),
    about: { url: siteConfig.url, text: contentText(about.body) },
    projects: { url: pageUrl('/projects/'), items: projectList },
    articles: posts.filter(post => post.date && post._path).map(post => ({
      url: articleUrl(post._path!),
      title: post.title,
      description: post.description,
      language: post.lang,
      author: articleAuthor(post),
      datePublished: post.date,
      ...(post.updated ? { dateModified: post.updated } : {}),
      tags: post.tags || [],
      text: contentText(post.body),
    })),
  }
})
