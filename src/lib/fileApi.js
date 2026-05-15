const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const HOST_PORTAL_TOKEN = import.meta.env.VITE_HOST_PORTAL_TOKEN || ''
const ADMIN_SESSION_STORAGE_KEY = 'econinsight.admin.session-token'

const MIME_TYPES_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function withBase(path) {
  return `${API_BASE_URL}${path}`
}

function toClientFileUrl(rawUrl) {
  if (!rawUrl) {
    return rawUrl
  }

  try {
    const parsed = new URL(String(rawUrl))
    const pathWithQuery = `${parsed.pathname}${parsed.search || ''}`
    if (pathWithQuery.startsWith('/api/files/object/')) {
      // During local development, force same-origin API path so Vite proxy handles it.
      return import.meta.env.DEV ? pathWithQuery : rawUrl
    }
  } catch {
    // keep original value if it is already relative or invalid URL
  }

  return rawUrl
}

function mapFileRecord(file) {
  if (!file) {
    return file
  }

  return {
    ...file,
    url: toClientFileUrl(file.url),
  }
}

function mapPostRecord(post) {
  if (!post) {
    return post
  }

  return {
    ...post,
    articleFileUrl: toClientFileUrl(post.articleFileUrl),
    coverImageUrl: toClientFileUrl(post.coverImageUrl),
    articleImageUrls: (post.articleImageUrls || []).map(toClientFileUrl),
  }
}

function getHostHeaders() {
  const sessionToken = typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) : ''

  if (sessionToken) {
    return {
      'x-admin-session-token': sessionToken,
    }
  }

  if (HOST_PORTAL_TOKEN) {
    return {
      'x-host-token': HOST_PORTAL_TOKEN,
    }
  }

  return {}
}

export function getStoredAdminSessionToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || ''
}

export function setStoredAdminSessionToken(sessionToken) {
  if (typeof window === 'undefined') {
    return
  }

  if (!sessionToken) {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, sessionToken)
}

export function clearStoredAdminSessionToken() {
  setStoredAdminSessionToken('')
}

function inferContentType(file) {
  if (!file) {
    return ''
  }

  if (file.type) {
    return file.type
  }

  const lowerName = file.name.toLowerCase()
  const matchedExtension = Object.keys(MIME_TYPES_BY_EXTENSION).find((extension) => lowerName.endsWith(extension))
  return matchedExtension ? MIME_TYPES_BY_EXTENSION[matchedExtension] : ''
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json()
    return data?.message || fallbackMessage
  } catch {
    try {
      const text = await response.text()
      return text || fallbackMessage
    } catch {
      return fallbackMessage
    }
  }
}

export async function recordView(resourceType, resourceId) {
  const response = await fetch(withBase('/api/views'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resourceType,
      resourceId,
    }),
  })

  if (!response.ok) {
    console.warn('Failed to record view:', response.statusText)
  }
}

