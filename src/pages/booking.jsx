import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createBooking } from '../lib/fileApi'
import NotificationPopup from '../components/NotificationPopup'
import '../styles/booking.css'
import bookingHero from '../assets/consultation.jpg'

function formatDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getDefaultBookingTime() {
  const nextDay = new Date()
  nextDay.setDate(nextDay.getDate() + 1)
  nextDay.setHours(10, 0, 0, 0)
  return formatDateTimeLocal(nextDay)
}

function getInitialFormState() {
  return {
    fullName: '',
    email: '',
    company: '',
    requestedAt: getDefaultBookingTime(),
    message: '',
  }
}

function Booking() {
  const [formData, setFormData] = useState(getInitialFormState)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

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

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.requestedAt || !formData.message.trim()) {
      setNotification({
        type: 'error',
        title: 'Message not sent',
        message: 'Please complete your name, email, time, and message.',
      })
      return
    }

    setLoading(true)
    try {
      await createBooking({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim() || null,
        requestedAt: formData.requestedAt,
        message: formData.message.trim(),
      })

      setNotification({
        type: 'success',
        title: 'Booking successful',
        message: 'Your consultation request has been sent. We will review it and respond by email.',
      })
      setFormData(getInitialFormState())
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Message not sent',
        message: err.message || 'Try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="booking-page">
      {notification ? (
        <NotificationPopup
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      ) : null}

      <section className="booking-hero">
        <div className="booking-hero__content">
          <p className="booking-kicker">Book a consultation</p>
          <h1>Choose a time that works for you.</h1>
          <p>
            Tell us what you need, pick a time, and we will follow up by email with the next steps.
          </p>

          <div className="booking-hero__actions">
            <Link to="/services" className="button button--secondary">
              Back to services
            </Link>
          </div>
        </div>

        <div className="booking-hero__media">
          <img src={bookingHero} alt="Consultation planning" className="booking-hero__image" />
        </div>
      </section>

      <section className="booking-layout">
        <form className="booking-form-card" onSubmit={handleSubmit}>
          <div className="booking-form-card__header">
            <h2>Request your booking</h2>
            <p>Fields marked by email and time are required. Company is optional.</p>
          </div>

          <div className="booking-form-grid">
            <label>
              Full name
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            <label>
              Company <span className="booking-form__optional">(optional)</span>
              <input
                type="text"
                value={formData.company}
                onChange={(event) => updateField('company', event.target.value)}
                placeholder="Your company or organization"
              />
            </label>

            <label>
              Preferred time
              <input
                type="datetime-local"
                value={formData.requestedAt}
                onChange={(event) => updateField('requestedAt', event.target.value)}
                required
              />
            </label>

            <label className="booking-form__message-field">
              Message
              <textarea
                rows="6"
                value={formData.message}
                onChange={(event) => updateField('message', event.target.value)}
                placeholder="Tell us about the problem you want to solve."
                required
              />
            </label>
          </div>

          <button type="submit" className="button button--primary booking-form__submit" disabled={loading}>
            {loading ? 'Booking...' : 'Book consultation'}
          </button>
        </form>

        <aside className="booking-aside">
          <div className="booking-aside__card">
            <h3>What happens next</h3>
            <ul>
              <li>We store your request in the admin booking inbox.</li>
              <li>The logged-in admin can accept and respond to your request.</li>
              <li>You will receive the reply at the email address you provide.</li>
            </ul>
          </div>

          <div className="booking-aside__card booking-aside__card--muted">
            <h3>Need to talk sooner?</h3>
            <p>Use the services page if you want to review the consulting options before booking.</p>
            <Link to="/services" className="button button--secondary booking-aside__button">
              View services
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default Booking