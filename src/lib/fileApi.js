const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const HOST_PORTAL_TOKEN = import.meta.env.VITE_HOST_PORTAL_TOKEN || ''

function withBase(path) {
  return `${API_BASE_URL}${path}`
}

function getHostHeaders() {
  if (!HOST_PORTAL_TOKEN) {
    return {}
  }

  return {
    'x-host-token': HOST_PORTAL_TOKEN,
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
      contentType: file.type,
      size: file.size,
      uploaderId,
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to create an upload link.')
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
    throw new Error('Unable to store uploaded file metadata.')
  }

  return response.json()
}

export async function fetchUploadedFiles() {
  const response = await fetch(withBase('/api/files'))

  if (!response.ok) {
    throw new Error('Unable to fetch uploaded files.')
  }

  return response.json()
}

export async function fetchAdminPosts() {
  const response = await fetch(withBase('/api/admin/posts'), {
    headers: {
      ...getHostHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error('Unable to load admin posts.')
  }

  return response.json()
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
    throw new Error('Unable to create post.')
  }

  return response.json()
}

export async function fetchPublishedPosts(type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  const response = await fetch(withBase(`/api/posts${query}`))

  if (!response.ok) {
    throw new Error('Unable to load posts.')
  }

  return response.json()
}