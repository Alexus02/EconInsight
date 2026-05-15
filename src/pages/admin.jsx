import React, { useEffect, useState } from 'react'
import {
  fetchUploadedFiles,
  fetchAdminPosts,
  createPost,
  fetchCurrentAdmin,
  loginAdmin,
  clearStoredAdminSessionToken,
  deletePost as deleteAdminPost,
  updatePost as updateAdminPost,
} from '../lib/fileApi'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminPreview from '../components/admin/AdminPreview'
import AdminLogin from '../components/admin/AdminLogin'
import Dashboard from './adminPages/Dashboard'
import Posts from './adminPages/Posts'
import Analytics from './adminPages/Analytics'
import AllPosts from './adminPages/AllPosts'
import Settings from './adminPages/Settings'
import '../styles/adminStyles/admin.css'

function Admin() {
  const [authLoading, setAuthLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [loginEmail, setLoginEmail] = useState('admin@gmail.com')
  const [loginSecretKey, setLoginSecretKey] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [postType, setPostType] = useState('article')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [selectedDocUrl, setSelectedDocUrl] = useState('')
  const [selectedDocKey, setSelectedDocKey] = useState('')
  const [selectedDocLabel, setSelectedDocLabel] = useState('')
  const [selectedImageUrls, setSelectedImageUrls] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [articleLayout, setArticleLayout] = useState('default')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [allPosts, setAllPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [trackFilter, setTrackFilter] = useState('all')

  useEffect(() => {
    let active = true

    async function bootstrapAuth() {
      try {
        const admin = await fetchCurrentAdmin()
        if (!active) return

        if (admin) {
          setCurrentAdmin(admin)
        } else {
          clearStoredAdminSessionToken()
        }
      } catch (err) {
        console.error('Failed to load admin session', err)
        clearStoredAdminSessionToken()
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!currentAdmin) {
      return
    }

    let active = true

    async function loadFiles() {
      try {
        const filesResult = await fetchUploadedFiles()
        if (!active) return
        setUploadedFiles(Array.isArray(filesResult) ? filesResult : filesResult.files || [])
      } catch (err) {
        console.error('Failed to load uploaded files', err)
      }
    }

    loadFiles()

    const onFileUploaded = (event) => {
      const file = event?.detail || null
      loadFiles()
      if (file?.url) {
        pickDoc(file)
      }
    }

    window.addEventListener('file:uploaded', onFileUploaded)
    return () => {
      active = false
      window.removeEventListener('file:uploaded', onFileUploaded)
    }
  }, [currentAdmin])

  const loadAdminPosts = async () => {
    setPostsLoading(true)
    try {
      const data = await fetchAdminPosts()
      const posts = (data.posts || []).sort(
        (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
      )
      setAllPosts(posts)
    } catch (err) {
      console.error('Failed to load admin posts:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  useEffect(() => {
    if (currentAdmin) {
      loadAdminPosts()
    }
  }, [currentAdmin])

  const pickDoc = (file) => {
    setSelectedDocUrl(file.url)
    setSelectedDocKey(file.storageKey || '')
    setSelectedDocLabel(file.filename || file.url)
  }

  const submitPost = async (status = 'published') => {
    setError('')
    setStatusMessage('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (postType === 'blog' && status === 'published' && !content.trim()) {
      setError('Content is required for blog posts.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        postType,
        status,
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content: postType === 'blog' ? (content.trim() || null) : null,
        articleFileUrl: selectedDocUrl || null,
        articleStorageKey: selectedDocKey || null,
        coverImageUrl: selectedImageUrls[0] || null,
        articleImageUrls: selectedImageUrls,
        articleLayout,
        authorId: currentAdmin?.email || 'host',
      }

      if (editingPostId) {
        await updateAdminPost(editingPostId, payload)
      } else {
        await createPost(payload)
      }

      setStatusMessage(status === 'draft' ? 'Draft saved successfully.' : 'Post published successfully.')
      setTitle('')
      setCategory('')
      setExcerpt('')
      setContent('')
      setSelectedDocUrl('')
      setSelectedDocKey('')
      setSelectedDocLabel('')
      setSelectedImageUrls([])
      setArticleLayout('default')
      setEditingPostId(null)
      await loadAdminPosts()
    } catch (err) {
      setError(err.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const editPost = (post) => {
    setEditingPostId(post.id)
    setPostType(post.post_type || post.postType || 'article')
    setTitle(post.title || '')
    setExcerpt(post.excerpt || '')
    setContent(post.content || '')
    setSelectedDocUrl(post.articleFileUrl || '')
    setSelectedDocKey(post.articleStorageKey || '')
    setSelectedDocLabel(post.articleFileUrl || '')
    setSelectedImageUrls(post.articleImageUrls || [])
    setArticleLayout(post.articleLayout || 'default')
    setActivePage('posts')
  }

  const deletePost = async (post) => {
    try {
      await deleteAdminPost(post.id)
      await loadAdminPosts()
    } catch (err) {
      console.error('Failed to delete post', err)
    }
  }

  const handleAdminLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setLoginSubmitting(true)

    try {
      const response = await loginAdmin(loginEmail, loginSecretKey)
      setCurrentAdmin(response.adminUser || { email: loginEmail })
      setLoginSecretKey('')
      setActivePage('dashboard')
    } catch (err) {
      setLoginError(err.message || 'Unable to sign in.')
    } finally {
      setLoginSubmitting(false)
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    clearStoredAdminSessionToken()
    setCurrentAdmin(null)
    setUploadedFiles([])
    setAllPosts([])
    setLoginSecretKey('')
    setLoginError('')
    setActivePage('dashboard')
  }

  const selectedFile = uploadedFiles.find((file) => file.url === selectedDocUrl)

  const filteredPosts = allPosts.filter((post) => {
    const postStatus = String(post.status || 'published').toLowerCase()
    if (trackFilter === 'all') return true
    if (trackFilter === 'draft') return postStatus === 'draft'
    return (post.post_type || post.postType) === trackFilter
  })

  const recentPosts = [...allPosts]
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    .slice(0, 5)

  const stats = {
    total: allPosts.length,
    blogs: allPosts.filter((post) => (post.post_type || post.postType) === 'blog').length,
    articles: allPosts.filter((post) => (post.post_type || post.postType) === 'article').length,
    drafts: allPosts.filter((post) => String(post.status || '').toLowerCase() === 'draft').length,
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false)
      }
    }

    if (isPreviewOpen) {
      window.addEventListener('keydown', onKeyDown)
    }

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPreviewOpen])

  if (authLoading) {
    return (
      <section className="admin-page">
        <div className="admin-main" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
          Loading admin access...
        </div>
      </section>
    )
  }

  if (!currentAdmin) {
    return (
      <AdminLogin
        email={loginEmail}
        secretKey={loginSecretKey}
        loading={loginSubmitting}
        error={loginError}
        onEmailChange={setLoginEmail}
        onSecretKeyChange={setLoginSecretKey}
        onSubmit={handleAdminLogin}
      />
    )
  }

  return (
    <section className="admin-page">
      <AdminSidebar activePage={activePage} onPageChange={setActivePage} currentAdmin={currentAdmin} onLogout={handleLogout} />

      <div className="admin-main">
        {activePage === 'dashboard' && <Dashboard stats={stats} recentPosts={recentPosts} />}

        {activePage === 'posts' && (
          <Posts
            postType={postType}
            title={title}
            excerpt={excerpt}
            content={content}
            category={category}
            selectedDocUrl={selectedDocUrl}
            selectedDocLabel={selectedDocLabel}
            selectedFile={selectedFile}
            articleLayout={articleLayout}
            uploadedFiles={uploadedFiles}
            selectedImageUrls={selectedImageUrls}
            isSubmitting={isSubmitting}
            statusMessage={statusMessage}
            error={error}
            filteredPosts={filteredPosts}
            postsLoading={postsLoading}
            trackFilter={trackFilter}
            onPostTypeChange={setPostType}
            onTitleChange={setTitle}
            onExcerptChange={setExcerpt}
            onContentChange={setContent}
            onCategoryChange={setCategory}
            onDocLabelChange={(val) => setSelectedDocLabel(val)}
            onDocBlur={(event) => {
              const val = event.target.value
              const found = uploadedFiles.find((file) => file.filename === val || file.url === val)
              if (
                found &&
                ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(found.contentType)
              ) {
                pickDoc(found)
              }
            }}
            onArticleLayoutChange={setArticleLayout}
            onFileUpload={(file) => {
              if (file?.url) {
                pickDoc(file)
              }
              fetchUploadedFiles()
                .then((result) => setUploadedFiles(Array.isArray(result) ? result : result.files || []))
                .catch(() => {})
            }}
            onCoverImageChange={(url) => setSelectedImageUrls([url, ...selectedImageUrls.slice(1)])}
            onRemoveCoverImage={() => setSelectedImageUrls(selectedImageUrls.slice(1))}
            onSubmit={(event) => {
              event.preventDefault()
              submitPost('published')
            }}
            onSaveDraft={() => submitPost('draft')}
            onPreview={() => setIsPreviewOpen(true)}
            onFilterChange={setTrackFilter}
          />
        )}

        {activePage === 'analytics' && <Analytics onPageChange={setActivePage} />}
        {activePage === 'all-posts' && <AllPosts posts={allPosts} onEditPost={editPost} onDeletePost={deletePost} />}
        {activePage === 'settings' && <Settings currentAdmin={currentAdmin} />}
      </div>

      <AdminPreview
        isOpen={isPreviewOpen}
        title={title}
        postType={postType}
        articleLayout={articleLayout}
        selectedDocUrl={selectedDocUrl}
        selectedDocLabel={selectedDocLabel}
        selectedFile={selectedFile}
        excerpt={excerpt}
        content={content}
        onClose={() => setIsPreviewOpen(false)}
      />
    </section>
  )
}

export default Admin
