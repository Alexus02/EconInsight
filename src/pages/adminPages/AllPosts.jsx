import React from 'react'
import SkeletonLoader from '../../components/SkeletonLoader'

export default function AllPosts({ posts = [], loading = false, onEditPost = () => {}, onDeletePost = () => {} }) {
  if (loading) {
    return (
      <div className="admin-page-content">
        <header className="admin-header">
          <h1>All Posts</h1>
        </header>

        <div className="all-posts-wrap" aria-label="Loading posts">
          <div className="all-posts-grid">
            {[1, 2, 3, 4].map((item) => (
              <article key={item} className="post-card post-card--skeleton">
                <SkeletonLoader variant="text" style={{ width: '70%', marginBottom: '12px' }} />
                <SkeletonLoader variant="text" style={{ width: '100%', marginBottom: '8px' }} />
                <SkeletonLoader variant="text" style={{ width: '84%', marginBottom: '16px' }} />
                <div className="post-card__actions">
                  <SkeletonLoader variant="text" style={{ width: '72px', height: '34px', marginBottom: 0 }} />
                  <SkeletonLoader variant="text" style={{ width: '84px', height: '34px', marginBottom: 0 }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-content">
      <header className="admin-header">
        <h1>All Posts</h1>
      </header>

      <div className="all-posts-wrap">
        {posts.length === 0 ? (
          <p className="all-posts-empty">No posts yet.</p>
        ) : (
          <div className="all-posts-grid">
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-card__body">
                  <h3 className="post-card__title">{post.title}</h3>
                  <p className="post-card__excerpt">{post.excerpt || ''}</p>
                </div>

                <div className="post-card__actions">
                  <button type="button" className="btn btn--secondary" onClick={() => onEditPost(post)}>Edit</button>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => { if (confirm('Delete this post?')) onDeletePost(post) }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
