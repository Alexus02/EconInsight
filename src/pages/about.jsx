import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/about.css'

const About = () => {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#contact') {
      const contactSection = document.getElementById('contact')

      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [location.hash])

  return (
    <div className="page page--about">
      <section className="hero hero--about">
        <div className="hero__content">
          <p className="eyebrow">Who We Are</p>
          <h1>About EconInsight</h1>
          <p className="lead">
            We are a team of economists dedicated to producing world-class economic research, market intelligence,
            and advisory services for Africa and beyond.
          </p>
          <div className="hero__actions">
            <Link to="/about#contact" className="button button--primary">
              Contact our team
            </Link>
            <Link to="/services" className="button button--secondary">
              Explore services
            </Link>
          </div>
          <div className="stats-grid">
            <article>
              <strong>12+</strong>
              <span>years of research experience</span>
            </article>
            <article>
              <strong>40+</strong>
              <span>market and policy briefs</span>
            </article>
            <article>
              <strong>3 regions</strong>
              <span>served with tailored insights</span>
            </article>
          </div>
        </div>

        <div className="hero__visual hero__visual--portrait" aria-label="Team portrait placeholder">
          <span>Image placeholder</span>
        </div>
      </section>

      <section className="about-section">
        <div className="section-heading">
          <p className="eyebrow">What We Do</p>
          <h2>Research that helps leaders make clearer decisions</h2>
        </div>
        <div className="card-grid">
          <article className="info-card">
            <h3>Economic research</h3>
            <p>We translate complex macroeconomic trends into practical insight for business and policy teams.</p>
          </article>
          <article className="info-card">
            <h3>Market intelligence</h3>
            <p>We track signals that matter, from sector shifts to consumer behavior and competitive movement.</p>
          </article>
          <article className="info-card">
            <h3>Advisory support</h3>
            <p>We partner with organizations to shape strategy, validate assumptions, and stress-test decisions.</p>
          </article>
        </div>
      </section>

      <section className="about-section about-section--split">
        <div className="section-media section-media--wide" aria-label="Research workspace placeholder">
          <span>Image placeholder</span>
        </div>
        <div className="section-copy">
          <p className="eyebrow">Our Approach</p>
          <h2>We combine rigor with context</h2>
          <p>
            Every engagement starts with the problem, not the format. We build analysis that is grounded in data,
            shaped by local realities, and delivered in a way that decision-makers can actually use.
          </p>
          <ul className="feature-list">
            <li>Evidence-led analysis</li>
            <li>Clear, decision-ready reporting</li>
            <li>Flexible support for teams of different sizes</li>
          </ul>
        </div>
      </section>

      <section className="about-section contact-section" id="contact">
        <div className="section-heading">
          <p className="eyebrow">Get In Touch</p>
          <h2>Start a conversation with EconInsight</h2>
        </div>
        <div className="contact-layout">
          <form className="contact-form">
            <div className="form-row">
              <label>
                First name
                <input type="text" name="firstName" placeholder="Jane" />
              </label>
              <label>
                Last name
                <input type="text" name="lastName" placeholder="Smitherton" />
              </label>
            </div>
            <label>
              Email address
              <input type="email" name="email" placeholder="email@econinsight.net" />
            </label>
            <label>
              Your message
              <textarea name="message" rows="6" placeholder="Enter your question or message" />
            </label>
            <button type="submit" className="button button--primary button--full">
              Submit
            </button>
          </form>

          <aside className="contact-panel">
            <div className="contact-panel__visual" aria-hidden="true">
              Image placeholder
            </div>
            <div>
              <h3>Tell us what you need</h3>
              <p>
                Whether you need a research brief, a market scan, or long-term advisory support, we can shape the
                engagement around your goals.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default About
