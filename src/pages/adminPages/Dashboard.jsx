import React from 'react'
import AdminStats from '../../components/admin/AdminStats'
import SkeletonLoader from '../../components/SkeletonLoader'
import '../../styles/adminStyles/dashboard.css'

function Dashboard({ stats, recentPosts, loading = false }) {
  if (loading) {
    return (
      <div className="admin-page-content">
        <header className="admin-header--dashboard">
          <SkeletonLoader variant="title" className="admin-loading-shell__title" />
        </header>

        <div className="analytics-section" aria-label="Loading recent activity">
          <SkeletonLoader variant="text" style={{ width: '180px', marginBottom: '12px' }} />
          <SkeletonLoader variant="small-rect" style={{ marginBottom: '10px' }} />
          <SkeletonLoader variant="small-rect" style={{ marginBottom: '10px' }} />
          <SkeletonLoader variant="small-rect" />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-content">
      <header className="admin-header--dashboard">
        <h1>Content Dashboard</h1>
        <AdminStats stats={stats} />
      </header>


      <div className="analytics-section">
        <h2>Recent Activity</h2>
        {recentPosts.length === 0 ? (
          <p className="analytics-empty">No posts yet</p>
        ) : (
          <div className="analytics-feed">
            {recentPosts.map((post) => (
              <div key={post.id} className="analytics-feed__item">
                <div className="analytics-feed__header">
                  <h3>{post.title}</h3>
                  <span className={`analytics-badge analytics-badge--${post.status || 'published'}`}>
                    {(post.status || 'published').charAt(0).toUpperCase() + (post.status || 'published').slice(1)}
                  </span>
                </div>
                <div className="analytics-feed__meta">
                  <span>{post.post_type === 'blog' || post.postType === 'blog' ? 'Blog' : 'Article'}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at || post.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{(post.view_count || post.viewCount || 0).toLocaleString()} views</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
