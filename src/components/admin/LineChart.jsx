import React, { useEffect, useState } from 'react'
import { getStoredAdminSessionToken } from '../../lib/fileApi'

function buildPath(points, width, height, padding) {
  if (!points.length) return ''
  const maxY = Math.max(...points)
  const minY = Math.min(...points)
  const range = maxY - minY || 1

  return points
    .map((v, i) => {
      const x = padding + (i * (width - padding * 2)) / (points.length - 1 || 1)
      const y = padding + (1 - (v - minY) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function buildSeriesPoints(points, width, height, padding) {
  if (!points.length) return []

  const maxY = Math.max(...points)
  const minY = Math.min(...points)
  const range = maxY - minY || 1
  const xRange = points.length - 1 || 1

  return points.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / xRange
    const y = padding + (1 - (value - minY) / range) * (height - padding * 2)
    return { x, y, value }
  })
}

export default function LineChart({ apiBase = '', days = 30 }) {
  const [data, setData] = useState({ labels: [], totalViews: [], newPosts: [], viewsPerPost: [] })
  const sessionToken = getStoredAdminSessionToken()
  const fallbackToken = import.meta.env.VITE_HOST_PORTAL_TOKEN || ''

  useEffect(() => {
    async function ensureSnapshot() {
      let createdSnapshot = null

      try {
        const response = await fetch(`${apiBase}/api/analytics/snapshots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionToken ? { 'x-admin-session-token': sessionToken } : fallbackToken ? { 'x-host-token': fallbackToken } : {}),
          },
          body: JSON.stringify({ date: new Date().toISOString().slice(0, 10) }),
        })
        const json = await response.json().catch(() => null)
        createdSnapshot = json?.snapshot || null
      } catch (e) {
        // ignore
      }

      try {
        const res = await fetch(`${apiBase}/api/analytics/snapshots?days=${days}`)
        const json = await res.json()
        const snapshots = ((json.snapshots || []).slice().reverse())
        const series = snapshots.length > 0 ? snapshots : (createdSnapshot ? [createdSnapshot] : [])

        const labels = series.map((s) => s.date)
        const totalViews = series.map((s) => Number(s.totalViews || 0))
        const newPosts = series.map((s) => Number(s.newPosts || 0))

        const cumulative = []
        let cum = 0
        for (const n of newPosts) {
          cum += n
          cumulative.push(cum || 1)
        }

        const viewsPerPost = totalViews.map((tv, i) => Math.round((tv || 0) / (cumulative[i] || 1)))

        setData({ labels, totalViews, newPosts, viewsPerPost })
      } catch {
        // Intentionally silent in production.
      }
    }

    ensureSnapshot()
  }, [apiBase, days, sessionToken, fallbackToken])

  const width = 720
  const height = 220
  const padding = 20

  const tvPath = buildPath(data.totalViews, width, height, padding)
  const npPath = buildPath(data.newPosts, width, height, padding)
  const vppPath = buildPath(data.viewsPerPost, width, height, padding)
  const tvPoints = buildSeriesPoints(data.totalViews, width, height, padding)
  const npPoints = buildSeriesPoints(data.newPosts, width, height, padding)
  const vppPoints = buildSeriesPoints(data.viewsPerPost, width, height, padding)
  const hasData = data.labels.length > 0

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ marginTop: '0' }}>Activity Overview</h2>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <rect x="0" y="0" width={width} height={height} fill="#fff" rx="6" />
        <g opacity="0.2">
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#cfd8dc" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#cfd8dc" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cfd8dc" />
        </g>
        {hasData ? (
          <g>
            {tvPath ? <path d={tvPath} fill="none" stroke="#277783" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {npPath ? <path d={npPath} fill="none" stroke="#6a1b9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {vppPath ? <path d={vppPath} fill="none" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {tvPoints.map((point, index) => <circle key={`tv-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#277783" />)}
            {npPoints.map((point, index) => <circle key={`np-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#6a1b9a" />)}
            {vppPoints.map((point, index) => <circle key={`vpp-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#1565c0" />)}
          </g>
        ) : (
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#999" fontSize="14">
            No snapshot data yet
          </text>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 12, height: 12, background: '#277783', display: 'inline-block' }} /> Total Views</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 12, height: 12, background: '#6a1b9a', display: 'inline-block' }} /> New Posts</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 12, height: 12, background: '#1565c0', display: 'inline-block' }} /> Views / Post</div>
      </div>
    </div>
  )
}
