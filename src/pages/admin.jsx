import React, { useEffect, useState } from 'react'
import { fetchUploadedFiles, fetchAdminPosts, createPost } from '../lib/fileApi'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminPreview from '../components/admin/AdminPreview'
import Dashboard from './adminPages/Dashboard'
import Posts from './adminPages/Posts'
import Analytics from './adminPages/Analytics'
import Settings from './adminPages/Settings'
import '../styles/admin.css'

function Admin() {
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
  const [allPosts, setAllPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [trackFilter, setTrackFilter] = useState('all')
  

  useEffect(() => {
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

    const onFileUploaded = (e) => {
      const file = e?.detail || null
      // refresh list
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
  }, [])

  const loadAdminPosts = async () => {
    setPostsLoading(true)
    try {
      const data = await fetchAdminPosts()
      const posts = (data.posts || []).sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
      setAllPosts(posts)
    } catch (err) {
      console.error('Failed to load admin posts:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  useEffect(() => {
    loadAdminPosts()
  }, [])

  const pickDoc = (file) => {
    setSelectedDocUrl(file.url)
    setSelectedDocKey(file.storageKey || '')
    setSelectedDocLabel(file.filename || file.url)
  }

  const toggleImageSelection = (url) => {
    setSelectedImageUrls((current) => (current.includes(url) ? current.filter((u) => u !== url) : [...current, url]))
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
        authorId: 'host',
      }

      await createPost(payload)
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
      await loadAdminPosts()
    } catch (err) {
      setError(err.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedFile = uploadedFiles.find((f) => f.url === selectedDocUrl)
  const previewLabel = postType === 'article' ? 'Research article' : 'Blog post'
  const previewBody = postType === 'blog' ? (content || 'Your blog body will appear here.') : (content || 'No body is required for an article.')
  const previewExcerpt = postType === 'blog' ? excerpt : 'Excerpt is not required for research articles.'
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

  return (
    <section className="admin-page">
      <AdminSidebar activePage={activePage} onPageChange={setActivePage} />

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
            onDocBlur={(e) => {
              const val = e.target.value
              const found = uploadedFiles.find((f) => f.filename === val || f.url === val)
              if (found && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(found.contentType)) {
                pickDoc(found)
              }
            }}
            onArticleLayoutChange={setArticleLayout}
            onFileUpload={(file) => {
              if (file?.url) {
                pickDoc(file)
              }
              fetchUploadedFiles()
                .then((r) => setUploadedFiles(Array.isArray(r) ? r : r.files || []))
                .catch(() => {})
            }}
            onCoverImageChange={(url) => setSelectedImageUrls([url, ...selectedImageUrls.slice(1)])}
            onRemoveCoverImage={() => setSelectedImageUrls(selectedImageUrls.slice(1))}
            onSubmit={(ev) => {
              ev.preventDefault()
              submitPost('published')
            }}
            onSaveDraft={() => submitPost('draft')}
            onPreview={() => setIsPreviewOpen(true)}
            onFilterChange={setTrackFilter}
          />
        )}

        {activePage === 'analytics' && <Analytics />}
        {activePage === 'settings' && <Settings />}
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
