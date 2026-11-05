import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('../../../', import.meta.url))
const config = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))
const base = 'http://127.0.0.1:8787'
const origin = 'https://nashaiomos.github.io'
const run = randomUUID().slice(0, 8)
const path = `/blog/comment-api-test-${run}`
const paginationPath = `/blog/comment-pagination-test-${run}`
const tokens = Array.from({ length: 3 }, () => randomBytes(32).toString('hex'))
const hashes = tokens.map(token => createHash('sha256').update(token).digest('hex'))
const checks = []
const quote = value => `'${String(value).replaceAll("'", "''")}'`

async function sql(statement) {
  const args = ['d1', 'execute', 'nash-web-comments', '--local', '--config', config, '--command', statement]
  if (process.env.WRANGLER_BIN) await execute(process.env.WRANGLER_BIN, args, { cwd: root })
  else await execute('npx', ['--yes', 'wrangler@4.157.0', ...args], { cwd: root })
}

async function call(route, { method = 'GET', token, body, requestOrigin = origin, headers = {} } = {}) {
  const requestHeaders = new Headers(headers)
  if (requestOrigin) requestHeaders.set('Origin', requestOrigin)
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)
  if (body !== undefined && !requestHeaders.has('Content-Type')) requestHeaders.set('Content-Type', 'application/json')
  const response = await fetch(base + route, {
    method, headers: requestHeaders,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  })
  const text = await response.text()
  return { status: response.status, headers: response.headers, data: text ? JSON.parse(text) : null }
}

const payload = (overrides = {}) => ({ id: randomUUID(), postPath: path, name: '访客 Alice', content: '第一行\n第二行', website: '', ...overrides })
const create = (token, body) => call('/api/comments', { method: 'POST', token, body })
let alice

