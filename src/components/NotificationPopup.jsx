import { useEffect, useRef } from 'react'
import '../styles/notification-popup.css'

function NotificationPopup({ type = 'success', title, message, onClose }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (onClose) {
      closeButtonRef.current?.focus()
    }
  }, [onClose])

  const icon = type === 'error' ? '!' : '✓'

  return (
    <div
      className={`notification-popup notification-popup--${type}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={`notification-popup__icon notification-popup__icon--${type}`} aria-hidden="true">
        <span>{icon}</span>
      </div>
      <div className="notification-popup__body">
        <p className="notification-popup__title">{title}</p>
        <p className="notification-popup__message">{message}</p>
      </div>
      {onClose ? (
        <button
          ref={closeButtonRef}
          type="button"
          className="notification-popup__close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

export default NotificationPopup