import React, { useEffect, useState } from 'react'
import { fetchAdminPosts } from '../../lib/fileApi'
import '../../styles/adminStyles/analytics.css'
import LineChart from '../../components/admin/LineChart'

function Analytics({ onPageChange = () => {} }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAdminPosts()
        setPosts(data.posts || [])
      } catch (err) {
        console.error('Failed to load analytics data:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="analytics-page">Loading analytics...</div>
  }

  if (error) {
    return <div className="analytics-page"><div className="analytics-error">{error}</div></div>
  }

  // Calculate stats
  const publishedPosts = posts.filter(p => (p.status || 'published').toLowerCase() === 'published')
  const draftPosts = posts.filter(p => (p.status || 'published').toLowerCase() === 'draft')
  const blogs = posts.filter(p => (p.post_type || p.postType) === 'blog')
  const articles = posts.filter(p => (p.post_type || p.postType) === 'article')

  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || p.viewCount || 0), 0)
  const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0

  // Top posts by views
  const topPosts = [...publishedPosts].sort((a, b) => (b.view_count || b.viewCount || 0) - (a.view_count || a.viewCount || 0)).slice(0, 10)

  // Blog vs Article breakdown
  const blogViews = blogs.reduce((sum, p) => sum + (p.view_count || p.viewCount || 0), 0)
  const articleViews = articles.reduce((sum, p) => sum + (p.view_count || p.viewCount || 0), 0)

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card__label">Total Posts</div>
          <div className="analytics-card__value">{posts.length}</div>
          <div className="analytics-card__detail">{publishedPosts.length} published, {draftPosts.length} drafts</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__label">Total Views</div>
          <div className="analytics-card__value">{totalViews.toLocaleString()}</div>
          <div className="analytics-card__detail">{avgViews} average per post</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__label">Blog Posts</div>
          <div className="analytics-card__value">{blogs.length}</div>
          <div className="analytics-card__detail">{blogViews.toLocaleString()} total views</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__label">Articles</div>
          <div className="analytics-card__value">{articles.length}</div>
          <div className="analytics-card__detail">{articleViews.toLocaleString()} total views</div>
        </div>
      </div>

      <div className="analytics-section">
        <LineChart apiBase={import.meta.env.VITE_API_BASE_URL || ''} days={30} />

        <div className='analytics-details'>
          <h2>Top Performing Posts</h2>
          <button type="button" onClick={() => onPageChange('all-posts')}>View all posts</button>
        </div>
        
        {topPosts.length === 0 ? (
          <p className="analytics-empty">No published posts yet</p>
        ) : (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Views</th>
                <th>Published Date</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post) => (
                <tr key={post.id}>
                  <td className="analytics-table__title">{post.title}</td>
                  <td className="analytics-table__type">
                    <span className={`analytics-badge analytics-badge--${post.post_type || post.postType}`}>
                      {post.post_type === 'blog' || post.postType === 'blog' ? 'Blog' : 'Article'}
                    </span>
                  </td>
                  <td className="analytics-table__views">{(post.view_count || post.viewCount || 0).toLocaleString()}</td>
                  <td className="analytics-table__date">
                    {new Date(post.created_at || post.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default Analytics
