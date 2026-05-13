import React, { useState } from 'react'
import '../../styles/settings.css'

function Settings() {
  const [showToken, setShowToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [maxUploadSize] = useState(20)

  const portalToken = import.meta.env.VITE_HOST_PORTAL_TOKEN || '202202'

  const handleCopyToken = () => {
    navigator.clipboard.writeText(portalToken)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const handleExportData = () => {
    // This would trigger a backend endpoint to export all posts and files
    alert('Export functionality will be available soon. Contact support for manual exports.')
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>Portal Authentication</h2>
          <p>Manage your admin portal access credentials</p>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Host Portal Token</label>
            <p className="settings-item__help">This token is required to authenticate admin requests</p>
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

      <div className="settings-section">
        <div className="settings-section__header">
          <h2>Data Management</h2>
          <p>Export and backup your content</p>
        </div>

        <div className="settings-item">
          <div className="settings-item__label">
            <label>Export Data</label>
            <p className="settings-item__help">Download all your posts and file data</p>
          </div>
          <button onClick={handleExportData} className="settings-button settings-button--secondary">
            Export Posts & Files
          </button>
        </div>
      </div>

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
