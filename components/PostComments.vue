<script setup lang="ts">
interface CommentRecord {
  id: string
  postPath: string
  content: string
  createdAt: number
  authorId: string
  name: string
}

interface Viewer { id: string; name: string }
interface CommentPage { comments: CommentRecord[]; viewer: Viewer | null; total: number; nextCursor: string | null }
interface CreatedComment { comment: CommentRecord; viewer: Viewer; total: number }

const props = defineProps<{ postPath: string }>()
const apiUrl = String(useRuntimeConfig().public.commentsApiUrl).replace(/\/$/, '')
const tokenKey = 'nash-web-comment-token-v1'
const nameKey = 'nash-web-comment-name-v1'
const token = useState('comment-visitor-token', () => '')
const nickname = useState('comment-visitor-name', () => '访客')
const persistent = useState('comment-identity-persistent', () => true)
const content = ref('')
const website = ref('')
const comments = ref<CommentRecord[]>([])
const viewerId = ref('')
const total = ref(0)
const nextCursor = ref<string | null>(null)
const loading = ref(true)
const submitting = ref(false)
const deleting = ref('')
const listError = ref('')
const formError = ref('')
const message = ref('')
const controller = new AbortController()
let draftRequest: { id: string; signature: string } | null = null

function initializeIdentity() {
  try {
    const saved = localStorage.getItem(tokenKey)
    token.value = saved && /^[a-f0-9]{64}$/.test(saved) ? saved : token.value
    nickname.value = localStorage.getItem(nameKey) || nickname.value
  } catch {
    persistent.value = false
  }
  if (!token.value) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    token.value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  try {
    localStorage.setItem(tokenKey, token.value)
    localStorage.setItem(nameKey, nickname.value)
  } catch {
    persistent.value = false
  }
}

