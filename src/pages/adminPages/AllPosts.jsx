import React from 'react'

export default function AllPosts({ posts = [], onEditPost = () => {}, onDeletePost = () => {} }) {
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
