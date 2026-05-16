import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import '../styles/pdf-viewer.css'

// Use the CDN worker; adjust if you bundle your own worker.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PdfViewer({ url, initialScale = 1.0 }) {
  const containerRef = useRef(null)
  const pageRefs = useRef(new Map())
  const [numPages, setNumPages] = useState(null)
  const [scale, setScale] = useState(initialScale)
  const [loadingDocument, setLoadingDocument] = useState(true)
  const [visiblePages, setVisiblePages] = useState(new Set([1]))

  // Buffer of pages to render around visible ones for smooth scrolling
  const RENDER_BUFFER = 2

  useEffect(() => {
    // reset when url changes
    setNumPages(null)
    setLoadingDocument(true)
    setVisiblePages(new Set([1]))
  }, [url])

  const onDocumentLoadSuccess = useCallback((pdf) => {
    setNumPages(pdf.numPages)
    setLoadingDocument(false)
  }, [])

  // IntersectionObserver to detect what pages are in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const nextVisible = new Set(visiblePages)
        let changed = false
        for (const e of entries) {
          const idx = Number(e.target.dataset.pageIndex)
          if (e.isIntersecting) {
            if (!nextVisible.has(idx)) {
              nextVisible.add(idx)
              changed = true
            }
          } else {
            if (nextVisible.has(idx)) {
              nextVisible.delete(idx)
              changed = true
            }
          }
        }
        if (changed) setVisiblePages(nextVisible)
      },
      { root: containerRef.current, rootMargin: '200px', threshold: 0.05 }
    )

    // Observe current page containers
    const refs = pageRefs.current
    for (const [idx, el] of refs) {
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages])

  // Decide which pages to render (visible +/- buffer)
  const pagesToRender = useMemo(() => {
    const out = new Set()
    if (!numPages) return out
    for (const v of visiblePages) {
      for (let i = Math.max(1, v - RENDER_BUFFER); i <= Math.min(numPages, v + RENDER_BUFFER); i++) {
        out.add(i)
      }
    }
    return out
  }, [visiblePages, numPages])

  const scrollToPage = useCallback((pageIndex) => {
    const el = pageRefs.current.get(pageIndex)
    if (el && containerRef.current) {
      // scroll so the page top lines up with container top
      containerRef.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' })
    }
  }, [])

  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)))
  const zoomOut = () => setScale((s) => Math.max(0.4, +(s - 0.1).toFixed(2)))
  const fitWidth = () => setScale(1)

  return (
    <div className="pdf-viewer-root">
      <div className="pdf-toolbar">
        <button onClick={() => scrollToPage(1)} aria-label="First page">⏮</button>
        <button onClick={() => scrollToPage(Math.max(1, [...visiblePages][0] - 1))} aria-label="Prev page">◀</button>
        <button onClick={() => scrollToPage(Math.min(numPages || 1, [...visiblePages][0] + 1))} aria-label="Next page">▶</button>
        <div className="spacer" />
        <button onClick={zoomOut} aria-label="Zoom out">−</button>
        <button onClick={fitWidth} aria-label="Fit width">100%</button>
        <button onClick={zoomIn} aria-label="Zoom in">+</button>
      </div>

      <div className="pdf-container" ref={containerRef}>
        {loadingDocument && (
          <div className="pdf-loading">
            <div className="spinner" />
            <div>Loading document…</div>
          </div>
        )}

        <Document file={url} onLoadSuccess={onDocumentLoadSuccess} loading="">
          {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map((pageIndex) => {
            const shouldRender = pagesToRender.has(pageIndex)
            return (
              <div
                key={pageIndex}
                className="pdf-page-wrapper"
                data-page-index={pageIndex}
                ref={(el) => pageRefs.current.set(pageIndex, el)}
              >
                {shouldRender ? (
                  <Page
                    pageNumber={pageIndex}
                    scale={scale}
                    renderMode="canvas"
                    loading={<div className="page-skeleton" />}
                    className="pdf-page-canvas"
                  />
                ) : (
                  <div className="page-skeleton" />
                )}
              </div>
            )
          })}
        </Document>
      </div>
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import '../styles/article-viewer.css'

// Use CDN worker to avoid bundler resolution issues in some environments.
// This points to the pdf.worker script served by unpkg. If you prefer a
// pinned version, replace with a specific version URL.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.js'

export default function PdfViewer({ url, initialPage = 1 }) {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.1)
  const [error, setError] = useState(null)
  const [pageImages, setPageImages] = useState([])
  const pageNumbers = useMemo(() => Array.from({ length: numPages }, (_, index) => index + 1), [numPages])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setPageImages([])
    if (!url) return

    pdfjsLib
      .getDocument({ url })
      .promise.then((doc) => {
        if (cancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
      })
      .catch((err) => {
        setError(err.message || 'Unable to load PDF')
      })

    return () => {
      cancelled = true
      setPdfDoc(null)
    }
  }, [url, initialPage])

  useEffect(() => {
    if (!pdfDoc) return
    let cancelled = false
    const renderPages = async () => {
      try {
        const nextPageImages = []
        for (const pageNum of pageNumbers) {
          const page = await pdfDoc.getPage(pageNum)
          if (cancelled) return
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width
          const renderContext = {
            canvasContext: context,
            viewport,
          }
          const renderTask = page.render(renderContext)
          await renderTask.promise
          nextPageImages.push({
            pageNum,
            src: canvas.toDataURL('image/png'),
          })
        }
        if (!cancelled) {
          setPageImages(nextPageImages)
        }
      } catch (err) {
        setError(err.message || 'Unable to render PDF page')
      }
    }

    renderPages()
    return () => {
      cancelled = true
    }
  }, [pdfDoc, pageNumbers, scale])

  if (error) {
    return (
      <div className="viewer-placeholder">
        <div className="viewer-icon">📄</div>
        <p className="viewer-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <span style={{ minWidth: 120, textAlign: 'center' }}>Pages {numPages || '–'}</span>
        <div style={{ flex: 1 }} />
        <button className="button" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>-</button>
        <span style={{ margin: '0 0.5rem' }}>{Math.round(scale * 100)}%</span>
        <button className="button" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>+</button>
      </div>
      <div className="pdf-pages">
        {pageImages.map((page) => (
          <div key={page.pageNum} className="pdf-page">
            <img src={page.src} alt={`Page ${page.pageNum}`} className="pdf-page__image" />
            <div className="pdf-page__label">Page {page.pageNum}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
