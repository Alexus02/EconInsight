import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import NotificationPopup from '../components/NotificationPopup'
import { createContactSubmission } from '../lib/fileApi'
import '../styles/about.css'
import aboutHero from '../assets/econInshigt.webp'

function getInitialContactForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  }
}

const About = () => {
  const location = useLocation()
  const [formData, setFormData] = useState(getInitialContactForm)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (location.hash === '#contact') {
      const contactSection = document.getElementById('contact')

      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [location.hash])

  useEffect(() => {
    if (!notification) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setNotification(null)
    }, 4500)

    return () => window.clearTimeout(timer)
  }, [notification])

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const firstName = formData.firstName.trim()
    const lastName = formData.lastName.trim()
    const email = formData.email.trim()
    const message = formData.message.trim()

    if (!firstName || !lastName || !email || !message) {
      setNotification({
        type: 'error',
        title: 'Message not sent',
        message: 'Please complete your name, email, and message before submitting.',
      })
      return
    }

    try {
      await createContactSubmission({
        firstName,
        lastName,
        email,
        message,
      })

      setNotification({
        type: 'success',
        title: 'Message sent',
        message: 'Thanks for reaching out. We will review your message and reply by email.',
      })
      setFormData(getInitialContactForm())
    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Message not sent',
        message: error.message || 'Try again.',
      })
    }
  }

  return (
    <div className="page page--about">
      {notification ? (
        <NotificationPopup
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      ) : null}

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
          <img src={aboutHero} alt="Hero image" className='about-hero'/>
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



      <section className="about-section contact-section" id="contact">
        <div className="section-heading">
          <p className="eyebrow">Get In Touch</p>
          <h2>Start a conversation with EconInsight</h2>
        </div>
        <div className="contact-layout">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                First name
                <input
                  type="text"
                  name="firstName"
                  placeholder="Jane"
                  value={formData.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  name="lastName"
                  placeholder="Smitherton"
                  value={formData.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="email@econinsight.net"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>
            <label>
              Your message
              <textarea
                name="message"
                rows="6"
                placeholder="Enter your question or message"
                value={formData.message}
                onChange={(event) => updateField('message', event.target.value)}
                required
              />
            </label>
            <button type="submit" className="button button--primary button--full">
              Send message
            </button>
          </form>

          
        </div>
      </section>
    </div>
  )
}

export default About
