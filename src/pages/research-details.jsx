import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPublishedPostById, recordView } from '../lib/fileApi'
import '../styles/article-viewer.css'

function ResearchDetails() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadPost = async () => {
      try {
        const found = await fetchPublishedPostById(id)
        if (!found || found.post_type !== 'article') {
          setNotFound(true)
          return
        }
        setPost(found)
        recordView('article', id)
      } catch (err) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadPost()
  }, [id])

  if (loading) return <div className="article-viewer loading">Loading research...</div>
  if (notFound || !post) return <div className="article-viewer not-found">Research not found</div>

  const createdAt = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="article-viewer">
      <div className="article-container">
        <aside className="article-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Post Type</h3>
            <p className="sidebar-content">{post.post_type === 'article' ? 'Research Article' : 'Other'}</p>
          </div>
          <div className="sidebar-card">
            <h3 className="sidebar-title">Back to research</h3>
            <Link to="/research" className="sidebar-link">View all articles</Link>
          </div>
        </aside>

        <main className="article-main">
          <header className="article-header">
            {post.cover_image_url && (
              <div className="article-cover">
                <img src={post.cover_image_url} alt={post.title} />
              </div>
            )}
            <p className="library-kicker">Research Article</p>
            <h1>{post.title}</h1>
            <div className="article-meta">
              <span className="meta-date">📅 {createdAt}</span>
              <span className="meta-views">👁️ {post.view_count || 0} views</span>
            </div>
            <div className="article-excerpt-block">
              <p>{post.excerpt}</p>
            </div>
          </header>

          {post.article_file_url ? (
            <div className="document-viewer">
              {post.article_file_url.endsWith('.pdf') ? (
                <iframe 
                  title={post.title} 
                  src={post.article_file_url} 
                  style={{ width: '100%', minHeight: '70vh', border: 0 }} 
                />
              ) : post.article_file_url.match(/\.(jpe?g|png|gif)$/i) ? (
                <img 
                  src={post.article_file_url} 
                  alt={post.title} 
                  style={{ width: '100%', borderRadius: '16px' }} 
                />
              ) : (
                <div className="viewer-placeholder">
                  <div className="viewer-icon">📄</div>
                  <p><strong>{post.title}</strong></p>
                  <a 
                    href={post.article_file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="button button--primary" 
                    style={{ marginTop: '1rem' }}
                  >
                    Open Attachment
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="article-info">
              <p>{post.content || 'No attachment was included with this research article.'}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ResearchDetails
