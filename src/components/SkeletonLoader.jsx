import React from 'react'

const SkeletonLoader = ({variant = 'rect', className = '', ...rest}) => {
  const base = `skeleton skeleton--${variant} ${className}`.trim()
  return <div className={base} {...rest} aria-hidden="true" />
}

export default SkeletonLoader
