import { useEffect, useState } from 'react'
import { fetchUploadedFiles } from '../lib/fileApi'
import '../styles/file-viewer.css'

function FileViewer() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadFiles() {
      try {
        const data = await fetchUploadedFiles()

        if (active) {
          setFiles(Array.isArray(data) ? data : data.files || [])
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load files.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadFiles()

    return () => {
      active = false
    }
  }, [])

  const isPdf = (file) => file.contentType === 'application/pdf'
  const isImage = (file) => ['image/png', 'image/jpeg'].includes(file.contentType)

  return (
    <section className="viewer-card">
      <div className="viewer-card__header">
        <div>
          <p className="viewer-kicker">Viewer</p>
          <h2>Recently uploaded files</h2>
        </div>
      </div>

      {isLoading ? <p className="viewer-state">Loading files...</p> : null}
      {error ? <p className="viewer-state viewer-state--error">{error}</p> : null}

      {!isLoading && !error && files.length === 0 ? (
        <p className="viewer-state">No files uploaded yet.</p>
      ) : null}

      <div className="viewer-grid">
        {files.map((file) => (
          <article key={file.id || file.url || file.filename} className="viewer-item">
            <div className="viewer-item__preview">
              {isPdf(file) ? (
                <iframe title={file.filename} src={file.url} />
              ) : isImage(file) ? (
                <img src={file.url} alt={file.filename} />
              ) : (
                <div className="viewer-file-fallback">
                  <span>DOC</span>
                </div>
              )}
            </div>
            <div className="viewer-item__body">
              <h3>{file.filename}</h3>
              <p>{file.uploaderId ? `Uploaded by ${file.uploaderId}` : 'Uploaded file'}</p>
              <a href={file.url} target="_blank" rel="noreferrer">
                Open file
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FileViewer