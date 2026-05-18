import React, { useState } from 'react'
import '../styles/pdf-actions.css'

export default function PdfActionsCard({ pdfUrl, fileName = 'document.pdf', title }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  // Robust download: fetch the file as a blob and trigger a programmatic download.
  // This ensures the correct filename is used even when cross-origin `download`
  // attributes would otherwise be ignored by the browser.
  const handleDownload = async () => {
    setError(null)
    setDownloading(true)
    try {
      const resp = await fetch(pdfUrl, { mode: 'cors' })
      if (!resp.ok) throw new Error(`Network response was ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      // ensure the anchor is in the document so Firefox can click it
      document.body.appendChild(a)
      a.click()
      a.remove()
      // free memory after short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
    } catch (err) {
      console.error('Download failed', err)
      setError('Download failed — opening in new tab as fallback.')
      // Fallback: open in new tab so the user can save manually
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="pdf-card">
      <div className="pdf-card-info">
        <div className="pdf-title">{title || fileName}</div>
        <div className="pdf-filename">{fileName}</div>
        {error && <div className="pdf-error">{error}</div>}
      </div>

      <div className="pdf-card-actions">
        <a
          className="btn btn-open"
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open PDF
        </a>

        <button
          className="btn btn-download"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading…' : 'Download PDF'}
        </button>
      </div>
    </div>
  )
}