watch(nickname, value => {
  try { localStorage.setItem(nameKey, value) } catch { persistent.value = false }
})

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token.value}`)
  if (options.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers, credentials: 'omit', signal: controller.signal })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || '评论服务暂不可用，请稍后再试。')
  return data as T
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.name === 'AbortError') return ''
  if (error instanceof TypeError) return '暂时无法连接评论服务，请检查网络后重试。'
  return error instanceof Error ? error.message : '操作没有完成，请稍后重试。'
}

async function loadComments(more = false) {
  if (submitting.value || deleting.value) return
  loading.value = true
  listError.value = ''
  try {
    const params = new URLSearchParams({ post: props.postPath })
    if (more && nextCursor.value) params.set('cursor', nextCursor.value)
    const data = await request<CommentPage>(`/api/comments?${params}`)
    comments.value = more ? [...comments.value, ...data.comments] : data.comments
    nextCursor.value = data.nextCursor
    total.value = data.total
    viewerId.value = data.viewer?.id || ''
  } catch (error) {
    listError.value = errorMessage(error)
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (submitting.value || loading.value || deleting.value) return
  formError.value = ''
  message.value = ''
  const name = nickname.value.trim()
  const text = content.value.trim()
  if (!name || name.length > 40 || !text || text.length > 3000) {
    formError.value = '请填写昵称和评论，昵称最多 40 字，评论最多 3000 字。'
    return
  }
  const signature = JSON.stringify([props.postPath, name, text])
  if (draftRequest?.signature !== signature) draftRequest = { id: crypto.randomUUID(), signature }
  submitting.value = true
  try {
    const data = await request<CreatedComment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ id: draftRequest.id, postPath: props.postPath, name, content: text, website: website.value }),
    })
    viewerId.value = data.viewer.id
    comments.value = [data.comment, ...comments.value.filter(comment => comment.id !== data.comment.id)]
      .map(comment => comment.authorId === data.viewer.id ? { ...comment, name: data.viewer.name } : comment)
    total.value = data.total
    nickname.value = data.viewer.name
    content.value = ''
    draftRequest = null
    message.value = '评论已发布。'
  } catch (error) {
    formError.value = errorMessage(error)
  } finally {
    submitting.value = false
  }
}

async function deleteComment(comment: CommentRecord) {
  if (deleting.value || loading.value || submitting.value || !window.confirm('确定删除这条评论吗？')) return
  deleting.value = comment.id
  formError.value = ''
  message.value = ''
  try {
    await request(`/api/comments/${comment.id}`, { method: 'DELETE' })
    comments.value = comments.value.filter(item => item.id !== comment.id)
    total.value = Math.max(0, total.value - 1)
    message.value = '评论已删除。'
  } catch (error) {
    formError.value = errorMessage(error)
  } finally {
    deleting.value = ''
  }
}

function avatarColor(id: string) {
  const colors = ['#525caa', '#227568', '#9a5139', '#72558e', '#366b96', '#8d4b6a']
  return colors[Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length]
}

function avatarLabel(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() || '访'
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

onMounted(async () => {
  initializeIdentity()
  await loadComments()
})
onBeforeUnmount(() => controller.abort())
</script>

<template>
  <section class="comments" aria-labelledby="comments-title">
    <div class="comments-heading">
      <h2 id="comments-title">评论 <span v-if="total" class="muted">{{ total }}</span></h2>
      <button type="button" class="text-button" :disabled="loading || submitting || !!deleting" @click="loadComments()">刷新</button>
    </div>

    <form class="comment-form" @submit.prevent="submitComment">
      <label for="comment-name">昵称</label>
      <input id="comment-name" v-model="nickname" name="nickname" maxlength="40" required autocomplete="nickname" placeholder="你希望显示的名字">
      <label for="comment-content">说点什么</label>
      <textarea id="comment-content" v-model="content" name="comment" rows="4" maxlength="3000" required placeholder="分享你的想法……" />
      <div class="comment-trap" aria-hidden="true">
        <label for="comment-website">请留空</label>
        <input id="comment-website" v-model="website" name="website" tabindex="-1" autocomplete="off">
      </div>
      <div class="form-actions">
        <span class="muted character-count">{{ content.length }} / 3000</span>
        <button type="submit" class="submit-button" :disabled="loading || submitting || !!deleting || !token || !content.trim()">
          {{ submitting ? '发布中……' : '发布评论' }}
        </button>
      </div>
      <div class="identity-note muted">
        无需登录。此浏览器会记住你的昵称和匿名身份；清除浏览数据或更换设备后，会视为新访客。
      </div>
      <div v-if="!persistent" class="identity-note muted">当前浏览器无法保存身份，本次访问仍可评论，刷新或关闭页面后将无法管理这些评论。</div>
      <div v-if="formError" class="comment-error" role="alert">{{ formError }}</div>
      <div v-if="message" class="comment-message" role="status">{{ message }}</div>
    </form>

    <div v-if="listError" class="comment-error" role="alert">
      {{ listError }} <button type="button" class="text-button" :disabled="loading" @click="loadComments()">重试</button>
    </div>
    <div v-if="loading && !comments.length" class="empty-comments muted" role="status">正在加载评论……</div>
    <div v-else-if="!comments.length && !listError" class="empty-comments muted">还没有评论，欢迎留下第一条想法。</div>

    <div class="comment-list" role="list">
      <article v-for="comment in comments" :key="comment.id" class="comment-item" role="listitem" :aria-label="`${comment.name}的评论`">
        <div class="comment-avatar" :style="{ backgroundColor: avatarColor(comment.authorId) }" aria-hidden="true">{{ avatarLabel(comment.name) }}</div>
        <div class="comment-main">
          <div class="comment-meta">
            <strong>{{ comment.name }}</strong>
            <span v-if="comment.authorId === viewerId" class="own-label muted">你</span>
            <time class="muted" :datetime="new Date(comment.createdAt).toISOString()">{{ formatDate(comment.createdAt) }}</time>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <button v-if="comment.authorId === viewerId" type="button" class="text-button delete-button" :disabled="!!deleting || submitting || loading" @click="deleteComment(comment)">
            {{ deleting === comment.id ? '删除中……' : '删除' }}
          </button>
        </div>
      </article>
    </div>
    <button v-if="nextCursor" type="button" class="load-more" :disabled="loading || submitting || !!deleting" @click="loadComments(true)">{{ loading ? '加载中……' : '加载更多评论' }}</button>
  </section>
</template>

<style scoped>
.comments {
  margin-bottom: 2rem;
  font-size: 1rem;
}

.comments-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.comments-heading h2 {
  margin: 0 0 1.25rem;
  font-size: 1.3rem;
}

.muted {
  opacity: 0.65;
}

.comment-form {
  display: grid;
  gap: 0.65rem;
}

.comment-form label {
  font-size: 0.9rem;
  font-weight: 600;
}

.comment-form input,
.comment-form textarea {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--common-bd);
  border-radius: var(--common-rd);
  background: var(--input-bg);
  color: var(--primary);
  font: inherit;
}

.comment-form input {
  max-width: 22rem;
  margin-bottom: 0.35rem;
}

.comment-form textarea {
  min-height: 8rem;
  resize: vertical;
}

.comments button {
  cursor: pointer;
}

.comment-form input:focus-visible,
.comment-form textarea:focus-visible,
.comments button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.character-count,
.identity-note {
  font-size: 0.8rem;
}

.submit-button,
.load-more {
  padding: 0.6rem 1rem;
  border-radius: var(--common-rd);
  background: var(--primary);
  color: var(--c-bg);
  font-weight: 600;
}

.comments button:disabled {
  cursor: default;
  opacity: 0.45;
}

.text-button {
  padding: 0.15rem 0;
  color: inherit;
  font-size: 0.85rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.comment-trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.comment-error,
.comment-message {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.comment-error {
  padding-left: 0.7rem;
  border-left: 3px solid #d76a56;
}

.empty-comments {
  padding: 2rem 0;
  font-size: 0.95rem;
}

.comment-list {
  margin-top: 1.5rem;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 1.3rem 0;
  border-top: 1px solid var(--common-bd);
}

.comment-avatar {
  display: flex;
  flex: 0 0 2.4rem;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  color: #fff;
  font-weight: 600;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem 0.6rem;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.comment-meta time {
  margin-left: auto;
  font-size: 0.75rem;
}

.own-label {
  font-size: 0.75rem;
}

.comment-content {
  margin-top: 0.4rem;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.delete-button {
  margin-top: 0.5rem;
  opacity: 0.65;
}

.load-more {
  display: block;
  margin: 1rem auto 0;
}
</style>
