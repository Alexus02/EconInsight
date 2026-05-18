import React, { useEffect, useState } from 'react'
import {
  fetchUploadedFiles,
  fetchAdminPosts,
  fetchAdminBookings,
  fetchAdminMessages,
  createPost,
  fetchCurrentAdmin,
  loginAdmin,
  clearStoredAdminSessionToken,
  deletePost as deleteAdminPost,
  updatePost as updateAdminPost,
  respondToBooking,
  deleteBooking,
  deleteAdminMessage,
} from '../lib/fileApi'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminPreview from '../components/admin/AdminPreview'
import AdminLogin from '../components/admin/AdminLogin'
import NotificationPopup from '../components/NotificationPopup'
import SkeletonLoader from '../components/SkeletonLoader'
import Dashboard from './adminPages/Dashboard'
import Posts from './adminPages/Posts'
import Bookings from './adminPages/Bookings'
import Messages from './adminPages/Messages'
import Analytics from './adminPages/Analytics'
import AllPosts from './adminPages/AllPosts'
import Settings from './adminPages/Settings'
import '../styles/adminStyles/admin.css'

function Admin() {
  const [authLoading, setAuthLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [loginEmail, setLoginEmail] = useState('hello@econinsight.com')
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
  const [notification, setNotification] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [allPosts, setAllPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
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
      } catch {
        // Intentionally silent in production.
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
      } catch {
        // Intentionally silent in production.
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
    } catch {
      // Intentionally silent in production.
    } finally {
      setPostsLoading(false)
    }
  }

  const loadAdminBookings = async () => {
    setBookingsLoading(true)
    try {
      const data = await fetchAdminBookings()
      const bookingRows = (data.bookings || []).sort(
        (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
      )
      setBookings(bookingRows)
    } catch {
      // Intentionally silent in production.
    } finally {
      setBookingsLoading(false)
    }
  }

  const loadAdminMessages = async () => {
    setMessagesLoading(true)
    try {
      const data = await fetchAdminMessages()
      const messageRows = (data.messages || []).sort(
        (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
      )
      setMessages(messageRows)
    } catch {
      // Intentionally silent in production.
    } finally {
      setMessagesLoading(false)
    }
  }

  function pickDoc(file) {
    setSelectedDocUrl(file.url)
    setSelectedDocKey(file.storageKey || '')
    setSelectedDocLabel(file.filename || file.url)
  }

  useEffect(() => {
    if (currentAdmin) {
      loadAdminPosts()
      loadAdminBookings()
      loadAdminMessages()
    }
  }, [currentAdmin])

  useEffect(() => {
    if (!notification) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setNotification(null)
    }, 4500)

    return () => window.clearTimeout(timer)
  }, [notification])

  const submitPost = async (status = 'published') => {
    setError('')
    setStatusMessage('')
    setNotification(null)

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

      const successMessage = status === 'draft' ? 'Draft saved successfully.' : 'Post published successfully.'
      setStatusMessage(successMessage)
      setNotification({
        type: 'success',
        title: status === 'draft' ? 'Draft saved' : 'Post published',
        message: successMessage,
      })
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
      const message = err.message || 'Failed to create post'
      setError(message)
      setNotification({
        type: 'error',
        title: 'Publish failed',
        message,
      })
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
    } catch {
      // Intentionally silent in production.
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
    setBookings([])
    setMessages([])
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
        <div className="admin-main admin-main--loading">
          <div className="admin-loading-shell" aria-label="Loading admin access">
            <SkeletonLoader variant="title" className="admin-loading-shell__title" />
            <div className="admin-loading-shell__grid">
              <SkeletonLoader variant="small-rect" />
              <SkeletonLoader variant="small-rect" />
              <SkeletonLoader variant="small-rect" />
            </div>
            <SkeletonLoader variant="rect" className="admin-loading-shell__panel" />
          </div>
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
      {notification ? (
        <NotificationPopup
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      ) : null}

      <AdminSidebar activePage={activePage} onPageChange={setActivePage} currentAdmin={currentAdmin} onLogout={handleLogout} />

      <div className="admin-main">
        {activePage === 'dashboard' && <Dashboard stats={stats} recentPosts={recentPosts} loading={postsLoading} />}

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

        {activePage === 'bookings' && (
          <Bookings
            bookings={bookings}
            loading={bookingsLoading}
            currentAdmin={currentAdmin}
            onRespondBooking={(bookingId, payload) => respondToBooking(bookingId, payload)}
            onReloadBookings={loadAdminBookings}
            onDeleteBooking={async (bookingId) => {
              try {
                await deleteBooking(bookingId)
              } catch (err) {
                throw err
              }
            }}
          />
        )}

        {activePage === 'messages' && (
          <Messages
            messages={messages}
            loading={messagesLoading}
            currentAdmin={currentAdmin}
            onDeleteMessage={async (messageId) => {
              try {
                await deleteAdminMessage(messageId)
                await loadAdminMessages()
              } catch (err) {
                throw err
              }
            }}
          />
        )}

        {activePage === 'analytics' && <Analytics onPageChange={setActivePage} />}
        {activePage === 'all-posts' && <AllPosts posts={allPosts} loading={postsLoading} onEditPost={editPost} onDeletePost={deletePost} />}
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