export async function requestPresignedUpload(file, uploaderId) {
  const response = await fetch(withBase('/api/admin/uploads/presign'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHostHeaders(),
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: inferContentType(file),
      size: file.size,
      uploaderId,
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to create an upload link.'))
  }

  const data = await response.json()

  if (data?.uploadUrl?.startsWith('/')) {
    return {
      ...data,
      uploadUrl: withBase(data.uploadUrl),
    }
  }

  return data
}

export async function saveUploadedFileMetadata(metadata) {
  const response = await fetch(withBase('/api/files'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHostHeaders(),
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to store uploaded file metadata.'))
  }

  const data = await response.json()
  if (!data?.file) {
    return data
  }

  return {
    ...data,
    file: mapFileRecord(data.file),
  }
}

export async function fetchUploadedFiles() {
  const response = await fetch(withBase('/api/files'))

  if (!response.ok) {
    throw new Error('Unable to fetch uploaded files.')
  }

  const data = await response.json()
  const files = Array.isArray(data) ? data : data.files || []
  const mappedFiles = files.map(mapFileRecord)

  return Array.isArray(data)
    ? mappedFiles
    : {
        ...data,
        files: mappedFiles,
      }
}

export async function fetchAdminPosts() {
  const headers = {
    ...getHostHeaders(),
  }
  console.log('📤 Fetching admin posts with headers:', headers)
  
  const response = await fetch(withBase('/api/admin/posts'), {
    headers,
  })

  if (!response.ok) {
    console.error('❌ Admin posts fetch failed:', response.status, response.statusText)
    throw new Error(await readErrorMessage(response, 'Unable to load admin posts.'))
  }

  const data = await response.json()
  return {
    ...data,
    posts: (data.posts || []).map(mapPostRecord),
  }
}

export async function createPost(payload) {
  const response = await fetch(withBase('/api/admin/posts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHostHeaders(),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to create post.'))
  }

  const data = await response.json()
  if (!data?.post) {
    return data
  }

  return {
    ...data,
    post: mapPostRecord(data.post),
  }
}

export async function fetchPublishedPosts(type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  const response = await fetch(withBase(`/api/posts${query}`))

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to load posts.'))
  }

  const data = await response.json()
  return {
    ...data,
    posts: (data.posts || []).map(mapPostRecord),
  }
}

export async function fetchPublishedPostById(postId) {
  const data = await fetchPublishedPosts()
  const posts = data.posts || []
  return posts.find((post) => String(post.id) === String(postId)) || null
}

export async function fetchPublishedArticleByStorageKey(storageKey) {
  const data = await fetchPublishedPosts('article')
  const posts = data.posts || []
  let decodedStorageKey = storageKey

  try {
    decodedStorageKey = decodeURIComponent(storageKey)
  } catch {
    decodedStorageKey = storageKey
  }

  return (
    posts.find((post) => String(post.articleStorageKey || '') === decodedStorageKey) ||
    posts.find((post) => String(post.articleFileUrl || '') === decodedStorageKey) ||
    null
  )
}

export async function updatePost(postId, payload) {
  const response = await fetch(withBase(`/api/admin/posts/${encodeURIComponent(postId)}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHostHeaders(),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to update post.'))
  }

  const data = await response.json()
  if (!data?.post) return data
  return { ...data, post: mapPostRecord(data.post) }
}

export async function deletePost(postId) {
  const response = await fetch(withBase(`/api/admin/posts/${encodeURIComponent(postId)}`), {
    method: 'DELETE',
    headers: {
      ...getHostHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to delete post.'))
  }

  const data = await response.json()
  return data
}

export async function loginAdmin(email, secretKey) {
  const response = await fetch(withBase('/api/admin/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, secretKey }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to sign in.'))
  }

  const data = await response.json()
  if (data?.sessionToken) {
    setStoredAdminSessionToken(data.sessionToken)
  }

  return data
}

export async function fetchCurrentAdmin() {
  const sessionToken = getStoredAdminSessionToken()
  if (!sessionToken) {
    return null
  }

  const response = await fetch(withBase('/api/admin/auth/me'), {
    headers: {
      'x-admin-session-token': sessionToken,
    },
  })

  if (!response.ok) {
    clearStoredAdminSessionToken()
    return null
  }

  const data = await response.json()
  return data?.adminUser || null
}

export async function fetchAdminUsers() {
  const response = await fetch(withBase('/api/admin/users'), {
    headers: {
      ...getHostHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to load admin users.'))
  }

  const data = await response.json()
  return data
}

export async function deleteAdminUser(userId) {
  const response = await fetch(withBase(`/api/admin/users/${encodeURIComponent(userId)}`), {
    method: 'DELETE',
    headers: {
      ...getHostHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to delete admin user.'))
  }

  const data = await response.json()
  return data
}

export async function upsertAdminUser(email, secretKey) {
  const response = await fetch(withBase('/api/admin/users'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHostHeaders(),
    },
    body: JSON.stringify({ email, secretKey }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to save admin user.'))
  }

  return response.json()
}