import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchUploadedFiles, recordView } from '../lib/fileApi'
import '../styles/article-viewer.css'

const Article = () => {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const files = await fetchUploadedFiles()
        const found = files.find(f => f.id === id || f.id.toString() === id)

        if (!found) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setArticle(found)
        try {
          recordView('file', found.id)
        } catch (err) {
          console.warn('recordView failed:', err)
        }

        const related = files
          .filter(f => f.id !== found.id)
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 3)

        setRelatedArticles(related)
        setLoading(false)
      } catch (error) {
        console.error('Error loading article:', error)
        setNotFound(true)
        setLoading(false)
      }
    }

    if (id) loadArticle()
  }, [id])

  if (loading) return <div className="article-viewer loading">Loading article...</div>
  if (notFound) return <div className="article-viewer not-found">Article not found</div>
  if (!article) return null

  const uploadDate = article.uploaded_at
    ? new Date(article.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="article-viewer">
      <div className="article-container">
        <main className="article-main">
          <header className="article-header">
            <h1>{article.filename}</h1>
            <div className="article-meta">
              <span className="meta-date">📅 {uploadDate}</span>
              <span className="meta-views">👁️ {article.view_count || 0} views</span>
              <span className="meta-size">📦 {formatFileSize(article.file_size)}</span>
            </div>
          </header>

          <div className="document-viewer">
            <div className="viewer-placeholder">
              <div className="viewer-icon">📄</div>
              <p><strong>{article.filename}</strong></p>
              <p className="viewer-note">PDF Preview not available in browser</p>
              <a href={article.url} download className="button button--primary" style={{ marginTop: '1rem' }}>
                Download Document
              </a>
            </div>
          </div>

          <div className="article-info">
            <h3>Document Information</h3>
            <dl>
              <dt>Type:</dt>
              <dd>{article.content_type || 'PDF'}</dd>
              <dt>Size:</dt>
              <dd>{formatFileSize(article.file_size)}</dd>
              <dt>Published:</dt>
              <dd>{uploadDate}</dd>
              <dt>Views:</dt>
              <dd>{article.view_count || 0}</dd>
            </dl>
          </div>
        </main>

        <aside className="article-sidebar">
          <div className="related-articles">
            <h3>Related Research</h3>
            {relatedArticles.length > 0 ? (
              <div className="related-list">
                {relatedArticles.map(related => (
                  <a key={related.id} href={`/articles/${related.id}`} className="related-item">
                    <div className="related-item__icon">📄</div>
                    <div className="related-item__content">
                      <h4>{related.filename}</h4>
                      <p className="related-views">👁️ {related.view_count || 0} views</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="no-related">No related research available</div>
            )}
          </div>

          <div className="info-box">
            <h4>About This Research</h4>
            <ul>
              <li>Comprehensive economic analysis</li>
              <li>Data-driven insights</li>
              <li>Actionable recommendations</li>
              <li>Expert perspective</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Article
