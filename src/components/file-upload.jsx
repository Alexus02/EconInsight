import { useMemo, useState, useEffect, useRef } from 'react'
import { requestPresignedUpload, saveUploadedFileMetadata } from '../lib/fileApi'
import { validateResearchFile } from '../lib/fileRules'
import PDFPreview from './pdf-preview'
import '../styles/file-upload.css'

function FileUpload({
  uploaderId = 'anonymous',
  onUploaded,
  label = 'Upload File',
  title = 'Upload files',
  kicker = 'Research upload',
  hint = 'Select files to upload to object storage.',
  badge = 'PDF, DOC, DOCX, PNG, JPG up to 20MB',
  variant = 'default',
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
}) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef(null)

  const previewLabel = useMemo(() => {
    if (selectedFiles.length === 0) {
      return 'No files selected yet.'
    }
    return `${selectedFiles.length} file(s) selected • ${(selectedFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total`
  }, [selectedFiles])

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    
    // Validate all files
    const errors = files
      .map(f => validateResearchFile(f))
      .filter(e => e)
    
    setSelectedFiles(files)
    setError(errors.length > 0 ? errors[0] : '')
    setStatus('')
  }

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviews([])
      return
    }

    const newPreviews = selectedFiles.map(file => {
      try {
        return URL.createObjectURL(file)
      } catch {
        return null
      }
    })
    
    setPreviews(newPreviews)
    
    return () => {
      newPreviews.forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [selectedFiles])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Choose a PDF, DOC, DOCX, PNG, or JPG file before uploading.')
      return
    }

    setIsUploading(true)
    setError('')
    setStatus(`Uploading ${selectedFiles.length} file(s)...`)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const selectedFile = selectedFiles[i]
        const validationMessage = validateResearchFile(selectedFile)

        if (validationMessage) {
          setError(`${selectedFile.name}: ${validationMessage}`)
          setIsUploading(false)
          return
        }

        setStatus(`Uploading ${i + 1} of ${selectedFiles.length}: ${selectedFile.name}...`)

        const { uploadUrl, publicUrl, storageKey } = await requestPresignedUpload(selectedFile, uploaderId)

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': selectedFile.type,
          },
          body: selectedFile,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Direct upload failed for ${selectedFile.name}.`)
        }

        const saved = await saveUploadedFileMetadata({
          url: publicUrl,
          filename: selectedFile.name,
          uploaderId,
          storageKey,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
          uploadedAt: new Date().toISOString(),
        })

        const savedFile = saved?.file || saved

        try {
          window.dispatchEvent(new CustomEvent('file:uploaded', { detail: savedFile }))
        } catch (e) {
          // no-op in non-browser environments
        }

        if (onUploaded) {
          try {
            onUploaded(savedFile)
          } catch (e) {
            onUploaded()
          }
        }
      }

      setStatus(`Successfully uploaded ${selectedFiles.length} file(s).`)
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed.')
      setStatus('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`upload-card upload-card--${variant}`}>
      <div className="upload-card__header">
        <div>
          <p className="upload-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <span className="upload-limit">{badge}</span>
      </div>

      <label className="upload-dropzone">
        <span className="upload-dropzone__title">Choose files</span>
        <span className="upload-dropzone__hint">{hint}</span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
        />
      </label>

      {previews.length > 0 ? (
        <div className="upload-preview">
          {previews.map((previewUrl, idx) => {
            const file = selectedFiles[idx]
            return (
              <div key={idx} className="upload-preview__item">
                {file?.type === 'application/pdf' ? (
                  <PDFPreview title={file.name} url={previewUrl} className="upload-preview__pdf" />
                ) : file && file.type.startsWith('image/') ? (
                  <img src={previewUrl} alt={file.name} className="upload-preview__image" />
                ) : (
                  <div className="upload-preview__fallback">
                    <p>{file?.name}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="upload-card__meta">
        <span>{previewLabel}</span>
        {status ? <span className="upload-state upload-state--info">{status}</span> : null}
        {error ? <span className="upload-state upload-state--error">{error}</span> : null}
      </div>

      <button className="upload-button" type="button" onClick={handleUpload} disabled={isUploading}>
        {isUploading ? 'Uploading...' : label}
      </button>
    </div>
  )
}

export default FileUpload