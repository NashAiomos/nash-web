import { format, parseISO } from 'date-fns'

export function formattedDate(date: string) {
  if (!date) return ''
  const dateObject = parseISO(date)
  const formattedResult = format(dateObject, 'MM/dd/yyyy')
  return formattedResult
}

export function groupPostsByYear(posts: any[]) {
  const groups: { year: number; articles: any[] }[] = []
  for (const post of posts) {
    const year = parseISO(post.date).getFullYear()
    let group = groups[groups.length - 1]
    if (!group || group.year !== year) {
      group = { year, articles: [] }
      groups.push(group)
    }
    group.articles.push(post)
  }
  return groups
}

export async function getIncludedYearPosts() {
  const result = await queryContent()
    .where({ _file: { $regex: /^blog\// } })
    .only(['_path', 'title', 'date'])
    .sort({ date: -1 })
    .find()
  return groupPostsByYear(result)
}
