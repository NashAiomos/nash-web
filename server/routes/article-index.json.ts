import { serverQueryContent } from '#content/server'

export default defineEventHandler((event) =>
  serverQueryContent(event).only(['_path', '_file', 'title', 'description', 'tags', 'date']).find(),
)
