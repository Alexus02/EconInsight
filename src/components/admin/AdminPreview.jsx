import React from 'react'
import PDFPreview from '../pdf-preview'

function AdminPreview({
  isOpen,
  title,
  postType,
  articleLayout,
  selectedDocUrl,
  selectedDocLabel,
  selectedFile,
  excerpt,
  content,
  onClose,
}) {
  if (!isOpen) return null

  const previewLabel = postType === 'article' ? 'Research article' : 'Blog post'
  const previewBody = postType === 'blog' ? (content || 'Your blog body will appear here.') : (content || 'No body is required for an article.')
  const previewExcerpt = postType === 'blog' ? excerpt : 'Excerpt is not required for research articles.'

  return (
    <div className="admin-preview-shell" role="dialog" aria-modal="true" aria-label="Admin post preview">
      <button className="admin-preview-shell__backdrop" type="button" aria-label="Close preview" onClick={onClose} />
      <aside className="admin-preview-shell__drawer">
        <div className="admin-preview-shell__toolbar">
          <div>
            <p className="admin-kicker">Preview</p>
            <h2>{title || 'Untitled post'}</h2>
            <p className="admin-preview-shell__meta">
              {previewLabel} · {articleLayout === 'default' ? 'Default' : articleLayout.replace('-', ' ')}
            </p>
          </div>
          <button type="button" className="admin-preview-shell__close" onClick={onClose} aria-label="Close preview">
            ✕
          </button>
        </div>

        <div className="admin-preview-shell__content">
          <div className="admin-preview-card">
            {selectedDocUrl ? (
              <div className="admin-preview-card__media">
                {selectedFile?.contentType === 'application/pdf' || selectedDocUrl.endsWith('.pdf') ? (
                  <PDFPreview title={selectedFile?.filename || 'preview'} url={selectedDocUrl} className="admin-preview-card__pdf" />
                ) : selectedFile?.contentType?.startsWith('image/') || /\.(jpe?g|png|gif)$/i.test(selectedDocUrl) ? (
                  <img src={selectedDocUrl} alt={selectedFile?.filename || 'preview'} className="admin-preview-card__image" />
                ) : (
                  <div className="admin-preview-card__fallback">{selectedFile?.filename || selectedDocLabel || 'Selected file'}</div>
                )}
              </div>
            ) : (
              <div className="admin-preview-card__fallback">No document selected.</div>
            )}

            <div className="admin-preview-card__body">
              <p className="admin-preview-card__eyebrow">{previewLabel}</p>
              <h3>{title || 'Post title goes here'}</h3>
              <p>{previewExcerpt}</p>
              {postType === 'blog' ? <p>{previewBody}</p> : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default AdminPreview
