import React, { useMemo, useState } from 'react'
import SkeletonLoader from '../../components/SkeletonLoader'
import NotificationPopup from '../../components/NotificationPopup'
import '../../styles/adminStyles/messages.css'

function formatMessageTime(value) {
  if (!value) return 'Unknown time'
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

function Messages({ messages = [], loading = false, currentAdmin = null, onDeleteMessage = async () => {} }) {
  const [selectedMessageIdState, setSelectedMessageId] = useState('')
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [notification, setNotification] = useState({ visible: false, type: 'success', title: '', message: '' })
  const selectedMessageId = selectedMessageIdState || (messages[0] ? String(messages[0].id) : '')

  const selectedMessage = useMemo(
    () => messages.find((message) => String(message.id) === String(selectedMessageId)) || null,
    [messages, selectedMessageId]
  )

  const handleDelete = () => {
    if (!selectedMessage) return
    setConfirmingDelete(true)
  }

  const confirmDelete = async () => {
    if (!selectedMessage) return
    setDeleteInProgress(true)
    try {
      await onDeleteMessage(selectedMessage.id)
      // parent should reload messages; attempt to clear selection
      setSelectedMessageId('')
      setNotification({ visible: true, type: 'success', title: 'Deleted', message: 'Message deleted.' })
    } catch {
      setNotification({ visible: true, type: 'error', title: 'Delete failed', message: 'Unable to delete message.' })
    } finally {
      setDeleteInProgress(false)
      setConfirmingDelete(false)
    }
  }

  const cancelDelete = () => setConfirmingDelete(false)

  const messageStats = useMemo(() => {
    const contactCount = messages.filter((message) => String(message.messageType || '').toLowerCase() === 'contact').length
    const bookingCount = messages.filter((message) => String(message.messageType || '').toLowerCase() === 'booking').length
    const newCount = messages.filter((message) => String(message.status || 'new').toLowerCase() === 'new').length
    return { contactCount, bookingCount, newCount, total: messages.length }
  }, [messages])

  if (loading) {
    return (
      <div className="admin-page-content messages-page messages-page--loading" aria-label="Loading messages">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Messages</p>
            <h1>Admin messages</h1>
          </div>
        </header>

        <div className="messages-skeleton-grid">
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
          <SkeletonLoader variant="small-rect" />
        </div>
        <SkeletonLoader variant="rect" className="messages-skeleton__panel" />
      </div>
    )
  }

  return (
    <div className="admin-page-content messages-page">
      <header className="admin-header messages-page__header">
        <div>
          <p className="admin-kicker">Messages</p>
          <h1>Admin messages</h1>
          <p className="messages-page__note">Contact submissions and booking requests arrive here and are emailed to the active admin account.</p>
        </div>
        <div className="messages-page__admin">
          <span>Signed in as</span>
          <strong>{currentAdmin?.email || 'Admin'}</strong>
        </div>
      </header>

      <div className="messages-stats">
        <article>
          <span>Total messages</span>
          <strong>{messageStats.total}</strong>
        </article>
        <article>
          <span>Contact messages</span>
          <strong>{messageStats.contactCount}</strong>
        </article>
        <article>
          <span>Booking requests</span>
          <strong>{messageStats.bookingCount}</strong>
        </article>
        <article>
          <span>Unread</span>
          <strong>{messageStats.newCount}</strong>
        </article>
      </div>

      <div className="messages-layout">
        <section className="messages-list-panel">
          <div className="messages-list-panel__header">
            <h2>Inbox</h2>
            <p>Select a message to review the submission details.</p>
          </div>

          {messages.length === 0 ? (
            <p className="messages-empty">No messages received yet.</p>
          ) : (
            <div className="messages-list">
              {messages.map((message) => {
                const isActive = String(message.id) === String(selectedMessageId)
                const messageType = String(message.messageType || 'contact').toLowerCase()
                const status = String(message.status || 'new').toLowerCase()

                return (
                  <button
                    key={message.id}
                    type="button"
                    className={`message-card ${isActive ? 'message-card--active' : ''}`}
                    onClick={() => setSelectedMessageId(String(message.id))}
                  >
                    <div className="message-card__top">
                      <div>
                        <h3>{message.fullName}</h3>
                        <p>{message.email}</p>
                      </div>
                      <div className="message-card__badges">
                        <span className={`message-badge message-badge--${messageType}`}>{messageType}</span>
                        <span className={`message-status message-status--${status}`}>{status}</span>
                      </div>
                    </div>

                    <div className="message-card__meta">
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {message.subject ? <span>{message.subject}</span> : null}
                    </div>

                    <p className="message-card__message">{message.message}</p>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="messages-detail-panel">
          {!selectedMessage ? (
            <div className="messages-detail-panel__empty">
              <h2>Select a message</h2>
              <p>Choose a contact or booking message from the inbox to review the details.</p>
            </div>
          ) : (
            <>
              <div className="messages-detail-panel__header">
                <div>
                  <h2>{selectedMessage.fullName}</h2>
                  <p>{selectedMessage.email}</p>
                </div>
                <div className="messages-detail-panel__badges">
                  <span className={`message-badge message-badge--${String(selectedMessage.messageType || 'contact').toLowerCase()}`}>
                    {String(selectedMessage.messageType || 'contact').toLowerCase()}
                  </span>
                  <span className={`message-status message-status--${String(selectedMessage.status || 'new').toLowerCase()}`}>
                    {String(selectedMessage.status || 'new').toLowerCase()}
                  </span>
                  <div className="messages-detail-panel__actions">
                    {!confirmingDelete ? (
                      <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={deleteInProgress}>
                        {deleteInProgress ? 'Deleting...' : 'Delete message'}
                      </button>
                    ) : (
                      <div className="messages-delete-confirm">
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
              </div>

              {notification.visible ? (
                <NotificationPopup
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  onClose={() => setNotification({ ...notification, visible: false })}
                />
              ) : null}

              <div className="messages-detail-grid">
                <div>
                  <label>Subject</label>
                  <p>{selectedMessage.subject || 'No subject provided'}</p>
                </div>
                <div>
                  <label>Received</label>
                  <p>{formatMessageTime(selectedMessage.createdAt)}</p>
                </div>
                <div>
                  <label>Company</label>
                  <p>{selectedMessage.company || 'Not provided'}</p>
                </div>
                <div>
                  <label>Requested time</label>
                  <p>{selectedMessage.requestedAt ? formatMessageTime(selectedMessage.requestedAt) : 'Not provided'}</p>
                </div>
              </div>

              <div className="messages-detail-panel__message">
                <label>Message</label>
                <p>{selectedMessage.message}</p>
              </div>

              {selectedMessage.emailDeliveryStatus ? (
                <div className="messages-detail-panel__delivery">
                  <label>Email delivery</label>
                  <p>
                    <strong>{selectedMessage.emailDeliveryStatus}</strong>
                  </p>
                  {selectedMessage.emailDeliveryError ? <p>{selectedMessage.emailDeliveryError}</p> : null}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default Messages