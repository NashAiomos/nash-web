const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAGE_SIZE = 30
const MAX_BODY_BYTES = 16384

class HttpError extends Error {
  constructor(status, message, retryAfter = 0) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim())
  if (origin && allowed.includes(origin)) return origin
  if (env.ENVIRONMENT === 'development' && /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin || '')) return origin
  return null
}

function respond(data, status, request, env, extra = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
    ...extra,
  })
  const origin = allowedOrigin(request, env)
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    headers.set('Access-Control-Expose-Headers', 'Retry-After')
    headers.set('Access-Control-Max-Age', '86400')
  }
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers })
}

function postPath(value) {
  if (typeof value !== 'string' || value.length > 200 || !/^\/(?:blog|life|novel)\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(value)) {
    throw new HttpError(400, '文章地址无效。')
  }
  return value
}

function visitorToken(request, required = false) {
  const authorization = request.headers.get('Authorization')
  if (!authorization && !required) return null
  const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization || '')
  if (!match) throw new HttpError(401, '匿名身份无效，请刷新页面后重试。')
  return match[1]
}

async function sha256(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function jsonBody(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, '请使用 JSON 格式提交。')
  }
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw new HttpError(413, '提交的内容太长。')
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, '评论内容不能为空。')
  const decoder = new TextDecoder()
  let text = ''
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new HttpError(413, '提交的内容太长。')
      }
      text += decoder.decode(value, { stream: true })
    }
    const body = JSON.parse(text + decoder.decode())
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('Invalid JSON object')
    return body
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, '提交的内容格式不正确。')
  } finally {
    reader.releaseLock()
  }
}

async function rateLimit(db, key, limit, windowMs, now) {
  const result = await db.prepare(`
    INSERT INTO rate_limits (rate_key, hits, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(rate_key) DO UPDATE SET
      hits = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.hits + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END
    RETURNING hits, reset_at
  `).bind(key, now + windowMs, now, now).first()
  if (result.hits > limit) {
    const retryAfter = Math.max(1, Math.ceil((result.reset_at - now) / 1000))
    throw new HttpError(429, `评论操作太频繁，请在 ${retryAfter} 秒后再试。`, retryAfter)
  }
}

async function writeLimits(request, env, tokenHash, now, deleting = false) {
  if (!env.RATE_LIMIT_SALT) throw new HttpError(503, '评论服务暂不可用，请稍后再试。')
  const day = new Date(now).toISOString().slice(0, 10)
  const ipHash = await sha256(`${env.RATE_LIMIT_SALT}:${day}:${request.headers.get('CF-Connecting-IP') || 'local'}`)
  await rateLimit(env.DB, `${deleting ? 'delete' : 'post'}:ip:${ipHash}`, deleting ? 120 : 50, 3600000, now)
  if (deleting) return
  await rateLimit(env.DB, `post:visitor:${tokenHash}`, 10, 3600000, now)
  await rateLimit(env.DB, `post:cooldown:${tokenHash}`, 1, 20000, now)
  await rateLimit(env.DB, `post:day:${day}`, 1000, 86400000, now)
}

const selectComment = `
  SELECT c.id, c.post_path AS postPath, c.content, c.created_at AS createdAt,
         g.id AS authorId, g.name AS name
  FROM comments c JOIN guests g ON g.id = c.guest_id
`

async function viewer(db, tokenHash) {
  if (!tokenHash) return null
  return await db.prepare('SELECT id, name FROM guests WHERE token_hash = ?').bind(tokenHash).first()
}

async function total(db, path) {
  const row = await db.prepare('SELECT COUNT(*) AS total FROM comments WHERE post_path = ?').bind(path).first()
  return row.total
}

async function listComments(request, env, url) {
  const path = postPath(url.searchParams.get('post'))
  const token = visitorToken(request)
  const tokenHash = token ? await sha256(token) : null
  const cursor = url.searchParams.get('cursor')
  let statement
  if (cursor) {
    const [timestamp, id, extra] = cursor.split(':')
    if (extra || !/^\d{1,16}$/.test(timestamp) || !Number.isSafeInteger(Number(timestamp)) || !UUID.test(id || '')) {
      throw new HttpError(400, '分页地址无效。')
    }
    statement = env.DB.prepare(`${selectComment}
      WHERE c.post_path = ? AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))
      ORDER BY c.created_at DESC, c.id DESC LIMIT ?
    `).bind(path, Number(timestamp), Number(timestamp), id, PAGE_SIZE + 1)
  } else {
    statement = env.DB.prepare(`${selectComment} WHERE c.post_path = ? ORDER BY c.created_at DESC, c.id DESC LIMIT ?`)
      .bind(path, PAGE_SIZE + 1)
  }
  const [rows, profile, count] = await Promise.all([statement.all(), viewer(env.DB, tokenHash), total(env.DB, path)])
  const comments = rows.results.slice(0, PAGE_SIZE)
  const last = comments.at(-1)
  return respond({ comments, viewer: profile, total: count,
    nextCursor: rows.results.length > PAGE_SIZE ? `${last.createdAt}:${last.id}` : null,
  }, 200, request, env)
}

