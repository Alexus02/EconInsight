export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx']

export function isAllowedFileType(file) {
  if (!file) {
    return false
  }

  return ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))
}

export function validateResearchFile(file) {
  if (!file) {
    return 'Choose a PDF, DOC, DOCX, PNG, or JPG file.'
  }

  if (!isAllowedFileType(file)) {
    return 'Only .pdf, .doc, .docx, .png, and .jpg files are allowed.'
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'Files must be 20MB or smaller.'
  }

  return ''
}