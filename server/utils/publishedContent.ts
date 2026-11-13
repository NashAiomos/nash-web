import { serverQueryContent } from '#content/server'
import type { H3Event } from 'h3'

export function publishedContent(event: H3Event) {
  return serverQueryContent(event)
    .where({ _file: { $regex: /^blog\// }, draft: { $ne: true }, _draft: { $ne: true }, _partial: { $ne: true } })
    .sort({ date: -1 })
}
