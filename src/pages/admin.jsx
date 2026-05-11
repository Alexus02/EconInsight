import { useEffect, useMemo, useState } from 'react'
import { createPost, fetchAdminPosts, fetchUploadedFiles } from '../lib/fileApi'
import FileUpload from '../components/file-upload'
import '../styles/admin.css'

function Admin() {
  const [postType, setPostType] = useState('article')
  const [status, setStatus] = useState('draft')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [selectedFileUrl, setSelectedFileUrl] = useState('')
  const [selectedFileKey, setSelectedFileKey] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({ totalPosts: 0, blogPosts: 0, articlePosts: 0, drafts: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const articleFiles = useMemo(
    () =>
      uploadedFiles.filter((file) =>
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(
          file.contentType
        )
      ),
    [uploadedFiles]
  )

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      try {
        const [filesResult, postsResult] = await Promise.all([fetchUploadedFiles(), fetchAdminPosts()])
        if (!active) {
          return
        }

        setUploadedFiles(Array.isArray(filesResult) ? filesResult : filesResult.files || [])
        setPosts(postsResult.posts || [])
        setStats(postsResult.stats || { totalPosts: 0, blogPosts: 0, articlePosts: 0, drafts: 0 })
      } catch (loadError) {
        if (!active) {
          return
        }
        setError(loadError.message || 'Unable to load admin data.')
      }
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [])

  const refreshFiles = async () => {
    try {
      const filesResult = await fetchUploadedFiles()
      setUploadedFiles(Array.isArray(filesResult) ? filesResult : filesResult.files || [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to refresh uploaded files.')
    }
  }

  const handleFileSelection = (event) => {
    const value = event.target.value
    setSelectedFileUrl(value)
    const found = articleFiles.find((file) => file.url === value)
    setSelectedFileKey(found?.storageKey || '')
  }

  const resetForm = () => {
    setTitle('')
    setExcerpt('')
    setContent('')
    setSelectedFileUrl('')
    setSelectedFileKey('')
    setCoverImageUrl('')
    setStatus('draft')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (postType === 'article' && !selectedFileUrl) {
      setError('Select a research file for article posts.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        postType,
        status,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        articleFileUrl: postType === 'article' ? selectedFileUrl : null,
        articleStorageKey: postType === 'article' ? selectedFileKey : null,
        coverImageUrl: coverImageUrl.trim() || null,
        authorId: 'host',
      }

      const result = await createPost(payload)
      const newPost = result.post
      setPosts((current) => [newPost, ...current])
      setStats((current) => ({
        totalPosts: (current.totalPosts || 0) + 1,
        blogPosts: current.blogPosts + (newPost.postType === 'blog' ? 1 : 0),
        articlePosts: current.articlePosts + (newPost.postType === 'article' ? 1 : 0),
        drafts: current.drafts + (newPost.status === 'draft' ? 1 : 0),
      }))
      setStatusMessage('Post created successfully.')
      resetForm()
    } catch (submitError) {
      setError(submitError.message || 'Failed to create post.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <h2>EconInsight</h2>
        <nav>
          <span className="admin-nav-item admin-nav-item--active">Dashboard</span>
          <span className="admin-nav-item">Posts</span>
          <span className="admin-nav-item">Upload</span>
          <span className="admin-nav-item">Analytics</span>
          <span className="admin-nav-item">Settings</span>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Host portal</p>
            <h1>Content Dashboard</h1>
          </div>
          <span className="admin-chip">+ New Post</span>
        </header>

        <div className="admin-stats-grid">
          <article>
            <p>Total Posts</p>
            <strong>{stats.totalPosts}</strong>
          </article>
          <article>
            <p>Blog Posts</p>
            <strong>{stats.blogPosts}</strong>
          </article>
          <article>
            <p>Articles</p>
            <strong>{stats.articlePosts}</strong>
          </article>
          <article>
            <p>Drafts</p>
            <strong>{stats.drafts}</strong>
          </article>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__section">
            <h2>1) Upload source files</h2>
            <FileUpload uploaderId="host" onUploaded={refreshFiles} />
          </div>

          <div className="admin-form__section">
            <h2>2) Create post</h2>
          </div>

          <div className="admin-form__row">
            <label>
              Post type
              <select value={postType} onChange={(event) => setPostType(event.target.value)}>
                <option value="article">Article (research paper)</option>
                <option value="blog">Blog</option>
              </select>
            </label>
            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" />
          </label>

          <label>
            Excerpt
            <textarea
              rows={2}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Short summary shown on cards"
            />
          </label>

          {postType === 'article' ? (
            <label>
              Linked research file
              <select value={selectedFileUrl} onChange={handleFileSelection}>
                <option value="">Select uploaded file</option>
                {articleFiles.map((file) => (
                  <option key={file.id || file.storageKey || file.url} value={file.url}>
                    {file.filename}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            Cover image URL (optional)
            <input
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            Content
            <textarea
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Blog body or article description"
            />
          </label>

          {statusMessage ? <p className="admin-status admin-status--ok">{statusMessage}</p> : null}
          {error ? <p className="admin-status admin-status--error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Create post'}
          </button>
        </form>

        <section className="admin-posts">
          <h2>Recent posts</h2>
          {posts.length === 0 ? <p>No posts yet.</p> : null}
          <div className="admin-post-list">
            {posts.map((post) => (
              <article key={post.id} className="admin-post-item">
                <div>
                  <p className="admin-post-item__meta">
                    {post.postType.toUpperCase()} · {post.status.toUpperCase()}
                  </p>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt || 'No excerpt provided.'}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Admin
