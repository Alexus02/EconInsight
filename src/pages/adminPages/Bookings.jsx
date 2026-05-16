import React, { useEffect, useMemo, useState } from 'react'
import SkeletonLoader from '../../components/SkeletonLoader'
import NotificationPopup from '../../components/NotificationPopup'
import '../../styles/adminStyles/bookings.css'

function formatBookingTime(value) {
  if (!value) return 'No time selected'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Bookings({
  bookings = [],
  loading = false,
  currentAdmin = null,
  onRespondBooking = async () => {},
  onReloadBookings = async () => {},
  onDeleteBooking = async () => {},
}) {
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [notification, setNotification] = useState({ visible: false, type: 'success', title: '', message: '' })

  useEffect(() => {
    if (!selectedBookingId && bookings.length > 0) {
      setSelectedBookingId(String(bookings[0].id))
    }
  }, [bookings, selectedBookingId])

  const selectedBooking = useMemo(
    () => bookings.find((booking) => String(booking.id) === String(selectedBookingId)) || null,
    [bookings, selectedBookingId]
  )

  useEffect(() => {
    if (!selectedBooking) {
      setSubject('')
      setMessage('')
      return
    }

    setSubject(selectedBooking.adminResponseSubject || `Consultation response from EconInsight`)
    setMessage(
      selectedBooking.adminResponseMessage ||
        `Hello ${selectedBooking.fullName || 'there'},\n\nThank you for your consultation request. We have reviewed your preferred time and would like to proceed with your booking.\n\nBest regards,\nEconInsight`
    )
  }, [selectedBooking?.id])

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((booking) => String(booking.status || 'pending').toLowerCase() === 'pending').length
    const accepted = bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'accepted').length
    const responded = bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'responded').length
    return { pending, accepted, responded, total: bookings.length }
  }, [bookings])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedBooking) return

    setError('')
    setSuccessMessage('')
    setSubmitting(true)

    try {
      await onRespondBooking(selectedBooking.id, {
        subject: subject.trim(),
        message: message.trim(),
        status: 'accepted',
      })

      await onReloadBookings()
      setSuccessMessage(`Response sent to ${selectedBooking.email} using ${currentAdmin?.email || 'the current admin account'}.`)
    } catch (err) {
      setError(err.message || 'Unable to send the response.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!selectedBooking) return
    setConfirmingDelete(true)
  }

  const confirmDelete = async () => {
    if (!selectedBooking) return
    setError('')
    setSuccessMessage('')
    setDeleteInProgress(true)

    try {
      await onDeleteBooking(selectedBooking.id)
      await onReloadBookings()
      setSelectedBookingId('')
      setNotification({ visible: true, type: 'success', title: 'Deleted', message: 'Booking deleted.' })
    } catch (err) {
      const msg = err?.message || 'Unable to delete booking.'
      setError(msg)
      setNotification({ visible: true, type: 'error', title: 'Delete failed', message: msg })
    } finally {
      setDeleteInProgress(false)
      setConfirmingDelete(false)
    }
  }

  const cancelDelete = () => {
    setConfirmingDelete(false)
  }

  if (loading) {
    return (
      <div className="admin-page-content bookings-page bookings-page--loading" aria-label="Loading bookings">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Bookings</p>
            <h1>Consultation bookings</h1>
          </div>
        </header>

        <div className="bookings-skeleton-grid">
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
        </div>
        <SkeletonLoader variant="rect" className="bookings-skeleton__panel" />
      </div>
    )
  }

  return (
    <div className="admin-page-content bookings-page">
      <header className="admin-header bookings-page__header">
        <div>
          <p className="admin-kicker">Bookings</p>
          <h1>Consultation bookings</h1>
          <p className="bookings-page__note">
            Responses are sent to the booking email address and use the current logged-in admin email as the reply-to identity.
          </p>
        </div>
        <div className="bookings-page__admin">
          <span>Signed in as</span>
          <strong>{currentAdmin?.email || 'Admin'}</strong>
        </div>
      </header>

      <div className="bookings-stats">
        <article>
          <span>All bookings</span>
          <strong>{bookingStats.total}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{bookingStats.pending}</strong>
        </article>
        <article>
          <span>Accepted</span>
          <strong>{bookingStats.accepted}</strong>
        </article>
        <article>
          <span>Responded</span>
          <strong>{bookingStats.responded}</strong>
        </article>
      </div>

      <div className="bookings-layout">
        <section className="bookings-list-panel">
          <div className="bookings-list-panel__header">
            <h2>Inbox</h2>
            <p>Click a booking to review details and send a response.</p>
          </div>

          {bookings.length === 0 ? (
            <p className="bookings-empty">No bookings received yet.</p>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => {
                const isActive = String(booking.id) === String(selectedBookingId)
                return (
                  <button
                    key={booking.id}
                    type="button"
                    className={`booking-card ${isActive ? 'booking-card--active' : ''}`}
                    onClick={() => setSelectedBookingId(String(booking.id))}
                  >
                    <div className="booking-card__top">
                      <div>
                        <h3>{booking.fullName}</h3>
                        <p>{booking.email}</p>
                      </div>
                      <span className={`booking-badge booking-badge--${String(booking.status || 'pending').toLowerCase()}`}>
                        {String(booking.status || 'pending')}
                      </span>
                    </div>

                    <div className="booking-card__meta">
                      <span>{formatBookingTime(booking.requestedAt)}</span>
                      {booking.company ? <span>{booking.company}</span> : <span>Company not provided</span>}
                    </div>

                    <p className="booking-card__message">{booking.message}</p>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="bookings-detail-panel">
          {!selectedBooking ? (
            <div className="bookings-detail-panel__empty">
              <h2>Select a booking</h2>
              <p>Choose a booking from the inbox to review the details and send an acceptance response.</p>
            </div>
          ) : (
            <>
                <div className="bookings-detail-panel__header">
                <h2>{selectedBooking.fullName}</h2>
                <span className={`booking-badge booking-badge--${String(selectedBooking.status || 'pending').toLowerCase()}`}>
                  {String(selectedBooking.status || 'pending')}
                </span>
                <div className="bookings-detail-panel__actions">
                  {!confirmingDelete ? (
                    <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={deleteInProgress}>
                      {deleteInProgress ? 'Deleting...' : 'Delete booking'}
                    </button>
                  ) : (
                    <div className="bookings-delete-confirm">
                      <button type="button" className="btn btn--danger" onClick={confirmDelete} disabled={deleteInProgress}>
                        {deleteInProgress ? 'Deleting...' : 'Confirm delete'}
                      </button>
                      <button type="button" className="btn" onClick={cancelDelete} disabled={deleteInProgress}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {notification.visible ? (
                <NotificationPopup
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  onClose={() => setNotification({ ...notification, visible: false })}
                />
              ) : null}

              <div className="bookings-detail-grid">
                <div>
                  <label>Email</label>
                  <p>{selectedBooking.email}</p>
                </div>
                <div>
                  <label>Company</label>
                  <p>{selectedBooking.company || 'Not provided'}</p>
                </div>
                <div>
                  <label>Requested time</label>
                  <p>{formatBookingTime(selectedBooking.requestedAt)}</p>
                </div>
                <div>
                  <label>Received</label>
                  <p>{formatBookingTime(selectedBooking.createdAt)}</p>
                </div>
              </div>

              <div className="bookings-detail-panel__message">
                <label>Message</label>
                <p>{selectedBooking.message}</p>
              </div>

              {selectedBooking.adminResponseMessage ? (
                <div className="bookings-detail-panel__response">
                  <label>Latest response</label>
                  <p><strong>{selectedBooking.adminResponseSubject}</strong></p>
                  <p>{selectedBooking.adminResponseMessage}</p>
                </div>
              ) : null}

              <form className="bookings-response-form" onSubmit={handleSubmit}>
                <div className="bookings-response-form__header">
                  <h3>Accept and respond</h3>
                  <p>The email will be sent to the requester and reply-to will use {currentAdmin?.email || 'the current admin account'}.</p>
                </div>

                <label>
                  Header / subject
                  <input
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Consultation confirmed"
                    required
                  />
                </label>

                <label>
                  Response message
                  <textarea
                    rows="8"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write the response message here..."
                    required
                  />
                </label>

                {error ? <div className="bookings-form__alert bookings-form__alert--error">{error}</div> : null}
                {successMessage ? <div className="bookings-form__alert bookings-form__alert--success">{successMessage}</div> : null}

                <button type="submit" className="btn btn--primary bookings-response-form__submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Accept & send email'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default Bookings