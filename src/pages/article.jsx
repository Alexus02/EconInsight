import { useEffect, useState } from 'react'
import { fetchPublishedPosts } from '../lib/fileApi'
import '../styles/posts.css'

const Article = () => {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadPosts() {
      try {
        const result = await fetchPublishedPosts('article')
        if (active) {
          setPosts(result.posts || [])
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load article posts.')
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
        <p className="posts-kicker">Research</p>
        <h1>Articles</h1>
      </div>

      {error ? <p className="posts-state posts-state--error">{error}</p> : null}
      {posts.length === 0 ? <p className="posts-state">No research articles published yet.</p> : null}

      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <h2>{post.title}</h2>
            <p>{post.excerpt || 'No summary available.'}</p>
            {post.articleFileUrl ? (
              <a className="post-card__link" href={post.articleFileUrl} target="_blank" rel="noreferrer">
                Open research file
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default Article
