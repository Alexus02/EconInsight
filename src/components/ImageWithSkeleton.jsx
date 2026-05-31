import { useEffect, useState } from 'react'
import SkeletonLoader from './SkeletonLoader'

function ImageWithSkeleton({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  skeletonVariant = 'rect',
  fallbackLabel,
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  style,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [src])

  const label = fallbackLabel || alt || 'Image unavailable'

  if (!src) {
    return (
      <div className={`image-with-skeleton ${wrapperClassName}`.trim()} aria-hidden="true" style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            background: '#f3f4f6',
            color: '#6b7280',
            fontSize: '0.85rem',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`image-with-skeleton ${wrapperClassName}`.trim()}
      style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}
      aria-busy={!loaded && !errored ? 'true' : undefined}
    >
      {!loaded && !errored ? (
        <SkeletonLoader
          variant={skeletonVariant}
          className="image-with-skeleton__placeholder"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      ) : null}

      {errored ? (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            background: '#f3f4f6',
            color: '#6b7280',
            fontSize: '0.85rem',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || ''}
          className={className}
          loading={loading}
          decoding={decoding}
          onLoad={(event) => {
            setLoaded(true)
            if (onLoad) onLoad(event)
          }}
          onError={(event) => {
            setErrored(true)
            if (onError) onError(event)
          }}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 180ms ease', ...style }}
          {...rest}
        />
      )}
    </div>
  )
}

export default ImageWithSkeleton