function hasControlCharacters(value, multiline = false) {
  return Array.from(value).some(char => {
    const code = char.charCodeAt(0)
    return (code < 32 && !(multiline && (code === 9 || code === 10))) || (code >= 127 && code <= 159)
  })
}

async function createComment(request, env, ctx) {
  const tokenHash = await sha256(visitorToken(request, true))
  const body = await jsonBody(request)
  const path = postPath(body.postPath)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const content = typeof body.content === 'string' ? body.content.replace(/\r\n?/g, '\n').trim() : ''
  if (!name || name.length > 40 || hasControlCharacters(name)) throw new HttpError(400, '昵称请填写 1–40 个字符。')
  if (!content || content.length > 3000 || hasControlCharacters(content, true)) throw new HttpError(400, '评论请填写 1–3000 个字符。')
  if (!UUID.test(body.id || '') || body.website) throw new HttpError(400, '提交的内容格式不正确。')

  const existing = await env.DB.prepare(`${selectComment} WHERE c.id = ?`).bind(body.id).first()
  const profile = await viewer(env.DB, tokenHash)
  if (existing) {
    if (existing.authorId !== profile?.id || existing.postPath !== path || existing.content !== content) throw new HttpError(409, '这次提交已失效，请刷新后重试。')
    return respond({ comment: existing, viewer: profile, total: await total(env.DB, path) }, 200, request, env)
  }

  const now = Date.now()
  await writeLimits(request, env, tokenHash, now)
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO guests (id, token_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(token_hash) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at
    `).bind(crypto.randomUUID(), tokenHash, name, now, now),
    env.DB.prepare(`INSERT INTO comments (id, post_path, guest_id, content, created_at)
      SELECT ?, ?, id, ?, ? FROM guests WHERE token_hash = ? ON CONFLICT(id) DO NOTHING
    `).bind(body.id, path, content, now, tokenHash),
  ])
  const [comment, updatedProfile, count] = await Promise.all([
    env.DB.prepare(`${selectComment} WHERE c.id = ?`).bind(body.id).first(),
    viewer(env.DB, tokenHash), total(env.DB, path),
  ])
  if (comment?.authorId !== updatedProfile?.id) throw new HttpError(409, '这次提交已失效，请刷新后重试。')
  ctx.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now - 86400000).run())
  return respond({ comment, viewer: updatedProfile, total: count }, 201, request, env)
}

async function deleteComment(request, env, id) {
  if (!UUID.test(id)) throw new HttpError(400, '评论地址无效。')
  const tokenHash = await sha256(visitorToken(request, true))
  await writeLimits(request, env, tokenHash, Date.now(), true)
  const result = await env.DB.prepare(`DELETE FROM comments WHERE id = ?
    AND guest_id IN (SELECT id FROM guests WHERE token_hash = ?)
  `).bind(id, tokenHash).run()
  if (!result.meta.changes) throw new HttpError(404, '这条评论已不存在，或不属于当前访客。')
  return respond({ ok: true }, 200, request, env)
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)
      if (request.method === 'OPTIONS') {
        if (!allowedOrigin(request, env)) throw new HttpError(403, '不允许从这个网站提交评论。')
        return respond(null, 204, request, env)
      }
      if (request.method === 'GET' && url.pathname === '/api/health') {
        await env.DB.prepare('SELECT 1 AS ok').first()
        return respond({ ok: true }, 200, request, env)
      }
      if (url.pathname === '/api/comments') {
        if (request.method === 'GET') return await listComments(request, env, url)
        if (request.method === 'POST') {
          if (!allowedOrigin(request, env)) throw new HttpError(403, '不允许从这个网站提交评论。')
          return await createComment(request, env, ctx)
        }
      }
      const deletion = /^\/api\/comments\/([^/]+)$/.exec(url.pathname)
      if (deletion && request.method === 'DELETE') {
        if (!allowedOrigin(request, env)) throw new HttpError(403, '不允许从这个网站提交评论。')
        return await deleteComment(request, env, deletion[1])
      }
      throw new HttpError(404, '没有找到这个接口。')
    } catch (error) {
      if (error instanceof HttpError) return respond({ error: error.message, retryAfter: error.retryAfter || undefined }, error.status, request, env,
        error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {})
      console.error('Comments API error', error)
      return respond({ error: '评论服务暂不可用，请稍后再试。' }, 500, request, env)
    }
  },
}
