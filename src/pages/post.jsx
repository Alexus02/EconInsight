import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPublishedPostById, recordView } from '../lib/fileApi'
import '../styles/article-viewer.css'
import PdfActionsCard from '../components/PdfActionsCard'
import CoverPhoto from '../components/CoverPhoto'

function Post() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadPost = async () => {
      try {
        const found = await fetchPublishedPostById(id)
        if (!found) {
          setNotFound(true)
          return
        }
        setPost(found)
        recordView('post', id)
      } catch (err) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadPost()
  }, [id])

  if (loading) return <div className="article-viewer loading">Loading post...</div>
  if (notFound || !post) return <div className="article-viewer not-found">Post not found</div>

  const createdAt = new Date(post.createdAt || post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="article-viewer">
      <div className="article-container">
        <main className="article-main">
          <header className="article-header">
            {post.coverImageUrl && (
              <div className="article-cover">
                <CoverPhoto src={post.coverImageUrl} alt={post.title} />
              </div>
            )}
            <p className="library-kicker">{post.postType === 'article' ? 'Research article' : 'Blog post'}</p>
            <h1>{post.title}</h1>
            <div className="article-meta">
              <span className="meta-date">📅 {createdAt}</span>
              <span className="meta-views">👁️ {post.viewCount || post.view_count || 0} views</span>
            </div>
          </header>

          {post.articleFileUrl ? (
            <div className="document-viewer">
              {post.articleFileUrl.endsWith('.pdf') ? (
                // Use the actions card for PDFs: Open in new tab or download reliably
                <PdfActionsCard
                  pdfUrl={post.articleFileUrl}
                  fileName={(post.articleFileUrl || '').split('/').pop().split('?')[0]}
                  title={post.title}
                />
              ) : post.articleFileUrl.match(/\.(jpe?g|png|gif)$/i) ? (
                <img
                  src={post.articleFileUrl}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', borderRadius: '16px' }}
                />
              ) : (
                <div className="viewer-placeholder">
                  <div className="viewer-icon">📄</div>
                  <p><strong>{post.title}</strong></p>
                  <a href={post.articleFileUrl} target="_blank" rel="noreferrer" className="button button--primary" style={{ marginTop: '1rem' }}>
                    Open Attachment
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="article-info">
              <p>{post.excerpt || post.content || 'No attachment was included with this post.'}</p>
            </div>
          )}

          {(post.excerpt || post.content) && (
            <div className="article-info">
              <h3>Post Summary</h3>
              <p>{post.excerpt || post.content}</p>
            </div>
          )}
        </main>

        <aside className="article-sidebar">
          <div className="info-box">
            <h4>Post Type</h4>
            <p>{post.postType}</p>
          </div>
          <div className="info-box">
            <h4>Back to blog</h4>
            <Link to="/blog">View all posts</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Post