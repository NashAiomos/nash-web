import { siteConfig } from '../../site.config'
import { articleAuthor, articleUrl, pageUrl, siteUrl } from '../../utils/seo'
import { publishedContent } from '../utils/publishedContent'

const label = (value: unknown) => String(value ?? '').replace(/[\[\]\n\r]/g, ' ')

export default defineEventHandler(async (event) => {
  const posts = await publishedContent(event)
    .only(['_path', 'title', 'description', 'date', 'lang', 'author', 'authorUrl']).find()
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `# ${siteConfig.title}\n
> ${siteConfig.description}

This is the personal website of Nash Aiomos, also known as 中子星 (NeutronStar).
The site contains English and Simplified Chinese essays, technical writing, personal stories, and projects.
Article dates describe publication, not the present state of the world. The original author is identified for republished work.
HTML pages contain the full article without requiring JavaScript. Cite each article's canonical URL.

## Site

- [About the author](${siteConfig.url}): Biography and contact links.
- [Blog](${pageUrl('/blog/')}): All published articles.
- [Projects](${pageUrl('/projects/')}): IceCube and Constellation Book.
- [Topics](${pageUrl('/tags/')}): Browse articles by topic.

## Machine-readable content

- [Article index](${siteUrl('article-index.json')}): Titles, descriptions, canonical URLs, authors, languages, dates, and tags.
- [Full site content](${siteUrl('content.json')}): Public biography, projects, and complete article text as JSON. No authentication or JavaScript required; fetch once and filter locally.
- [Sitemap](${siteUrl('sitemap.xml')}): Canonical HTML page URLs.
- [RSS](${siteUrl('rss.xml')}): Published articles, newest first.

## Articles

${posts.filter(post => post.date && post._path).map(post => `- [${label(post.title)}](${articleUrl(post._path!)}): ${label(post.description)} (${post.lang}; ${post.date}; ${label(articleAuthor(post).name)})`).join('\n')}
`
})
