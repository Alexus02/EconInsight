import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublishedPosts } from '../lib/fileApi'
import '../styles/blog.css'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState('')

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPublishedPosts('blog')
        const publishedPosts = (data.posts || []).sort(
          (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
        )
        setPosts(publishedPosts)
      } catch (error) {
        console.error('Error loading blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribeStatus('success')
      setEmail('')
      setTimeout(() => setSubscribeStatus(''), 3000)
    }
  }

  return (
    <div className="blog-page">
      <div className="blog-hero">
        <h1>Blog & Insights</h1>
        <p>Latest insights, economic analysis and expertise from our team</p>
      </div>

      <div className="blog-container">
        <div className="blog-posts">
          {loading ? (
            <div className="loading">Loading blog posts...</div>
          ) : posts.length > 0 ? (
            <div className="posts-feed">
              {posts.map(post => (
                <article key={post.id} className="thread-post">
                  <Link to={`/posts/${post.id}`} className="thread-post__link">
                    {post.coverImageUrl && (
                      <div className="thread-post__image">
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          loading={import.meta.env.DEV ? 'eager' : 'lazy'}
                          decoding="async"
                          onLoad={() => {
                            try { if (import.meta.env.DEV) { console.log('[blog] image loaded', post.id, post.coverImageUrl) } } catch (e) {}
                          }}
                          onError={(e) => {
                            try { if (import.meta.env.DEV) { console.log('[blog] image error', post.id, post.coverImageUrl, e) } } catch (err) {}
                          }}
                        />
                      </div>
                    )}
                    <div className="thread-post__header">
                      <h3>{post.title}</h3>
                      <span className="thread-post__date">
                        {new Date(post.createdAt || post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="thread-post__body">
                      <p>{post.excerpt || post.content?.substring(0, 280)}</p>
                    </div>
                    <div className="thread-post__footer">
                      <span className="thread-post__engagement">👁️ {post.view_count || 0} views</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No blog posts available yet. Check back soon!</p>
            </div>
          )}
        </div>

        <aside className="blog-sidebar">
          <div className="subscribe-section">
            <h3>Subscribe to Our Newsletter</h3>
            <p>Get the latest economic insights delivered to your inbox</p>
            <form onSubmit={handleSubscribe} className="subscribe-form">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="subscribe-input"
              />
              <button type="submit" className="button button--primary">
                Subscribe
              </button>
            </form>
            {subscribeStatus === 'success' && (
              <p className="subscribe-success">✓ Thanks for subscribing!</p>
            )}
            <p className="subscribe-note">
              We respect your privacy. No spam, unsubscribe anytime.
            </p>
          </div>

          <div className="featured-posts">
            <h4>Featured Posts</h4>
            {posts.slice(0, 3).map(post => (
              <a key={post.id} href={`/posts/${post.id}`} className="featured-item">
                <div className="featured-icon">📌</div>
                <span>{post.title}</span>
              </a>
            ))}
          </div>

          <div className="categories">
            <h4>Categories</h4>
            <div className="category-tags">
              <span className="tag">Economic Analysis</span>
              <span className="tag">Market Trends</span>
              <span className="tag">Policy Updates</span>
              <span className="tag">Research</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Blog
