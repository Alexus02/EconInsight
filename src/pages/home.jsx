import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublishedPosts } from '../lib/fileApi'
import SkeletonLoader from '../components/SkeletonLoader'
import '../styles/home.css'
import heroImage from '../assets/hero-money.jpg'
import secondaryImage from '../assets/econInsight.jpg'
import serviceImg1 from '../assets/market-research.jpg'
import serviceImg4 from '../assets/consultation.jpg'
import serviceImg3 from '../assets/policy-analysis.jpg'
import serviceImg2 from '../assets/strategic-consultation.jpg'

const Home = () => {
  const [latestPosts, setLatestPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPublishedPosts('article')
        const posts = (data.posts || []).sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
        setLatestPosts(posts.slice(0, 4))
      } catch {
        // Intentionally silent in production.
      } finally {
        setLoading(false)
      }
    }

    loadData()

    const onFileUploaded = () => {
      loadData()
    }

    window.addEventListener('file:uploaded', onFileUploaded)

    return () => {
      window.removeEventListener('file:uploaded', onFileUploaded)
    }
  }, [])

  return (
    <div className="page page--home">
      
      <section className="hero hero--home">
        <div className="hero__content">
          <h1 className="hero__title">Economic Insights for Better Decisions</h1>
          <p className="hero__subtitle">Cutting-edge economic research, market analysis, and strategic consulting services tailored for Africa's dynamic markets</p>
          <div className="hero__actions">
            <Link to="/research" className="button button--primary">Explore Research</Link>
            <Link to="/services" className="button button--secondary">Our Services</Link>
          </div>
        </div>
        <div className="hero__media">
          <img src={heroImage} alt="EconInsight" className="hero__image" />
        </div>
      </section>

      <section className="latest-research">
        <div className="section-header">
          <h2>Latest Posts</h2>
          <p>Explore our most recent blog posts and research articles</p>
        </div>
        {loading ? (
          <div className="research-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="research-card-skeleton">
                <SkeletonLoader variant="rect" style={{ height: '200px', marginBottom: '16px' }} />
                <SkeletonLoader variant="text" style={{ width: '90%', marginBottom: '8px' }} />
                <SkeletonLoader variant="text" style={{ width: '70%' }} />
              </div>
            ))}
          </div>
        ) : latestPosts.length > 0 ? (
          <div className="research-grid">
            {latestPosts.map(post => (
              <Link key={post.id} to={`/posts/${post.id}`} className="research-card">
                <div className="research-card__media">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt={post.title} className="research-card__image" />
                  ) : (
                    <div className="placeholder-image placeholder-small">
                      <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                        <rect width="300" height="200" fill="#e5e5e5" />
                        <text x="150" y="100" textAnchor="middle" fontSize="12" fill="#999">{post.postType === 'article' ? 'Research' : 'Blog'}</text>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="research-card__content">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt || (post.content || '').slice(0, 120)}</p>
                  <p className="views-badge">
                    <span className="badge-icon">{post.postType === 'article' ? '📄' : '✍️'}</span>
                    {post.postType === 'article' ? 'Research article' : 'Blog post'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">No posts available yet. Check back soon!</p>
        )}
        <div className="section-cta">
          <Link to="/blog" className="button button--secondary">View All Posts</Link>
        </div>
      </section>
 
      <section className="why-choose-us">
        <div className="why-choose-us__media">
          <img src={secondaryImage} alt="Why Choose EconInsight" className="why-choose-us__image" />
        </div>
        <div className="why-choose-us__content">
          <h2>Why Choose EconInsight</h2>
          <p className="lead">We combine rigorous economic analysis with practical business intelligence to provide actionable insights that drive strategic decision-making.</p>
          <ul className="benefits-list">
            <li><strong>Expert Economists:</strong> Our team brings decades of combined experience</li>
            <li><strong>Data-Driven Insights:</strong> We leverage advanced analytics and latest data</li>
            <li><strong>African Focus:</strong> Deep expertise in African markets</li>
            <li><strong>Timely Analysis:</strong> Rapid response to emerging trends</li>
          </ul>
        </div>
      </section>


      <section className="home-services">
        <div className="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive economic research and consulting solutions</p>
        </div>
        <div className="services-preview-grid">
          <div className="home-service-card">
            <div className="home-service-card__icon">
              <img src={serviceImg1} alt="Economic Research" className='home-service-card__image'/>
            </div>
            <div className='home-service-card__description'>
            <h3>Economic Research</h3>
            <p>In-depth analysis of economic trends, market dynamics, and policy impacts</p>
          </div>
                    </div>
          <div className="home-service-card">
            <div className="home-service-card__icon">
              <img src={serviceImg2} alt="Market Intelligence" className='home-service-card__image'/>
            </div>
            <div className='home-service-card__description'>
            <h3>Market Intelligence</h3>
            <p>Competitive analysis, market sizing, and opportunity assessment</p>
          </div>
          </div>
          <div className="home-service-card">
            <div className="home-service-card__icon">
                  <img src={serviceImg3} alt="Policy Analysis" className='home-service-card__image'/>
                </div>
            <div className='home-service-card__description'>
            <h3>Policy Analysis</h3>
            <p>Government policy evaluation and impact assessment</p>
          </div>
          </div>
          <div className="home-service-card">
            <div className="home-service-card__icon">
              <img src={serviceImg4} alt="Strategic Consulting" className='home-service-card__image' />
            </div>
            <div className='home-service-card__description'>
            <h3>Strategic Consulting</h3>
            <p>Business strategy development informed by economic expertise</p>
          </div>
          </div>
        </div>
        <div className="section-cta">
          <Link to="/services" className="button button--secondary">Explore All Services</Link>
        </div>
      </section>

      <section className="home-cta">
        <h2>Ready to Get Started?</h2>
        <p>Contact our team to discuss your research and consulting needs</p>
        <Link to="/about#contact" className="button button--primary button--large">Get In Touch</Link>
      </section>
      </div>
  )
}



export default Home
