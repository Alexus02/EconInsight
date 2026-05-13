import React from 'react'
import AdminStats from '../../components/admin/AdminStats'

function Dashboard({ stats }) {
  return (
    <div className="admin-page-content">
      <header className="admin-header admin-header--dashboard">
        <h1>Content Dashboard</h1>
        <button type="button" className="admin-new-post">+ New Post</button>
      </header>

      <AdminStats stats={stats} />
    </div>
  )
}

export default Dashboard
