import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchUploadedFiles } from '../lib/fileApi'
import '../styles/library.css'

function Research() {
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const data = await fetchUploadedFiles()
        const fileList = Array.isArray(data) ? data : data.files || []
        setFiles(fileList)
        setFilteredFiles(fileList)
      } catch (error) {
        console.error('Error loading research files:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [])

  useEffect(() => {
    let results = files.filter(file =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    } else if (sortBy === 'most-viewed') {
      results.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    }

    setFilteredFiles(results)
  }, [searchTerm, sortBy, files])

  return (
    <section className="library-page">
      <div className="library-page__intro">
        <p className="library-kicker">Research & Publications</p>
        <h1>Economic Research Library</h1>
        <p>Browse our latest economic research, reports, and publications</p>
      </div>

      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search research..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="most-viewed">Most Viewed</option>
          </select>
        </div>
      </div>

      <div className="research-library">
        {loading ? (
          <div className="loading">Loading research...</div>
        ) : filteredFiles.length > 0 ? (
          <div className="research-list">
            {filteredFiles.map(file => (
              <Link
                key={file.id}
                to={`/articles/${file.id}`}
                className="research-item"
              >
                <div className="research-item__media">
                  <div className="file-icon">📄</div>
                </div>
                <div className="research-item__content">
                  <h3>{file.filename}</h3>
                  <div className="research-meta">
                    <span className="meta-item">📅 {new Date(file.uploaded_at).toLocaleDateString()}</span>
                    <span className="meta-item">👁️ {file.viewCount || 0} views</span>
                    <span className="meta-item">📦 {(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <div className="research-item__action">
                  <span className="arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No research found matching your criteria</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Research
