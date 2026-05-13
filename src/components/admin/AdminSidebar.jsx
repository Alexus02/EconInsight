import React from 'react'

function AdminSidebar({ activePage, onPageChange }) {
  const pages = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'posts', label: 'Posts' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <aside className="admin-sidebar">
      <h2>EconInsight</h2>
      <nav>
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={`admin-nav-item ${activePage === page.id ? 'admin-nav-item--active' : ''}`}
            onClick={() => onPageChange(page.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' }}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar
