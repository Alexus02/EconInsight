import React from 'react'

function AdminHeader({ onNewPost }) {
  return (
    <header className="admin-header admin-header--dashboard">
      <h1>Content Dashboard</h1>
      <button type="button" className="admin-new-post" onClick={onNewPost}>
        + New Post
      </button>
    </header>
  )
}

export default AdminHeader