try {
  assert.equal((await call('/api/health')).status, 200)
  const empty = await call(`/api/comments?post=${path}`, { token: tokens[0] })
  assert.deepEqual(empty.data, { comments: [], viewer: null, total: 0, nextCursor: null })
  assert.equal(empty.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal((await call('/api/comments', { method: 'OPTIONS' })).status, 204)
  assert.equal((await call('/api/comments', { method: 'OPTIONS', requestOrigin: 'https://untrusted.example' })).status, 403)
  assert.equal((await call('/api/comments', { method: 'POST', body: payload() })).status, 401)
  assert.equal((await create('invalid', payload())).status, 401)
  assert.equal((await call('/api/comments', { method: 'POST', token: tokens[0], body: payload(), requestOrigin: 'https://untrusted.example' })).status, 403)
  assert.equal((await call('/api/comments', { method: 'POST', token: tokens[0], body: payload(), requestOrigin: null })).status, 403)
  checks.push('CORS preflight, allowed origin and required anonymous credentials')

  for (const change of [{ name: '' }, { name: 'x'.repeat(41) }, { name: 'bad\nname' }, { content: '  ' }, { content: 'x'.repeat(3001) }, { content: 'bad\u0000text' }, { website: 'spam' }, { id: 'invalid' }, { postPath: '/../../admin' }]) {
    assert.equal((await create(tokens[0], payload(change))).status, 400, JSON.stringify(change))
  }
  assert.equal((await call('/api/comments', { method: 'POST', token: tokens[0], body: 'x', headers: { 'Content-Type': 'text/plain' } })).status, 415)
  assert.equal((await call('/api/comments', { method: 'POST', token: tokens[0], body: '{not-json' })).status, 400)
  assert.equal((await create(tokens[0], payload({ content: 'x'.repeat(20000) }))).status, 413)
  assert.equal((await call('/api/comments?post=/invalid')).status, 400)
  assert.equal((await call(`/api/comments?post=${path}&cursor=invalid`)).status, 400)
  checks.push('Length limits, bounded request bodies, control characters, invalid paths and honeypot')

  const body = payload({ name: "O'Reilly", content: '<img src=x onerror="window.__commentXss=1">\n<script>window.__commentXss=1</script>\nSQL: \'); DROP TABLE comments;--' })
  alice = await create(tokens[0], body)
  assert.equal(alice.status, 201, JSON.stringify(alice.data))
  assert.equal(alice.data.comment.content, body.content)
  assert.equal(alice.data.comment.name, body.name)
  const repeated = await create(tokens[0], body)
  assert.equal(repeated.status, 200)
  assert.equal(repeated.data.comment.id, body.id)
  assert.equal(repeated.data.total, 1)
  const recognized = await call(`/api/comments?post=${path}`, { token: tokens[0] })
  assert.equal(recognized.data.viewer.id, alice.data.viewer.id)
  assert.equal(recognized.data.comments[0].authorId, alice.data.viewer.id)
  const publicResponse = await call(`/api/comments?post=${path}`)
  assert.equal(publicResponse.data.viewer, null)
  assert.ok(!JSON.stringify(publicResponse.data).includes(tokens[0]))
  assert.ok(!JSON.stringify(publicResponse.data).includes('token_hash'))
  const limited = await create(tokens[0], payload())
  assert.equal(limited.status, 429)
  assert.ok(Number(limited.headers.get('Retry-After')) > 0)
  checks.push('Persistent identity, literal text storage, no credential exposure, idempotent retry and cooldown')

  const bob = await create(tokens[1], payload({ name: body.name, content: 'Same nickname, different anonymous visitor' }))
  assert.equal(bob.status, 201)
  assert.notEqual(bob.data.viewer.id, alice.data.viewer.id)
  assert.equal((await call(`/api/comments/${body.id}`, { method: 'DELETE', token: tokens[1] })).status, 404)
  assert.equal((await create(tokens[1], { ...body, content: 'Cannot overwrite another visitor' })).status, 409)
  assert.equal((await call(`/api/comments?post=${paginationPath}`)).data.total, 0)
  checks.push('Nickname is not authentication; visitors cannot delete or overwrite each other; articles are isolated')

  await sql(`UPDATE rate_limits SET reset_at = 0 WHERE rate_key = ${quote('post:cooldown:' + hashes[0])}`)
  const renamed = await create(tokens[0], payload({ name: '新昵称', content: 'Same identity after renaming' }))
  assert.equal(renamed.status, 201)
  assert.equal(renamed.data.viewer.id, alice.data.viewer.id)
  const renamedList = await call(`/api/comments?post=${path}`, { token: tokens[0] })
  assert.ok(renamedList.data.comments.filter(comment => comment.authorId === alice.data.viewer.id).every(comment => comment.name === '新昵称'))
  assert.equal((await call(`/api/comments/${body.id}`, { method: 'DELETE', token: tokens[0] })).status, 200)
  assert.equal((await call(`/api/comments?post=${path}`)).data.total, 2)
  checks.push('Changing a nickname preserves identity and avatar seed; own comments can be deleted')

  const attempts = await Promise.all(Array.from({ length: 5 }, () => create(tokens[2], payload({ name: '并发访客' }))))
  assert.equal(attempts.filter(result => result.status === 201).length, 1)
  assert.equal(attempts.filter(result => result.status === 429).length, 4)
  checks.push('Concurrent submissions cannot bypass the atomic cooldown')

  const at = Date.now() - 86400000
  const rows = Array.from({ length: 35 }, (_, index) => `(${quote(randomUUID())},${quote(paginationPath)},${quote(alice.data.viewer.id)},${quote('分页评论 ' + index)},${at})`)
  await sql(`INSERT INTO comments (id, post_path, guest_id, content, created_at) VALUES ${rows.join(',')}`)
  const first = (await call(`/api/comments?post=${paginationPath}`)).data
  assert.equal(first.comments.length, 30)
  assert.equal(first.total, 35)
  assert.ok(first.nextCursor)
  const second = (await call(`/api/comments?post=${paginationPath}&cursor=${encodeURIComponent(first.nextCursor)}`)).data
  assert.equal(second.comments.length, 5)
  assert.equal(second.nextCursor, null)
  assert.equal(new Set([...first.comments, ...second.comments].map(comment => comment.id)).size, 35)
  checks.push('Cursor pagination remains stable for comments sharing the same timestamp')

  const { default: worker } = await import('../src/index.mjs')
  const forbidden = await worker.fetch(new Request('https://comments.example/api/comments', { method: 'POST', headers: { Origin: 'http://localhost:4173' } }), { ENVIRONMENT: 'production', ALLOWED_ORIGINS: origin }, {})
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.headers.get('Access-Control-Allow-Origin'), null)
  checks.push('Production configuration does not trust local development origins')
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2))
} finally {
  // Fixtures only; every database operation in this script explicitly uses --local.
  await sql(`DELETE FROM comments WHERE post_path IN (${quote(path)},${quote(paginationPath)});
    DELETE FROM guests WHERE token_hash IN (${hashes.map(quote).join(',')});
    DELETE FROM rate_limits WHERE rate_key IN (${hashes.flatMap(hash => ['post:visitor:' + hash, 'post:cooldown:' + hash]).map(quote).join(',')});`)
}
