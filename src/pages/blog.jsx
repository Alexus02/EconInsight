import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminPosts } from '../lib/fileApi'
import '../styles/blog.css'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState('')

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchAdminPosts()
        const publishedPosts = (data.posts || [])
          .filter(p => p.status === 'published' && p.post_type === 'blog')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
            <div className="posts-grid">
              {posts.map(post => (
                <article key={post.id} className="blog-post-card">
                  {post.cover_image_url && (
                    <div className="post-image">
                      <img src={post.cover_image_url} alt={post.title} />
                    </div>
                  )}
                  {!post.cover_image_url && (
                    <div className="post-image placeholder">
                      <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
                        <rect width="400" height="250" fill="#e5e5e5" />
                        <text x="200" y="125" textAnchor="middle" fontSize="14" fill="#999">
                          Post Image
                        </text>
                      </svg>
                    </div>
                  )}
                  <div className="post-content">
                    <h3>{post.title}</h3>
                    <p className="post-excerpt">{post.excerpt || post.content?.substring(0, 150)}</p>
                    <div className="post-meta">
                      <span className="post-date">
                        📅 {new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="post-views">👁️ {post.view_count || 0} views</span>
                    </div>
                    <a href={`/blog/${post.id}`} className="read-more">
                      Read More →
                    </a>
                  </div>
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
              <a key={post.id} href={`/blog/${post.id}`} className="featured-item">
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
