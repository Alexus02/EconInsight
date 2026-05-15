const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024
const accessKeyCache = new Map()

const CORS_HEADERS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-host-token, x-admin-session-token, cf-access-jwt-assertion',
      'Access-Control-Max-Age': '86400',
}

const ADMIN_SESSION_DAYS = 30
const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com'
const DEFAULT_ADMIN_SECRET = 'alex@1234'
let adminAuthBootstrapPromise = null

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

function normalizeUrl(rawUrl) {
  try {
    return new URL(rawUrl)
  } catch {
    return null
  }
}

function sanitizeFileName(filename) {
  return String(filename || 'file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase()
}

function inferContentType(filename, explicitContentType) {
  if (explicitContentType) {
    return explicitContentType
  }

  const lowerName = String(filename || '').toLowerCase()
  if (lowerName.endsWith('.pdf')) return 'application/pdf'
  if (lowerName.endsWith('.png')) return 'image/png'
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg'
  if (lowerName.endsWith('.doc')) return 'application/msword'
  if (lowerName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return ''
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

function parseJwt(token) {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('JWT must have three parts.')
  }

  const header = JSON.parse(decodeBase64Url(parts[0]))
  const payload = JSON.parse(decodeBase64Url(parts[1]))
  const signatureBytes = Uint8Array.from(decodeBase64Url(parts[2]), (char) => char.charCodeAt(0))
  const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)

  return { header, payload, signatureBytes, signedContent }
}

async function importSpkiKey(spkiPem) {
  const body = spkiPem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')
  const binary = Uint8Array.from(atob(body), (char) => char.charCodeAt(0))
  return crypto.subtle.importKey(
    'spki',
    binary.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

async function getAccessPublicKey(env, kid) {
  if (!env.CF_ACCESS_TEAM_DOMAIN) {
    return null
  }

  const cached = accessKeyCache.get(kid)
  if (cached) {
    return cached
  }

  const certsUrl = `https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`
  const certsResponse = await fetch(certsUrl)
  if (!certsResponse.ok) {
    throw new Error('Failed to fetch Cloudflare Access certificates.')
  }

  const certs = await certsResponse.json()
  const keyEntry = certs?.keys?.find((item) => item.kid === kid && item.cert)
  if (!keyEntry) {
    throw new Error('No matching Access certificate key found.')
  }

  const cryptoKey = await importSpkiKey(keyEntry.cert)
  accessKeyCache.set(kid, cryptoKey)
  return cryptoKey
}

function isExpectedAudience(claimAud, expectedAud) {
  if (!expectedAud) {
    return true
  }

  if (Array.isArray(claimAud)) {
    return claimAud.includes(expectedAud)
  }

  return claimAud === expectedAud
}

async function isHostRequest(request, env) {
  const fallbackToken = env.HOST_PORTAL_TOKEN
  if (fallbackToken && request.headers.get('x-host-token') === fallbackToken) {
    return true
  }

  const sessionToken = request.headers.get('x-admin-session-token')
  if (sessionToken && (await getAdminUserBySessionToken(env, sessionToken))) {
    return true
  }

  const jwtAssertion = request.headers.get('cf-access-jwt-assertion')
  if (!jwtAssertion || !env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUDIENCE) {
    return false
  }

  try {
    const { header, payload, signatureBytes, signedContent } = parseJwt(jwtAssertion)
    const key = await getAccessPublicKey(env, header.kid)
    if (!key) {
      return false
    }

    const isValidSignature = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signatureBytes,
      signedContent
    )
    if (!isValidSignature) {
      return false
    }

    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (payload.exp && nowInSeconds >= payload.exp) {
      return false
    }

    if (!isExpectedAudience(payload.aud, env.CF_ACCESS_AUDIENCE)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

async function digestHmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomHex(bytes = 16) {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return [...array].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashAdminSecret(secretKey, salt) {
  return sha256Hex(`${salt}:${String(secretKey || '')}`)
}

async function ensureAdminAuthSchema(env) {
  if (!adminAuthBootstrapPromise) {
    adminAuthBootstrapPromise = (async () => {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          secret_salt TEXT NOT NULL,
          secret_hash TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_user_id INTEGER NOT NULL,
          session_token TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT NOT NULL,
          FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
        )
      `).run()

      const defaultAdmin = await env.DB.prepare(`SELECT id FROM admin_users WHERE email = ?`).bind(DEFAULT_ADMIN_EMAIL).first()
      if (!defaultAdmin) {
        const salt = randomHex(16)
        const hash = await hashAdminSecret(DEFAULT_ADMIN_SECRET, salt)
        const now = new Date().toISOString()
        await env.DB.prepare(
          `INSERT INTO admin_users (email, secret_salt, secret_hash, is_active, created_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?)`
        )
          .bind(DEFAULT_ADMIN_EMAIL, salt, hash, now, now)
          .run()
      }
    })().catch((error) => {
      adminAuthBootstrapPromise = null
      throw error
    })
  }

  return adminAuthBootstrapPromise
}

async function getAdminUserBySessionToken(env, sessionToken) {
  if (!sessionToken) {
    return null
  }

  await ensureAdminAuthSchema(env)

  const row = await env.DB.prepare(
    `SELECT
        s.session_token AS sessionToken,
        s.expires_at AS expiresAt,
        u.id,
        u.email,
        u.is_active AS isActive,
        u.created_at AS createdAt,
        u.updated_at AS updatedAt
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.session_token = ?`
  ).bind(sessionToken).first()

  if (!row || !row.isActive) {
    return null
  }

  if (row.expiresAt && new Date(row.expiresAt).getTime() <= Date.now()) {
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE session_token = ?`).bind(sessionToken).run()
    return null
  }

  await env.DB.prepare(`UPDATE admin_sessions SET last_used_at = ? WHERE session_token = ?`)
    .bind(new Date().toISOString(), sessionToken)
    .run()

  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function createAdminSession(env, adminUserId) {
  await ensureAdminAuthSchema(env)

  const sessionToken = randomHex(32)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await env.DB.prepare(
    `INSERT INTO admin_sessions (admin_user_id, session_token, created_at, last_used_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(adminUserId, sessionToken, now, now, expiresAt)
    .run()

  return { sessionToken, expiresAt }
}

async function upsertAdminUser(env, email, secretKey) {
  await ensureAdminAuthSchema(env)

  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail || !secretKey) {
    throw new Error('email and secretKey are required.')
  }

  const salt = randomHex(16)
  const hash = await hashAdminSecret(secretKey, salt)
  const now = new Date().toISOString()

  const existing = await env.DB.prepare(`SELECT id FROM admin_users WHERE email = ?`).bind(normalizedEmail).first()

  if (existing) {
    await env.DB.prepare(
      `UPDATE admin_users
       SET secret_salt = ?, secret_hash = ?, is_active = 1, updated_at = ?
       WHERE email = ?`
    ).bind(salt, hash, now, normalizedEmail).run()

    await env.DB.prepare(`DELETE FROM admin_sessions WHERE admin_user_id = ?`).bind(existing.id).run()
    return { id: existing.id, email: normalizedEmail, updatedAt: now }
  }

  return env.DB.prepare(
    `INSERT INTO admin_users (email, secret_salt, secret_hash, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)
     RETURNING id, email, created_at AS createdAt, updated_at AS updatedAt`
  )
    .bind(normalizedEmail, salt, hash, now, now)
    .first()
}

async function authenticateAdminCredentials(env, email, secretKey) {
  await ensureAdminAuthSchema(env)

  const normalizedEmail = String(email || '').trim().toLowerCase()
  const row = await env.DB.prepare(
    `SELECT id, email, secret_salt AS secretSalt, secret_hash AS secretHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
     FROM admin_users
     WHERE email = ?`
  ).bind(normalizedEmail).first()

  if (!row || !row.isActive) {
    return null
  }

  const computedHash = await hashAdminSecret(secretKey, row.secretSalt)
  if (computedHash !== row.secretHash) {
    return null
  }

  return { id: row.id, email: row.email, createdAt: row.createdAt, updatedAt: row.updatedAt }
}

async function signUploadToken(secret, key, contentType, expiresAt) {
  const payload = `${key}:${contentType}:${expiresAt}`
  return digestHmac(secret, payload)
}

function toPublicFileUrl(requestUrl, env, key) {
  if (env.R2_PUBLIC_BASE_URL) {
    return `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`
  }

  return `${requestUrl.origin}/api/files/object/${encodeURIComponent(key)}`
}

function normalizePostType(postType) {
  return postType === 'article' || postType === 'blog' ? postType : null
}

function normalizePostStatus(status) {
  return status === 'published' ? 'published' : 'draft'
}

function normalizeArticleLayout(layout) {
  if (!layout || layout === 'default') {
    return 'single-column'
  }

  return ['single-column', 'two-columns', 'paginated', 'carousel'].includes(layout)
    ? layout
    : 'single-column'
}

function parseJsonArray(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String)
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []
  } catch {
    return []
  }
}

function mapPostRow(row) {
  if (!row) {
    return row
  }

  return {
    ...row,
    articleImageUrls: parseJsonArray(row.articleImageUrls),
  }
}

async function recordView(env, resourceType, resourceId) {
  const table = resourceType === 'post' ? 'posts' : 'uploaded_files'
  if (!env.VIEWS_KV) {
    await env.DB.prepare(`UPDATE ${table} SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`).bind(resourceId).run()
    return
  }

  const key = `view:${resourceType}:${resourceId}`
  const current = await env.VIEWS_KV.get(key)
  const count = current ? parseInt(current, 10) + 1 : 1
  await env.VIEWS_KV.put(key, String(count))

  // Keep D1 in sync even when KV is enabled.
  await env.DB.prepare(`UPDATE ${table} SET view_count = ? WHERE id = ?`).bind(count, resourceId).run()
}

async function syncViewsToDatabase(env) {
  if (!env.VIEWS_KV) {
    return
  }

  const keys = await env.VIEWS_KV.list()
  const updates = []

  for (const { name } of keys.keys) {
    const viewCount = await env.VIEWS_KV.get(name)
    const [, resourceType, resourceId] = name.split(':')

    if (!resourceType || !resourceId || !viewCount) {
      continue
    }

    updates.push({ key: name, resourceType, resourceId, count: parseInt(viewCount, 10) })
  }

  if (updates.length === 0) {
    return
  }

  for (const update of updates) {
    const table = update.resourceType === 'post' ? 'posts' : 'uploaded_files'
    const idColumn = update.resourceType === 'post' ? 'id' : 'id'
    const whereColumn = update.resourceType === 'post' ? 'id' : 'id'

    await env.DB.prepare(
      `UPDATE ${table}
       SET view_count = ?
       WHERE ${whereColumn} = ?`
    )
      .bind(update.count, parseInt(update.resourceId, 10))
      .run()
  }
}

export default {
  async fetch(request, env) {
    const url = normalizeUrl(request.url)
    if (!url) {
      return jsonResponse({ message: 'Invalid request URL.' }, 400)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/auth/login') {
      await ensureAdminAuthSchema(env)

      let payload = {}
      try {
        payload = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      const email = String(payload?.email || '').trim().toLowerCase()
      const secretKey = String(payload?.secretKey || '')

      if (!email || !secretKey) {
        return jsonResponse({ message: 'email and secretKey are required.' }, 400)
      }

      const adminUser = await authenticateAdminCredentials(env, email, secretKey)
      if (!adminUser) {
        return jsonResponse({ message: 'Invalid email or secret key.' }, 401)
      }

      const session = await createAdminSession(env, adminUser.id)
      return jsonResponse({
        adminUser,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
      })
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/auth/me') {
      const sessionToken = request.headers.get('x-admin-session-token')
      const adminUser = await getAdminUserBySessionToken(env, sessionToken)

      if (!adminUser) {
        return jsonResponse({ message: 'Unauthorized' }, 401)
      }

      return jsonResponse({ adminUser })
    }

    if (url.pathname === '/api/admin/users' && request.method === 'GET') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      await ensureAdminAuthSchema(env)
      const rows = await env.DB.prepare(
        `SELECT id, email, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
         FROM admin_users
         ORDER BY created_at DESC`
      ).all()

      return jsonResponse({ users: rows.results || [] })
    }

    if (url.pathname === '/api/admin/users' && request.method === 'POST') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      let payload = {}
      try {
        payload = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      if (!payload?.email || !payload?.secretKey) {
        return jsonResponse({ message: 'email and secretKey are required.' }, 400)
      }

      const user = await upsertAdminUser(env, payload.email, payload.secretKey)
      return jsonResponse({ user }, 201)
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/api/admin/users/')) {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      const idStr = decodeURIComponent(url.pathname.replace('/api/admin/users/', ''))
      const userId = Number(idStr)
      if (!Number.isFinite(userId)) {
        return jsonResponse({ message: 'Invalid user id.' }, 400)
      }

      await ensureAdminAuthSchema(env)
      await env.DB.prepare(`DELETE FROM admin_users WHERE id = ?`).bind(userId).run()
      return jsonResponse({ success: true })
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/uploads/presign') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      let body
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      const { filename, contentType, size, uploaderId } = body || {}
      const resolvedContentType = inferContentType(filename, contentType)
      if (!filename || !resolvedContentType || !Number.isFinite(size)) {
        return jsonResponse({ message: 'filename, contentType, and size are required.' }, 400)
      }

      if (!ALLOWED_MIME_TYPES.has(resolvedContentType)) {
        return jsonResponse({ message: 'Only PDF, DOC, DOCX, PNG, and JPG files are allowed.' }, 400)
      }

      if (size > MAX_UPLOAD_SIZE_BYTES) {
        return jsonResponse({ message: 'Files must be 20MB or smaller.' }, 400)
      }

      if (!env.UPLOAD_SIGNING_SECRET) {
        return jsonResponse({ message: 'UPLOAD_SIGNING_SECRET is missing.' }, 500)
      }

      const safeName = sanitizeFileName(filename)
      const key = `research-files/${uploaderId || 'anonymous'}/${Date.now()}-${safeName}`
      const expiresAt = Date.now() + 5 * 60 * 1000
      const token = await signUploadToken(env.UPLOAD_SIGNING_SECRET, key, resolvedContentType, expiresAt)

      return jsonResponse({
        uploadUrl: `/api/admin/uploads/object/${encodeURIComponent(key)}?expiresAt=${expiresAt}&token=${token}&contentType=${encodeURIComponent(resolvedContentType)}`,
        publicUrl: toPublicFileUrl(url, env, key),
        storageKey: key,
        expiresIn: 300,
      })
    }

    if (request.method === 'PUT' && url.pathname.startsWith('/api/admin/uploads/object/')) {
      const key = decodeURIComponent(url.pathname.replace('/api/admin/uploads/object/', ''))
      const expiresAt = Number(url.searchParams.get('expiresAt') || 0)
      const token = url.searchParams.get('token') || ''
      const contentType = url.searchParams.get('contentType') || ''
      const expectedToken = await signUploadToken(env.UPLOAD_SIGNING_SECRET || '', key, contentType, expiresAt)

      if (!expiresAt || Date.now() > expiresAt || !token || token !== expectedToken) {
        return jsonResponse({ message: 'Upload link expired or invalid.' }, 403)
      }

      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        return jsonResponse({ message: 'Invalid content type.' }, 400)
      }

      await env.RESEARCH_BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType,
        },
      })

      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/files') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      let payload
      try {
        payload = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      const {
        url: fileUrl,
        filename,
        uploaderId = 'anonymous',
        storageKey,
        contentType = null,
        fileSize = null,
        uploadedAt = new Date().toISOString(),
      } = payload || {}

      if (!fileUrl || !filename || !storageKey) {
        return jsonResponse({ message: 'url, filename, and storageKey are required.' }, 400)
      }

      const result = await env.DB.prepare(
        `INSERT INTO uploaded_files (url, filename, uploader_id, storage_key, content_type, file_size, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id, url, filename, uploader_id AS uploaderId, storage_key AS storageKey, content_type AS contentType, file_size AS fileSize, uploaded_at AS uploadedAt`
      )
        .bind(fileUrl, filename, uploaderId, storageKey, contentType, fileSize, uploadedAt)
        .first()

      return jsonResponse({ file: result }, 201)
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/files/object/')) {
      const key = decodeURIComponent(url.pathname.replace('/api/files/object/', ''))
      if (!key) {
        return jsonResponse({ message: 'Missing object key.' }, 400)
      }

      // Record view for file access
      const storageKeyMatch = await env.DB.prepare(
        'SELECT id FROM uploaded_files WHERE storage_key = ?'
      )
        .bind(key)
        .first()

      if (storageKeyMatch) {
        await recordView(env, 'file', String(storageKeyMatch.id))
      }

      const object = await env.RESEARCH_BUCKET.get(key)
      if (!object) {
        return jsonResponse({ message: 'File not found.' }, 404)
      }

      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      headers.set('cache-control', 'public, max-age=300')
      headers.set('x-content-type-options', 'nosniff')
      headers.set('Access-Control-Allow-Origin', CORS_HEADERS['Access-Control-Allow-Origin'])
      headers.set('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods'])
      headers.set('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers'])
      headers.set('Access-Control-Max-Age', CORS_HEADERS['Access-Control-Max-Age'])

      return new Response(object.body, {
        status: 200,
        headers,
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/views') {
      let payload
      try {
        payload = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      const { resourceType, resourceId } = payload || {}

      if (!resourceType || !resourceId) {
        return jsonResponse({ message: 'resourceType and resourceId are required.' }, 400)
      }

      if (!['post', 'file'].includes(resourceType)) {
        return jsonResponse({ message: 'resourceType must be post or file.' }, 400)
      }

      await recordView(env, resourceType, resourceId)
      return jsonResponse({ message: 'View recorded.' })
    }

    if (request.method === 'GET' && url.pathname === '/api/files') {
      const rows = await env.DB.prepare(
        `SELECT
            id,
            url,
            filename,
            uploader_id AS uploaderId,
            storage_key AS storageKey,
            content_type AS contentType,
            file_size AS fileSize,
            view_count AS viewCount,
            uploaded_at AS uploadedAt
         FROM uploaded_files
         ORDER BY uploaded_at DESC
         LIMIT 50`
      ).all()

      return jsonResponse({ files: rows.results || [] })
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/posts') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      const postRows = await env.DB.prepare(
        `SELECT
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
            author_id AS authorId,
            view_count AS viewCount,
            created_at AS createdAt,
            updated_at AS updatedAt
         FROM posts
         ORDER BY created_at DESC
         LIMIT 100`
      ).all()

      const statsRows = await env.DB.prepare(
        `SELECT post_type AS postType, status, COUNT(*) AS total
         FROM posts
         GROUP BY post_type, status`
      ).all()

      const stats = {
        totalPosts: 0,
        blogPosts: 0,
        articlePosts: 0,
        drafts: 0,
      }

      for (const row of statsRows.results || []) {
        const count = Number(row.total || 0)
        stats.totalPosts += count
        if (row.postType === 'blog') {
          stats.blogPosts += count
        }
        if (row.postType === 'article') {
          stats.articlePosts += count
        }
        if (row.status === 'draft') {
          stats.drafts += count
        }
      }

      return jsonResponse({
        posts: (postRows.results || []).map(mapPostRow),
        stats,
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/posts') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      let payload
      try {
        payload = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      const postType = normalizePostType(payload?.postType)
      const title = String(payload?.title || '').trim()
      const excerpt = String(payload?.excerpt || '').trim()
      const content = String(payload?.content || '').trim()
      const status = normalizePostStatus(payload?.status)
      const articleFileUrl = payload?.articleFileUrl ? String(payload.articleFileUrl) : null
      const articleStorageKey = payload?.articleStorageKey ? String(payload.articleStorageKey) : null
      const coverImageUrl = payload?.coverImageUrl ? String(payload.coverImageUrl) : null
      const articleLayout = normalizeArticleLayout(payload?.articleLayout)
      const articleImageUrls = parseJsonArray(payload?.articleImageUrls)
      const authorId = payload?.authorId ? String(payload.authorId) : 'host'

      if (!postType) {
        return jsonResponse({ message: 'postType must be article or blog.' }, 400)
      }

      if (!title) {
        return jsonResponse({ message: 'title is required.' }, 400)
      }

      const result = await env.DB.prepare(
        `INSERT INTO posts (
            post_type,
            title,
            excerpt,
            content,
            status,
            article_file_url,
            article_storage_key,
            cover_image_url,
            article_layout,
            article_image_urls,
            author_id,
            created_at,
            updated_at
         )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
              article_layout AS articleLayout,
              article_image_urls AS articleImageUrls,
            author_id AS authorId,
            created_at AS createdAt,
            updated_at AS updatedAt`
      )
        .bind(
          postType,
          title,
          excerpt || null,
          content || null,
          status,
          articleFileUrl,
          articleStorageKey,
          coverImageUrl,
          articleLayout,
          JSON.stringify(articleImageUrls),
          authorId,
          new Date().toISOString(),
          new Date().toISOString()
        )
        .first()

      return jsonResponse({ post: mapPostRow(result) }, 201)
    }

    // Update post
    if (request.method === 'PUT' && url.pathname.startsWith('/api/admin/posts/')) {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      const id = Number(url.pathname.replace('/api/admin/posts/', ''))
      if (!id) return jsonResponse({ message: 'Invalid post id' }, 400)

      let payload = {}
      try {
        payload = await request.json()
      } catch {
        return jsonResponse({ message: 'Invalid JSON body.' }, 400)
      }

      const postType = normalizePostType(payload?.postType)
      const title = String(payload?.title || '').trim()
      const excerpt = String(payload?.excerpt || '').trim()
      const content = String(payload?.content || '').trim()
      const status = normalizePostStatus(payload?.status)
      const articleFileUrl = payload?.articleFileUrl ? String(payload.articleFileUrl) : null
      const articleStorageKey = payload?.articleStorageKey ? String(payload.articleStorageKey) : null
      const coverImageUrl = payload?.coverImageUrl ? String(payload.coverImageUrl) : null
      const articleLayout = normalizeArticleLayout(payload?.articleLayout)
      const articleImageUrls = parseJsonArray(payload?.articleImageUrls)

      if (!postType) {
        return jsonResponse({ message: 'postType must be article or blog.' }, 400)
      }

      if (!title) {
        return jsonResponse({ message: 'title is required.' }, 400)
      }

      await env.DB.prepare(
        `UPDATE posts SET
           post_type = ?, title = ?, excerpt = ?, content = ?, status = ?,
           article_file_url = ?, article_storage_key = ?, cover_image_url = ?,
           article_layout = ?, article_image_urls = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          postType,
          title,
          excerpt || null,
          content || null,
          status,
          articleFileUrl,
          articleStorageKey,
          coverImageUrl,
          articleLayout,
          JSON.stringify(articleImageUrls),
          new Date().toISOString(),
          id
        )
        .run()

      const updated = await env.DB.prepare(
        `SELECT id, post_type AS postType, title, excerpt, content, status, article_file_url AS articleFileUrl, article_storage_key AS articleStorageKey, cover_image_url AS coverImageUrl, article_layout AS articleLayout, article_image_urls AS articleImageUrls, author_id AS authorId, view_count AS viewCount, created_at AS createdAt, updated_at AS updatedAt FROM posts WHERE id = ?`
      ).bind(id).first()

      return jsonResponse({ post: mapPostRow(updated) })
    }

    // Delete post
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/admin/posts/')) {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      const id = Number(url.pathname.replace('/api/admin/posts/', ''))
      if (!id) return jsonResponse({ message: 'Invalid post id' }, 400)

      await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run()
      return jsonResponse({ message: 'Deleted' })
    }

    if (request.method === 'GET' && url.pathname === '/api/posts') {
      const typeFilter = normalizePostType(url.searchParams.get('type'))
      const query = typeFilter
        ? `SELECT
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
            article_layout AS articleLayout,
            article_image_urls AS articleImageUrls,
            author_id AS authorId,
            view_count AS viewCount,
            created_at AS createdAt,
            updated_at AS updatedAt
           FROM posts
           WHERE status = 'published' AND post_type = ?
           ORDER BY created_at DESC
           LIMIT 100`
        : `SELECT
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
            article_layout AS articleLayout,
            article_image_urls AS articleImageUrls,
            author_id AS authorId,
            view_count AS viewCount,
            created_at AS createdAt,
            updated_at AS updatedAt
           FROM posts
           WHERE status = 'published'
           ORDER BY created_at DESC
           LIMIT 100`

      const rows = typeFilter
        ? await env.DB.prepare(query).bind(typeFilter).all()
        : await env.DB.prepare(query).all()

      return jsonResponse({ posts: (rows.results || []).map(mapPostRow) })
    }

    // Analytics snapshots
    if (url.pathname === '/api/analytics/snapshots' && request.method === 'POST') {
      if (!(await isHostRequest(request, env))) {
        return jsonResponse({ message: 'Forbidden' }, 403)
      }

      let body = {}
      try {
        body = await request.json()
      } catch {
        // ignore
      }

      const dateParam = body?.date || new Date().toISOString().slice(0, 10)

      // Compute total views across posts and files
      const totalViewsRow = await env.DB.prepare(`SELECT SUM(COALESCE(view_count,0)) AS total FROM posts`).first()
      const fileViewsRow = await env.DB.prepare(`SELECT SUM(COALESCE(view_count,0)) AS total FROM uploaded_files`).first()
      const totalViews = (Number(totalViewsRow?.total || 0) + Number(fileViewsRow?.total || 0)) || 0

      // Compute new posts for the day
      const newPostsRow = await env.DB.prepare(
        `SELECT COUNT(*) AS total FROM posts WHERE date(created_at) = ?`
      ).bind(dateParam).first()
      const newPosts = Number(newPostsRow?.total || 0)

      await env.DB.prepare(
        `INSERT INTO analytics_snapshots (date, total_views, new_posts, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET total_views = excluded.total_views, new_posts = excluded.new_posts`
      )
        .bind(dateParam, totalViews, newPosts, new Date().toISOString())
        .run()

      const inserted = await env.DB.prepare(`SELECT date, total_views AS totalViews, new_posts AS newPosts FROM analytics_snapshots WHERE date = ?`).bind(dateParam).first()
      return jsonResponse({ snapshot: inserted || { date: dateParam, totalViews, newPosts } })
    }

    if (url.pathname === '/api/analytics/snapshots' && request.method === 'GET') {
      const days = Number(url.searchParams.get('days') || 30)
      const rows = await env.DB.prepare(
        `SELECT date, total_views AS totalViews, new_posts AS newPosts
         FROM analytics_snapshots
         ORDER BY date DESC
         LIMIT ?`
      ).bind(days).all()

      const results = (rows.results || []).map((r) => ({ date: r.date, totalViews: Number(r.totalViews || 0), newPosts: Number(r.newPosts || 0) }))
      return jsonResponse({ snapshots: results })
    }

    return jsonResponse({ message: 'Not found' }, 404)
  },

  async scheduled(event, env) {
    await syncViewsToDatabase(env)
  },
}
