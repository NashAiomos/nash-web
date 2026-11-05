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
    throw new HttpError(400, 'Invalid article path.')
  }
  return value
}

function visitorToken(request, required = false) {
  const authorization = request.headers.get('Authorization')
  if (!authorization && !required) return null
  const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization || '')
  if (!match) throw new HttpError(401, 'Your guest session is invalid. Refresh the page and try again.')
  return match[1]
}

async function sha256(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function jsonBody(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, 'Submit the comment as JSON.')
  }
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw new HttpError(413, 'The submission is too long.')
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, 'Enter a comment.')
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
        throw new HttpError(413, 'The submission is too long.')
      }
      text += decoder.decode(value, { stream: true })
    }
    const body = JSON.parse(text + decoder.decode())
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('Invalid JSON object')
    return body
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'The submission is invalid.')
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
    throw new HttpError(429, `Too many requests. Try again in ${retryAfter} seconds.`, retryAfter)
  }
}

async function writeLimits(request, env, tokenHash, now, deleting = false) {
  if (!env.RATE_LIMIT_SALT) throw new HttpError(503, 'Comments are temporarily unavailable. Please try again later.')
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
      throw new HttpError(400, 'Invalid pagination cursor.')
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
  if (!name || name.length > 40 || hasControlCharacters(name)) throw new HttpError(400, 'Enter a display name between 1 and 40 characters.')
  if (!content || content.length > 3000 || hasControlCharacters(content, true)) throw new HttpError(400, 'Enter a comment between 1 and 3,000 characters.')
  if (!UUID.test(body.id || '') || body.website) throw new HttpError(400, 'The submission is invalid.')

  const existing = await env.DB.prepare(`${selectComment} WHERE c.id = ?`).bind(body.id).first()
  const profile = await viewer(env.DB, tokenHash)
  if (existing) {
    if (existing.authorId !== profile?.id || existing.postPath !== path || existing.content !== content) throw new HttpError(409, 'This submission has expired. Refresh the page and try again.')
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
  if (comment?.authorId !== updatedProfile?.id) throw new HttpError(409, 'This submission has expired. Refresh the page and try again.')
  ctx.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now - 86400000).run())
  return respond({ comment, viewer: updatedProfile, total: count }, 201, request, env)
}

async function deleteComment(request, env, id) {
  if (!UUID.test(id)) throw new HttpError(400, 'Invalid comment ID.')
  const tokenHash = await sha256(visitorToken(request, true))
  await writeLimits(request, env, tokenHash, Date.now(), true)
  const result = await env.DB.prepare(`DELETE FROM comments WHERE id = ?
    AND guest_id IN (SELECT id FROM guests WHERE token_hash = ?)
  `).bind(id, tokenHash).run()
  if (!result.meta.changes) throw new HttpError(404, 'This comment is unavailable or belongs to another visitor.')
  return respond({ ok: true }, 200, request, env)
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)
      if (request.method === 'OPTIONS') {
        if (!allowedOrigin(request, env)) throw new HttpError(403, 'This site is not allowed to submit comments.')
        return respond(null, 204, request, env)
      }
      if (request.method === 'GET' && url.pathname === '/api/health') {
        await env.DB.prepare('SELECT 1 AS ok').first()
        return respond({ ok: true }, 200, request, env)
      }
      if (url.pathname === '/api/comments') {
        if (request.method === 'GET') return await listComments(request, env, url)
        if (request.method === 'POST') {
          if (!allowedOrigin(request, env)) throw new HttpError(403, 'This site is not allowed to submit comments.')
          return await createComment(request, env, ctx)
        }
      }
      const deletion = /^\/api\/comments\/([^/]+)$/.exec(url.pathname)
      if (deletion && request.method === 'DELETE') {
        if (!allowedOrigin(request, env)) throw new HttpError(403, 'This site is not allowed to submit comments.')
        return await deleteComment(request, env, deletion[1])
      }
      throw new HttpError(404, 'Endpoint not found.')
    } catch (error) {
      if (error instanceof HttpError) return respond({ error: error.message, retryAfter: error.retryAfter || undefined }, error.status, request, env,
        error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {})
      console.error('Comments API error', error)
      return respond({ error: 'Comments are temporarily unavailable. Please try again later.' }, 500, request, env)
    }
  },
}
