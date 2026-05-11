const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024
const accessKeyCache = new Map()

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
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

export default {
  async fetch(request, env) {
    const url = normalizeUrl(request.url)
    if (!url) {
      return jsonResponse({ message: 'Invalid request URL.' }, 400)
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
      if (!filename || !contentType || !Number.isFinite(size)) {
        return jsonResponse({ message: 'filename, contentType, and size are required.' }, 400)
      }

      if (!ALLOWED_MIME_TYPES.has(contentType)) {
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
      const token = await signUploadToken(env.UPLOAD_SIGNING_SECRET, key, contentType, expiresAt)

      return jsonResponse({
        uploadUrl: `/api/admin/uploads/object/${encodeURIComponent(key)}?expiresAt=${expiresAt}&token=${token}&contentType=${encodeURIComponent(contentType)}`,
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

      return new Response(null, { status: 204 })
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

      const object = await env.RESEARCH_BUCKET.get(key)
      if (!object) {
        return jsonResponse({ message: 'File not found.' }, 404)
      }

      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      headers.set('cache-control', 'public, max-age=300')
      headers.set('x-content-type-options', 'nosniff')

      return new Response(object.body, {
        status: 200,
        headers,
      })
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
        posts: postRows.results || [],
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
      const authorId = payload?.authorId ? String(payload.authorId) : 'host'

      if (!postType) {
        return jsonResponse({ message: 'postType must be article or blog.' }, 400)
      }

      if (!title) {
        return jsonResponse({ message: 'title is required.' }, 400)
      }

      if (postType === 'article' && !articleFileUrl) {
        return jsonResponse({ message: 'articleFileUrl is required for article posts.' }, 400)
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
            author_id,
            created_at,
            updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          authorId,
          new Date().toISOString(),
          new Date().toISOString()
        )
        .first()

      return jsonResponse({ post: result }, 201)
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
            author_id AS authorId,
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
            author_id AS authorId,
            created_at AS createdAt,
            updated_at AS updatedAt
           FROM posts
           WHERE status = 'published'
           ORDER BY created_at DESC
           LIMIT 100`

      const rows = typeFilter
        ? await env.DB.prepare(query).bind(typeFilter).all()
        : await env.DB.prepare(query).all()

      return jsonResponse({ posts: rows.results || [] })
    }

    return jsonResponse({ message: 'Not found' }, 404)
  },
}
