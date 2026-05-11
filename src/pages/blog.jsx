import { useEffect, useState } from 'react'
import { fetchPublishedPosts } from '../lib/fileApi'
import '../styles/posts.css'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadPosts() {
      try {
        const result = await fetchPublishedPosts('blog')
        if (active) {
          setPosts(result.posts || [])
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load blog posts.')
        }
      }
    }
    loadPosts()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="posts-page">
      <div className="posts-page__intro">
        <p className="posts-kicker">Insights</p>
        <h1>Blog</h1>
      </div>

      {error ? <p className="posts-state posts-state--error">{error}</p> : null}
      {posts.length === 0 ? <p className="posts-state">No blog posts published yet.</p> : null}

      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <h2>{post.title}</h2>
            <p>{post.excerpt || 'No summary available.'}</p>
            <div className="post-card__content">{post.content || ''}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Blog
