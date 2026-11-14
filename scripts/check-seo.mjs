import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'

const output = resolve('.output/public')
const read = file => readFile(join(output, file), 'utf8')
const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16))
  if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)))
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity]
})
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]+)>`, 'gi'))].map(match =>
  Object.fromEntries([...match[1].matchAll(/([^\s=]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])),
)
const text = html => decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<img\b[^>]*>/gi, image => ` [${tags(image, 'img')[0]?.alt || ''}] `)
  .replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
const schemas = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(([, json]) => JSON.parse(json)['@graph'])

const index = JSON.parse(await read('article-index.json'))
const content = JSON.parse(await read('content.json'))
const base = new URL(content.url)
const localFile = url => {
  const parsed = new URL(url)
  assert.equal(parsed.origin, base.origin, `Wrong origin: ${url}`)
  assert.ok(parsed.pathname.startsWith(base.pathname), `Lost deployment base: ${url}`)
  const path = decodeURIComponent(parsed.pathname.slice(base.pathname.length))
  return path.endsWith('/') || path === '' ? `${path}index.html` : path
}
const sitemap = await read('sitemap.xml')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => decode(url))
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs')
assert.ok(urls.length > index.length, 'Sitemap must contain pages as well as articles')
assert.ok(!urls.some(url => /\/(search|p)\/$/.test(url)), 'Utility pages should not be in sitemap')

const pages = new Map()
const titles = new Set()
const descriptions = new Set()
for (const url of urls) {
  const html = await read(localFile(url))
  const links = tags(html, 'link')
  const stylesheets = links.filter(link => link.rel === 'stylesheet')
  assert.ok(stylesheets.length, `${url}: no stylesheet linked in HTML`)
  for (const stylesheet of stylesheets) {
    assert.ok((await stat(join(output, localFile(new URL(stylesheet.href, url).href)))).size > 0, `${url}: missing stylesheet`)
  }
  const meta = tags(html, 'meta')
  const oneMeta = (name, attr = 'name') => {
    const matches = meta.filter(tag => tag[attr] === name)
    assert.equal(matches.length, 1, `${url}: expected one ${name}`)
    assert.ok(matches[0].content, `${url}: empty ${name}`)
    return matches[0].content
  }
  const canonical = links.filter(link => link.rel === 'canonical')
  assert.equal(canonical.length, 1, `${url}: duplicate or absent canonical`)
  assert.equal(canonical[0].href, url, `${url}: canonical does not match sitemap`)
  assert.ok(!oneMeta('robots').includes('noindex'), `${url}: indexable page is noindex`)
  const title = text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
  assert.ok(title.includes('Nash Aiomos'), `${url}: missing site identity`)
  assert.ok(!titles.has(title), `${url}: duplicate title`)
  titles.add(title)
  const description = oneMeta('description')
  assert.ok(description.length > 20 && description !== 'My site.', `${url}: missing meaningful summary`)
  assert.ok(!descriptions.has(description), `${url}: duplicate description`)
  descriptions.add(description)
  assert.equal(oneMeta('og:title', 'property'), title)
  assert.equal(oneMeta('og:description', 'property'), description)
  assert.equal(oneMeta('og:url', 'property'), url)
  assert.equal(oneMeta('twitter:description'), description)
  assert.equal(oneMeta('twitter:card'), 'summary_large_image')
  assert.ok((await stat(join(output, localFile(oneMeta('og:image', 'property'))))).size > 0)
  assert.ok(tags(html, 'html')[0].lang, `${url}: missing document language`)
  assert.ok(/<h1\b/.test(html), `${url}: no prerendered heading`)
  const hydration = tags(html, 'script').find(tag => tag.id === '__NUXT_DATA__')
  assert.ok(hydration && hydration['data-ssr'] === 'true', `${url}: missing SSR hydration data`)
  assert.ok(!hydration['data-src'], `${url}: initial render depends on a separate payload download`)
  assert.ok(schemas(html).some(node => node['@type'] === 'Person'), `${url}: missing author identity`)
  pages.set(url, { html, links, meta, description })
}

// A failed route/component import previously replaced the rendered homepage
// with the noindex error page in Google's renderer. Keep startup self-contained.
const clientScripts = (await readdir(join(output, 'assets'))).filter(file => file.endsWith('.js'))
assert.equal(clientScripts.length, 1, 'Client startup must not depend on secondary JavaScript chunks')

assert.equal(content.articles.length, index.length, 'Index and agent content disagree')
for (const article of content.articles) {
  const page = pages.get(article.url)
  assert.ok(page, `${article.url}: article is absent from sitemap`)
  const summary = index.find(item => item.url === article.url)
  assert.equal(summary.title, article.title)
  assert.equal(summary.description, article.description)
  assert.equal(page.description, article.description)
  assert.equal(tags(page.html, 'html')[0].lang, article.language)
  const schema = schemas(page.html).find(node => node['@type'] === 'BlogPosting')
  assert.equal(schema.headline, article.title)
  assert.equal(schema.url, article.url)
  assert.equal(schema.author.name, article.author.name)
  assert.equal(schema.datePublished, article.datePublished)
  assert.equal(schema.dateModified, article.dateModified, 'Do not invent modification dates')
  assert.ok(article.text.length > 100, `${article.url}: missing full text`)
  const start = article.text.replace(/\s+/g, '').slice(0, 100)
  assert.ok(text(page.html).replace(/\s+/g, '').includes(start), `${article.url}: agent text does not match rendered body`)
  assert.ok(schemas(page.html).some(node => node['@type'] === 'BreadcrumbList'))
  for (const alternate of page.links.filter(link => link.hreflang)) {
    assert.ok(pages.has(alternate.href), `${article.url}: broken language alternate`)
    assert.ok(pages.get(alternate.href).links.some(link => link.hreflang && link.href === article.url), 'Language links must be reciprocal')
  }
}

// Guard against silently dropping a published Markdown file or changing its custom _path.
for (const file of await readdir('content/blog')) {
  if (!file.endsWith('.md')) continue
  const markdown = await readFile(join('content/blog', file), 'utf8')
  const frontmatter = markdown.split('---')[1]
  if (/^(?:_draft|draft|_partial):\s*true\s*$/m.test(frontmatter)) continue
  assert.ok(index.some(article => article._file === `blog/${file}`), `Published article missing: ${file}`)
}

for (const file of ['search/index.html', '404.html', '200.html']) {
  assert.ok(tags(await read(file), 'meta').some(tag => tag.name === 'robots' && tag.content.includes('noindex')), `${file}: missing noindex`)
}
const rss = await read('rss.xml')
const feedLinks = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)].map(([, url]) => decode(url))
assert.deepEqual(new Set(feedLinks), new Set(index.map(article => article.url)), 'RSS and sitemap article URLs disagree')
const llms = await read('llms.txt')
for (const article of index) assert.ok(llms.includes(article.url), `Agent guide is missing ${article.title}`)
assert.ok((await read('robots.txt')).includes(`Sitemap: ${new URL('sitemap.xml', base).href}`))
const image = await readFile(join(output, 'images/social-card-web3-ai.png'))
assert.equal(image.readUInt32BE(16), 1200)
assert.equal(image.readUInt32BE(20), 630)
console.log(`SEO checks passed: ${urls.length} canonical pages, ${index.length} complete articles, language links, JSON-LD, RSS, agent data, and social image.`)
