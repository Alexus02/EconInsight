import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPublishedPostById, fetchPublishedPosts, recordView } from '../lib/fileApi'
import '../styles/article-viewer.css'

function ResearchDetails() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    const loadPost = async () => {
      try {
        const found = await fetchPublishedPostById(id)
        if (!found || (found.postType !== 'article' && found.post_type !== 'article')) {
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

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const data = await fetchPublishedPosts('article')
        const posts = data.posts || []
        const others = posts
          .filter((p) => String(p.id) !== String(id))
          .sort((a, b) => (b.viewCount || b.view_count || 0) - (a.viewCount || a.view_count || 0))
          .slice(0, 6)
        setRelatedPosts(others)
      } catch (err) {
        // ignore
      }
    }

    loadRelated()
  }, [id])

  if (loading) return <div className="article-viewer loading">Loading research...</div>
  if (notFound || !post) return <div className="article-viewer not-found">Research not found</div>

  const createdAt = new Date(post.createdAt || post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const authors = post.authors || post.author || post.author_name || post.byline || ''

  return (
    <div className="article-viewer">
      <div className="article-container article-container--two-columns">
        <main className="article-main">
          <header className="article-header">
            <p className="library-kicker">Research Article</p>
            <h1>{post.title}</h1>
            <div className="article-meta">
              <span className="meta-date">📅 {createdAt}</span>
              <span className="meta-views">👁️ {post.viewCount || post.view_count || 0} views</span>
            </div>
          </header>

          <div className="document-section">
            <div className="document-controls">
              {post.articleFileUrl && (
                <>
                  <a className="button button--primary" href={post.articleFileUrl} download target="_blank" rel="noreferrer">Download PDF</a>
                  <a className="button" href={post.articleFileUrl} target="_blank" rel="noopener noreferrer">Open PDF</a>
                  {navigator?.share && post.articleFileUrl && (
                    <button
                      className="button"
                      onClick={() => navigator.share({ title: post.title, url: post.articleFileUrl })}
                    >
                      Share
                    </button>
                  )}
                </>
              )}
            </div>

            {post.coverImageUrl ? (
              <div className="article-cover article-cover--detail">
                <img src={post.coverImageUrl} alt={post.title} className="article-cover__image" />
              </div>
            ) : null}

            {(post.excerpt || post.content) && (
              <div className="article-info">
                <h3>Research Summary</h3>
                <p>{post.excerpt || post.content}</p>
              </div>
            )}
          </div>
        </main>

        <aside className="article-sidebar">
          <div className="info-box">
            <h4>Article</h4>
            <ul>
              <li><strong>Authors:</strong> {Array.isArray(authors) ? authors.join(', ') : authors || 'Unknown'}</li>
              <li><strong>Published:</strong> {createdAt}</li>
              <li><strong>Views:</strong> {post.viewCount || post.view_count || 0}</li>
              {post.wordCount && <li><strong>Length:</strong> {post.wordCount} words</li>}
            </ul>
          </div>
          <div className="related-articles">
            <h3>Related</h3>
            {relatedPosts && relatedPosts.length ? (
              <div className="related-list">
                {relatedPosts.map((r) => (
                  <Link key={r.id} to={`/research/${r.id}`} className="related-item">
                    <div className="related-item__icon">📄</div>
                    <div className="related-item__content">
                      <h4>{r.title}</h4>
                      <p className="related-views">{r.viewCount || r.view_count || 0} views</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="no-related">No related articles</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default ResearchDetails
