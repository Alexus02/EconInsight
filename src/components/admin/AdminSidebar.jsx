import React, { useEffect, useState } from 'react'

function AdminSidebar({ activePage, onPageChange, currentAdmin, onLogout }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pages = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'messages', label: 'Messages' },
    { id: 'posts', label: 'Posts' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ]

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1001px)')
    const handleChange = (event) => {
      if (event.matches) {
        setIsDrawerOpen(false)
      }
    }

    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const closeDrawer = () => setIsDrawerOpen(false)
  const openDrawer = () => setIsDrawerOpen(true)
  const navigateToPage = (pageId) => {
    onPageChange(pageId)
    closeDrawer()
  }

  return (
    <>
      <button
        type="button"
        className="admin-sidebar__toggle"
        onClick={openDrawer}
        aria-label="Open admin menu"
      >
        ☰ Menu
      </button>

      {isDrawerOpen ? (
        <button
          type="button"
          className="admin-sidebar__backdrop"
          onClick={closeDrawer}
          aria-label="Close admin menu backdrop"
        />
      ) : null}

      <aside className={`admin-sidebar ${isDrawerOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <h2>EconInsight</h2>
          <button type="button" className="admin-sidebar__close" onClick={closeDrawer} aria-label="Close admin menu">
            ✕
          </button>
        </div>

        <nav>
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`admin-nav-item ${activePage === page.id ? 'admin-nav-item--active' : 'admin-nav-item--inactive'}`}
              onClick={() => navigateToPage(page.id)}
              style={{ background: 'none', cursor: 'pointer', padding: '6px 8px', font: 'inherit', textAlign: 'left'  }}
            >
              {page.label}
            </button>
          ))}
        </nav>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              closeDrawer()
              onLogout()
            }}
            style={{ marginTop: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left', color: '#b00020', fontWeight: 600 }}
          >
            Log out
          </button>
        )}
      </aside>
    </>
  )
}

export default AdminSidebar
