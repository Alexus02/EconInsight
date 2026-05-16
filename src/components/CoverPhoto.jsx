import React, { useState } from 'react'
import '../styles/cover-photo.css'

export default function CoverPhoto({ src, alt, className = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const placeholder = (
    <svg className="cover-placeholder" viewBox="0 0 220 180" role="img" aria-label="Cover image unavailable">
      <defs>
        <linearGradient id="coverFileBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2f7" />
        </linearGradient>
      </defs>
      <rect x="38" y="16" width="126" height="148" rx="14" fill="url(#coverFileBg)" stroke="#d7dde6" />
      <path d="M128 16 L164 52 L164 164 L38 164 L38 16 Z" fill="#ffffff" stroke="#d7dde6" />
      <path d="M128 16 L164 52 L134 52 C130 52 128 50 128 46 Z" fill="#e7edf5" stroke="#d7dde6" />
      <rect x="58" y="74" width="66" height="10" rx="5" fill="#2563eb" opacity="0.9" />
      <rect x="58" y="92" width="82" height="8" rx="4" fill="#cbd5e1" />
      <rect x="58" y="108" width="74" height="8" rx="4" fill="#cbd5e1" />
      <rect x="58" y="124" width="56" height="8" rx="4" fill="#cbd5e1" />
      <g transform="translate(146 110) scale(0.8)">
        <rect x="0" y="0" width="18" height="18" fill="#f25022" />
        <rect x="20" y="0" width="18" height="18" fill="#7fba00" />
        <rect x="0" y="20" width="18" height="18" fill="#00a4ef" />
        <rect x="20" y="20" width="18" height="18" fill="#ffb900" />
      </g>
    </svg>
  )

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  if (!src) {
    return (
      <div className={`cover-photo ${className}`}>
        {placeholder}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`cover-photo ${className}`}>
        {placeholder}
      </div>
    )
  }

  return (
    <div className={`cover-photo ${className}`} aria-busy={loading ? 'true' : undefined}>
      {loading && <div className="cover-spinner" />}
      <img
        src={src}
        alt={alt || 'Cover image'}
        className={`cover-img ${loading ? 'cover-img--loading' : 'cover-img--loaded'}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}
