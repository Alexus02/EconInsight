import React, { useEffect, useState } from 'react'
import { fetchAdminUsers, upsertAdminUser, deleteAdminUser } from '../../lib/fileApi'
import '../../styles/adminStyles/settings.css'
import SkeletonLoader from '../../components/SkeletonLoader'

function Settings({ currentAdmin = null }) {
  const [adminUsers, setAdminUsers] = useState([])
  const [adminEmail, setAdminEmail] = useState('')
  const [adminSecretKey, setAdminSecretKey] = useState('')
  const [adminUsersLoading, setAdminUsersLoading] = useState(true)
  const [adminUsersError, setAdminUsersError] = useState('')
  const [adminSaveMessage, setAdminSaveMessage] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [maxUploadSize] = useState(20)

  const portalToken = import.meta.env.VITE_HOST_PORTAL_TOKEN || '202202'

  const loadAdminUsers = async () => {
    setAdminUsersError('')
    setAdminUsersLoading(true)

    try {
      const data = await fetchAdminUsers()
      setAdminUsers(data.users || [])
    } catch (err) {
      setAdminUsersError(err.message || 'Unable to load admin users.')
    } finally {
      setAdminUsersLoading(false)
    }
  }

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const handleAddAdminUser = async (event) => {
    event.preventDefault()
    setAdminUsersError('')
    setAdminSaveMessage('')

    if (!adminEmail.trim() || !adminSecretKey.trim()) {
      setAdminUsersError('Email and secret key are required.')
      return
    }

    try {
      await upsertAdminUser(adminEmail.trim(), adminSecretKey)
      setAdminSaveMessage(`Access granted for ${adminEmail.trim().toLowerCase()}.`)
      setAdminEmail('')
      setAdminSecretKey('')
      await loadAdminUsers()
    } catch (err) {
      setAdminUsersError(err.message || 'Unable to save admin user.')
    }
  }

  const handleRemoveAdminUser = async (userId, email) => {
    if (!window.confirm(`Remove admin access for ${email}? This cannot be undone.`)) return

    setAdminUsersError('')
    try {
      await deleteAdminUser(userId)
      await loadAdminUsers()
    } catch (err) {
      setAdminUsersError(err.message || 'Unable to remove admin user.')
    }
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(portalToken)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>Admin Access</h2>
          <p>Add or rotate admin email access keys</p>
        </div>

        {currentAdmin ? (
          <div className="settings-item">
            <div className="settings-item__label">
              <label>Signed in as</label>
              <p className="settings-item__help">The admin account currently managing access</p>
            </div>
            <div className="settings-item__value">{currentAdmin.email}</div>
          </div>
        ) : null}

        <form className="settings-admin-form" onSubmit={handleAddAdminUser}>
          <div className='admin-input'>
          <label>
            Admin email
            <input
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="someone@example.com"
            />
          </label>

          <label>
            Secret key
            <input
              type="password"
              value={adminSecretKey}
              onChange={(event) => setAdminSecretKey(event.target.value)}
              placeholder="Create a strong secret key"
            />
          </label>
          </div>

          <button type="submit" className="settings-button settings-button--primary">
            Grant access
          </button>
        </form>

        {adminUsersError ? <div className="settings-message settings-message--error">{adminUsersError}</div> : null}
        {adminSaveMessage ? <div className="settings-message settings-message--success">{adminSaveMessage}</div> : null}

        <div className="settings-admin-list">
          <div className="settings-admin-list__header">Allowed admins</div>
          {adminUsersLoading ? (
            <div className="settings-admin-list__skeleton" aria-label="Loading admin users">
              <div className="settings-admin-list__skeleton-item">
                <div className="settings-admin-list__skeleton-main">
                  <SkeletonLoader variant="text" style={{ width: '220px' }} />
                  <SkeletonLoader variant="text" style={{ width: '110px' }} />
                </div>
                <SkeletonLoader variant="text" style={{ width: '180px' }} />
              </div>
              <div className="settings-admin-list__skeleton-item">
                <div className="settings-admin-list__skeleton-main">
                  <SkeletonLoader variant="text" style={{ width: '200px' }} />
                  <SkeletonLoader variant="text" style={{ width: '92px' }} />
                </div>
                <SkeletonLoader variant="text" style={{ width: '170px' }} />
              </div>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="settings-admin-list__empty">No admin users configured yet.</div>
          ) : (
            adminUsers.map((user) => (
              <div key={user.id} className="settings-admin-list__item">
                <div>
                  <strong>{user.email}</strong>
                  <div className="settings-admin-list__meta">{user.isActive ? 'Active' : 'Disabled'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="settings-admin-list__meta">Added {new Date(user.createdAt).toLocaleDateString()}</div>
                  <button
                    type="button"
                    className="settings-button settings-button--danger"
                    onClick={() => handleRemoveAdminUser(user.id, user.email)}
                    title={`Remove ${user.email}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>Portal Authentication</h2>
          <p>Legacy host token kept for existing integrations</p>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Host Portal Token</label>
            <p className="settings-item__help">Used only as a fallback for older admin requests</p>
          </div>

          <div className="settings-item__content">
            <div className="settings-token">
              <input
                type={showToken ? 'text' : 'password'}
                value={portalToken}
                readOnly
                className="settings-token__input"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="settings-token__action"
                title={showToken ? 'Hide' : 'Show'}
              >
                {showToken ? '🙈' : '👁️'}
              </button>
              <button
                type="button"
                onClick={handleCopyToken}
                className="settings-token__action"
                title="Copy to clipboard"
              >
                {tokenCopied ? '✓ Copied' : '📋'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>Upload Settings</h2>
          <p>Configure file upload restrictions</p>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Maximum File Size</label>
            <p className="settings-item__help">Individual file size limit for uploads</p>
          </div>
          <div className="settings-item__value">{maxUploadSize} MB</div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Allowed File Types</label>
            <p className="settings-item__help">Files accepted for upload</p>
          </div>
          <div className="settings-allowed-types">
            <span className="settings-badge">PDF (.pdf)</span>
            <span className="settings-badge">Images (.jpg, .png, .jpeg)</span>
            <span className="settings-badge">Word (.doc, .docx)</span>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Storage</label>
            <p className="settings-item__help">Files are stored in Cloudflare R2</p>
          </div>
          <div className="settings-item__value">Cloudflare R2 Bucket</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>Database</h2>
          <p>Content and file metadata information</p>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Database Type</label>
            <p className="settings-item__help">Serverless relational database</p>
          </div>
          <div className="settings-item__value">Cloudflare D1 (SQLite)</div>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Stored Data</label>
            <p className="settings-item__help">Types of content stored</p>
          </div>
          <div className="settings-stored-data">
            <ul>
              <li>Blog posts and articles</li>
              <li>File metadata (URLs, names, types)</li>
              <li>View counts and engagement metrics</li>
              <li>Post status (published/draft)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export section removed per request */}

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>System Information</h2>
          <p>Portal and infrastructure details</p>
        </div>

        <div className="settings-info-grid">
          <div className="settings-info-item">
            <div className="settings-info-item__label">Portal Version</div>
            <div className="settings-info-item__value">1.0.0</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-item__label">Environment</div>
            <div className="settings-info-item__value">Development</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-item__label">Infrastructure</div>
            <div className="settings-info-item__value">Cloudflare Workers</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-item__label">CDN</div>
            <div className="settings-info-item__value">Cloudflare</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
