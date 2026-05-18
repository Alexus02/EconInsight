import React, { useEffect, useMemo, useState } from 'react'
import { fetchAdminPosts } from '../../lib/fileApi'
import '../../styles/adminStyles/analytics.css'
import LineChart from '../../components/admin/LineChart'
import SkeletonLoader from '../../components/SkeletonLoader'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://econinsight-api.corporate-affairs.workers.dev'

const ANALYTICS_POSTS_CACHE_KEY = 'econinsight.analytics.posts.v1'

let analyticsPostsMemoryCache = {
  signature: '',
  posts: null,
}

function buildPostsSignature(posts) {
  const normalized = [...(Array.isArray(posts) ? posts : [])]
    .map((post) => ({
      id: post.id ?? null,
      title: post.title ?? '',
      status: String(post.status || 'published').toLowerCase(),
      postType: post.post_type || post.postType || '',
      viewCount: post.view_count || post.viewCount || 0,
      createdAt: post.created_at || post.createdAt || '',
      updatedAt: post.updated_at || post.updatedAt || '',
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))

  return JSON.stringify(normalized)
}

function readPostsCache() {
  if (analyticsPostsMemoryCache.posts) {
    return analyticsPostsMemoryCache
  }

  try {
    const raw = window.sessionStorage.getItem(ANALYTICS_POSTS_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.posts) || typeof parsed.signature !== 'string') {
      return null
    }

    analyticsPostsMemoryCache = {
      signature: parsed.signature,
      posts: parsed.posts,
    }

    return analyticsPostsMemoryCache
  } catch {
    return null
  }
}

function writePostsCache(posts, signature) {
  analyticsPostsMemoryCache = { signature, posts }

  try {
    window.sessionStorage.setItem(
      ANALYTICS_POSTS_CACHE_KEY,
      JSON.stringify({ posts, signature })
    )
  } catch {
    // Ignore storage errors and continue with in-memory cache only.
  }
}

function Analytics({ onPageChange = () => {} }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cached = readPostsCache()
    if (cached?.posts?.length) {
      setPosts(cached.posts)
      setLoading(false)
    }

    const loadData = async () => {
      try {
        const data = await fetchAdminPosts()
        const fetchedPosts = data.posts || []
        const nextSignature = buildPostsSignature(fetchedPosts)
        const previousSignature = cached?.signature || analyticsPostsMemoryCache.signature

        if (nextSignature !== previousSignature) {
          setPosts(fetchedPosts)
          writePostsCache(fetchedPosts, nextSignature)
        }

        setError('')
      } catch {
        // Intentionally silent in production.
        if (!cached?.posts?.length) {
          setError('Failed to load analytics data')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const {
    publishedPosts,
    draftPosts,
    blogs,
    articles,
    totalViews,
    avgViews,
    topPosts,
    blogViews,
    articleViews,
  } = useMemo(() => {
    const published = posts.filter((post) => String(post.status || 'published').toLowerCase() === 'published')
    const drafts = posts.filter((post) => String(post.status || 'published').toLowerCase() === 'draft')
    const blogPosts = posts.filter((post) => (post.post_type || post.postType) === 'blog')
    const articlePosts = posts.filter((post) => (post.post_type || post.postType) === 'article')

    const total = posts.reduce((sum, post) => sum + (post.view_count || post.viewCount || 0), 0)
    const average = posts.length > 0 ? Math.round(total / posts.length) : 0

    const ranked = [...published]
      .sort((a, b) => (b.view_count || b.viewCount || 0) - (a.view_count || a.viewCount || 0))
      .slice(0, 10)

    const blogTotal = blogPosts.reduce((sum, post) => sum + (post.view_count || post.viewCount || 0), 0)
    const articleTotal = articlePosts.reduce((sum, post) => sum + (post.view_count || post.viewCount || 0), 0)

    return {
      publishedPosts: published,
      draftPosts: drafts,
      blogs: blogPosts,
      articles: articlePosts,
      totalViews: total,
      avgViews: average,
      topPosts: ranked,
      blogViews: blogTotal,
      articleViews: articleTotal,
    }
  }, [posts])

  if (loading) {
    return (
      <div className="analytics-page analytics-page--loading" aria-label="Loading analytics">
        <SkeletonLoader variant="title" className="analytics-skeleton__title" />
        <div className="analytics-skeleton__cards">
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
        </div>
        <SkeletonLoader variant="rect" className="analytics-skeleton__chart" />
        <SkeletonLoader variant="rect" className="analytics-skeleton__table" />
      </div>
    )
  }

  if (error) {
    return <div className="analytics-page"><div className="analytics-error">{error}</div></div>
  }

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card__label">Total Posts</div>
          <div className="analytics-card__value">{posts.length}</div>
          <div className="analytics-card__detail">{publishedPosts.length} published, {draftPosts.length} drafts</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__label">Total Views</div>
          <div className="analytics-card__value">{totalViews.toLocaleString()}</div>
          <div className="analytics-card__detail">{avgViews} average per post</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__label">Blog Posts</div>
          <div className="analytics-card__value">{blogs.length}</div>
          <div className="analytics-card__detail">{blogViews.toLocaleString()} total views</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__label">Articles</div>
          <div className="analytics-card__value">{articles.length}</div>
          <div className="analytics-card__detail">{articleViews.toLocaleString()} total views</div>
        </div>
      </div>

      <div className="analytics-section">
        <LineChart apiBase={API_BASE_URL} days={30} />

        <div className='analytics-details'>
          <h2>Top Performing Posts</h2>
          <button type="button" onClick={() => onPageChange('all-posts')}>View all posts</button>
        </div>
        
        {topPosts.length === 0 ? (
          <p className="analytics-empty">No published posts yet</p>
        ) : (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Views</th>
                <th>Published Date</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post) => (
                <tr key={post.id}>
                  <td className="analytics-table__title">{post.title}</td>
                  <td className="analytics-table__type">
                    <span className={`analytics-badge analytics-badge--${post.post_type || post.postType}`}>
                      {post.post_type === 'blog' || post.postType === 'blog' ? 'Blog' : 'Article'}
                    </span>
                  </td>
                  <td className="analytics-table__views">{(post.view_count || post.viewCount || 0).toLocaleString()}</td>
                  <td className="analytics-table__date">
                    {new Date(post.created_at || post.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default Analytics
