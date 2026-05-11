import { useMemo, useState } from 'react'
import { requestPresignedUpload, saveUploadedFileMetadata } from '../lib/fileApi'
import { validateResearchFile } from '../lib/fileRules'
import '../styles/file-upload.css'

function FileUpload({ uploaderId = 'anonymous', onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const previewLabel = useMemo(() => {
    if (!selectedFile) {
      return 'No file selected yet.'
    }

    return `${selectedFile.name} • ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
  }, [selectedFile])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    const validationMessage = validateResearchFile(file)

    setSelectedFile(file)
    setError(validationMessage)
    setStatus('')
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!selectedFile) {
      setError('Choose a PDF, DOC, DOCX, PNG, or JPG file before uploading.')
      return
    }

    const validationMessage = validateResearchFile(selectedFile)

    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setIsUploading(true)
    setError('')
    setStatus('Requesting secure upload link...')

    try {
      const { uploadUrl, publicUrl, storageKey } = await requestPresignedUpload(selectedFile, uploaderId)

      setStatus('Uploading file...')

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      })

      if (!uploadResponse.ok) {
        throw new Error('Direct upload failed.')
      }

      await saveUploadedFileMetadata({
        url: publicUrl,
        filename: selectedFile.name,
        uploaderId,
        storageKey,
        contentType: selectedFile.type,
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      })

      setStatus('Upload complete.')
      setSelectedFile(null)
      event.target.reset()

      if (onUploaded) {
        onUploaded()
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed.')
      setStatus('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form className="upload-card" onSubmit={handleUpload}>
      <div className="upload-card__header">
        <div>
          <p className="upload-kicker">Research upload</p>
          <h2>Upload papers and media</h2>
        </div>
        <span className="upload-limit">PDF, DOC, DOCX, PNG, JPG up to 20MB</span>
      </div>

      <label className="upload-dropzone">
        <span className="upload-dropzone__title">Choose a file</span>
        <span className="upload-dropzone__hint">Files stay off your server and go straight to object storage.</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
          onChange={handleFileChange}
        />
      </label>

      <div className="upload-card__meta">
        <span>{previewLabel}</span>
        {status ? <span className="upload-state upload-state--info">{status}</span> : null}
        {error ? <span className="upload-state upload-state--error">{error}</span> : null}
      </div>

      <button className="upload-button" type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload file'}
      </button>
    </form>
  )
}

export default FileUpload