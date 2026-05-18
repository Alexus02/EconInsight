import React from 'react'

function AdminStats({ stats }) {
  return (
    <section className="dashboard-stats-grid">
      <article>
        <p>Total Posts</p>
        <strong>{stats.total}</strong>
      </article>
      <article>
        <p>Blog Posts</p>
        <strong>{stats.blogs}</strong>
      </article>
      <article>
        <p>Articles</p>
        <strong>{stats.articles}</strong>
      </article>
      <article>
        <p>Drafts</p>
        <strong>{stats.drafts}</strong>
      </article>
    </section>
  )
}

export default AdminStats
