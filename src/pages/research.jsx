import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublishedPosts } from '../lib/fileApi'
import SkeletonLoader from '../components/SkeletonLoader'
import '../styles/library.css'

const Research = () => {
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPublishedPosts('article')
        const postList = (data.posts || []).sort(
          (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
        )
        setPosts(postList)
        setFilteredPosts(postList)
      } catch {
        // Intentionally silent in production.
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  useEffect(() => {
    let results = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    } else if (sortBy === 'most-viewed') {
      results.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    }

    setFilteredPosts(results)
  }, [searchTerm, sortBy, posts])

  return (
    <section className="library-page">
      <div className="library-page__intro">
        <p className="library-kicker">Research & Publications</p>
        <h1>Economic Research Library</h1>
        <p>Browse our latest economic research, reports, and publications</p>
      </div>

      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search research..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="most-viewed">Most Viewed</option>
          </select>
        </div>
      </div>

      <div className="research-library">
        {loading ? (
          <div className="research-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="research-card research-card--skeleton" aria-hidden="true">
                <SkeletonLoader variant="rect" className="research-card__skeleton-media" />
                <div className="research-card__content">
                  <SkeletonLoader variant="title" style={{ width: '92%' }} />
                  <SkeletonLoader variant="text" style={{ width: '78%' }} />
                  <SkeletonLoader variant="text" style={{ width: '55%' }} />
                </div>
              </article>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="research-grid">
            {filteredPosts.map(post => (
              <Link key={post.id} to={`/research/${post.id}`} className="research-card">
                <div className="research-card__media">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="research-card__image"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="placeholder-image placeholder-small">
                      <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                        <rect width="300" height="200" fill="#e5e5e5" />
                        <text x="150" y="100" textAnchor="middle" fontSize="12" fill="#999">Research Article</text>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="research-card__content">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt || (post.content || '').slice(0, 120)}</p>
                  <p className="views-badge">
                    <span className="badge-icon">📄</span>
                    Research article • 👁️ {post.view_count || 0} views
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No research articles found matching your criteria</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Research
