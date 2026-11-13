import { articleAuthor, articleUrl } from '../../utils/seo'
import { publishedContent } from '../utils/publishedContent'

export default defineEventHandler(async (event) => {
  const posts = await publishedContent(event)
    .only(['_path', '_file', 'title', 'description', 'tags', 'date', 'updated', 'lang', 'author', 'authorUrl']).find()
  return posts.filter(post => post.date && post._path).map(post => ({
    ...post,
    url: articleUrl(post._path!),
    author: articleAuthor(post).name,
  }))
})
