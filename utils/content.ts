interface ContentNode {
  type?: string
  tag?: string
  value?: string
  props?: { alt?: string; code?: string }
  children?: ContentNode[]
}

const blockTags = new Set(['p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre', 'tr', 'br', 'hr'])

// Extract only the published document body: no navigation, comments, or client scripts.
export function contentText(node?: ContentNode | null): string {
  function walk(current: ContentNode): string {
    if (['script', 'style'].includes(current.tag || '')) return ''
    if (current.type === 'text') return current.value || ''
    if (current.tag === 'img') return current.props?.alt ? ` [${current.props.alt}] ` : ''
    const text = current.props?.code || (current.children || []).map(walk).join('')
    if (current.tag === 'td' || current.tag === 'th') return `${text}\t`
    return blockTags.has(current.tag || '') ? `\n${text}\n` : text
  }
  return node ? walk(node).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : ''
}
