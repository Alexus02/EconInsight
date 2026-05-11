import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchUploadedFiles, fetchAdminPosts } from '../lib/fileApi'
import SkeletonLoader from '../components/SkeletonLoader'
import '../styles/home.css'

const Home = () => {
  const [latestResearch, setLatestResearch] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [filesData, postsData] = await Promise.all([
          fetchUploadedFiles(),
          fetchAdminPosts(),
        ])

        const files = Array.isArray(filesData) ? filesData : filesData.files || []
        setLatestResearch(files.slice(0, 4))

        const posts = postsData.posts || []
        const publishedPosts = posts.filter(p => p.status === 'published' && p.post_type === 'blog').slice(0, 3)
        setTestimonials(publishedPosts)
      } catch (error) {
        console.error('Error loading home page data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
          <div className="placeholder-image placeholder-large">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="300" fill="#e5e5e5" />
              <text x="200" y="150" textAnchor="middle" fontSize="16" fill="#999">Hero Image</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="why-choose-us">
        <div className="why-choose-us__media">
          <div className="placeholder-image placeholder-medium">
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="400" fill="#e5e5e5" />
              <text x="200" y="200" textAnchor="middle" fontSize="16" fill="#999">Why Choose Us Image</text>
            </svg>
          </div>
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

      <section className="latest-research">
        <div className="section-header">
          <h2>Latest Research</h2>
          <p>Explore our most recent economic research and publications</p>
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
        ) : latestResearch.length > 0 ? (
          <div className="research-grid">
            {latestResearch.map(research => (
              <Link key={research.id} to={`/articles/${research.id}`} className="research-card">
                <div className="research-card__media">
                  <div className="placeholder-image placeholder-small">
                    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                      <rect width="300" height="200" fill="#e5e5e5" />
                      <text x="150" y="100" textAnchor="middle" fontSize="12" fill="#999">Document</text>
                    </svg>
                  </div>
                </div>
                <div className="research-card__content">
                  <h3>{research.filename}</h3>
                  <p className="views-badge"><span className="badge-icon">👁️</span>{research.view_count || 0} views</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">No research available yet. Check back soon!</p>
        )}
        <div className="section-cta">
          <Link to="/research" className="button button--secondary">View All Research</Link>
        </div>
      </section>

      <section className="home-services">
        <div className="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive economic research and consulting solutions</p>
        </div>
        <div className="services-preview-grid">
          <div className="service-card">
            <div className="service-icon">📊</div>
            <h3>Economic Research</h3>
            <p>In-depth analysis of economic trends, market dynamics, and policy impacts</p>
          </div>
          <div className="service-card">
            <div className="service-icon">📈</div>
            <h3>Market Intelligence</h3>
            <p>Competitive analysis, market sizing, and opportunity assessment</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🎯</div>
            <h3>Strategic Consulting</h3>
            <p>Business strategy development informed by economic expertise</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🔍</div>
            <h3>Policy Analysis</h3>
            <p>Government policy evaluation and impact assessment</p>
          </div>
        </div>
        <div className="section-cta">
          <Link to="/services" className="button button--secondary">Explore All Services</Link>
        </div>
      </section>

      <section className="testimonials">
        <div className="section-header">
          <h2>What Clients Say</h2>
          <p>Feedback from organizations we've worked with</p>
        </div>
        {loading ? (
          <div className="testimonials-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="testimonial-skeleton">
                <SkeletonLoader variant="text" style={{ width: '100%', marginBottom: '12px' }} />
                <SkeletonLoader variant="text" style={{ width: '100%', marginBottom: '12px' }} />
                <SkeletonLoader variant="text" style={{ width: '70%', marginBottom: '16px' }} />
                <SkeletonLoader variant="text" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="testimonials-grid">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-quote">"{testimonial.excerpt || testimonial.content}"</div>
                <div className="testimonial-author">{testimonial.title}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="testimonials-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="testimonial-skeleton">
                <SkeletonLoader variant="text" style={{ width: '100%', marginBottom: '12px' }} />
                <SkeletonLoader variant="text" style={{ width: '100%', marginBottom: '12px' }} />
                <SkeletonLoader variant="text" style={{ width: '70%', marginBottom: '16px' }} />
                <SkeletonLoader variant="text" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        )}
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
