import React from 'react'

function AdminPostsList({ filteredPosts, postsLoading, trackFilter, onFilterChange }) {
  return (
    <section className="admin-posts admin-posts--panel">
      <div className="admin-posts__header">
        <h2>Manage Posts</h2>
        <div className="track-menu">
          <button
            className={`track-menu__btn ${trackFilter === 'all' ? 'track-menu__btn--active' : ''}`}
            onClick={() => onFilterChange('all')}
            type="button"
          >
            All
          </button>
          <button
            className={`track-menu__btn ${trackFilter === 'blog' ? 'track-menu__btn--active' : ''}`}
            onClick={() => onFilterChange('blog')}
            type="button"
          >
            Blog
          </button>
          <button
            className={`track-menu__btn ${trackFilter === 'article' ? 'track-menu__btn--active' : ''}`}
            onClick={() => onFilterChange('article')}
            type="button"
          >
            Articles
          </button>
          <button
            className={`track-menu__btn ${trackFilter === 'draft' ? 'track-menu__btn--active' : ''}`}
            onClick={() => onFilterChange('draft')}
            type="button"
          >
            Drafts
          </button>
        </div>
      </div>

      {postsLoading ? (
        <p style={{ padding: '1rem' }}>Loading posts...</p>
      ) : filteredPosts.length > 0 ? (
        <div className="admin-post-table-wrap">
          <table className="admin-post-table admin-post-table--minimal">
            <tbody>
              {filteredPosts.map((post) => {
                const createdAt = post.created_at || post.createdAt
                const postTypeLabel = post.post_type || post.postType || 'unknown'

                return (
                  <tr key={post.id}>
                    <td className="admin-post-table__title">{post.title || 'Untitled post'}</td>
                    <td>{postTypeLabel === 'blog' ? 'Blog' : 'Article'}</td>
                    <td>
                      {createdAt
                        ? new Date(createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="admin-post-table__actions">Edit | Delete</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ padding: '1rem' }}>No posts yet.</p>
      )}
    </section>
  )
}

export default AdminPostsList
