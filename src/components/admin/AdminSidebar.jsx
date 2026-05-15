import React from 'react'

function AdminSidebar({ activePage, onPageChange, currentAdmin, onLogout }) {
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
            className={`admin-nav-item ${activePage === page.id ? 'admin-nav-item--active' : 'admin-nav-item--inactive'}`}
            onClick={() => onPageChange(page.id)}
            style={{ background: 'none', cursor: 'pointer', padding: '6px 8px', font: 'inherit', textAlign: 'left'  }}
          >
            {page.label}
          </button>
        ))}
      </nav>
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          style={{ marginTop: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left', color: '#b00020', fontWeight: 600 }}
        >
          Log out
        </button>
      )}
    </aside>
  )
}

export default AdminSidebar
