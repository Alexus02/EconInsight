import { useEffect, useMemo, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import '../styles/pdf-preview.css'

GlobalWorkerOptions.workerSrc = pdfWorker

function normalizeText(items) {
  return items
    .map((item) => item?.str || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function PDFPreview({
  url,
  title = 'PDF preview',
  className = '',
  maxTextLength = 420,
  showControls = true,
  showTextSnippet = true,
}) {
  const canvasRef = useRef(null)
  const renderTaskRef = useRef(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [snippet, setSnippet] = useState('')

  const rootClassName = useMemo(() => {
    const extra = className ? ` ${className}` : ''
    return `pdf-preview${extra}`
  }, [className])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError('')
    setSnippet('')
    setPdfDoc(null)
    setPage(1)
    setNumPages(0)

    if (!url) {
      setIsLoading(false)
      return () => {
        active = false
      }
    }

    const loadingTask = getDocument({ url })

    loadingTask.promise
      .then(async (doc) => {
        if (!active) {
          return
        }

        setPdfDoc(doc)
        setNumPages(doc.numPages || 0)
        setPage(1)

        if (showTextSnippet) {
          try {
            const firstPage = await doc.getPage(1)
            const textContent = await firstPage.getTextContent()
            if (!active) {
              return
            }

            const rawText = normalizeText(textContent.items || [])
            const nextSnippet = rawText.length > maxTextLength ? `${rawText.slice(0, maxTextLength).trim()}...` : rawText
            setSnippet(nextSnippet || 'No extractable text found on page 1.')
          } catch {
            if (active) {
              setSnippet('Unable to extract text from this PDF.')
            }
          }
        }
      })
      .catch((loadError) => {
        if (!active) {
          return
        }

        setError(loadError?.message || 'Unable to load PDF preview.')
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
      try {
        loadingTask.destroy()
      } catch {
        // no-op
      }
    }
  }, [maxTextLength, showTextSnippet, url])

  useEffect(() => {
    let active = true

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) {
        return
      }

      try {
        const pageRef = await pdfDoc.getPage(page)
        if (!active || !canvasRef.current) {
          return
        }

        const canvas = canvasRef.current
        const context = canvas.getContext('2d', { alpha: false })
        const viewport = pageRef.getViewport({ scale: 1.2 })

        canvas.width = viewport.width
        canvas.height = viewport.height

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {
            // no-op
          }
        }

        const task = pageRef.render({
          canvasContext: context,
          viewport,
        })

        renderTaskRef.current = task
        await task.promise
      } catch (renderError) {
        if (active && renderError?.name !== 'RenderingCancelledException') {
          setError('Unable to render PDF page.')
        }
      }
    }

    renderPage()

    return () => {
      active = false
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // no-op
        }
      }
    }
  }, [page, pdfDoc])

  const canMovePrev = page > 1
  const canMoveNext = page < numPages

  return (
    <div className={rootClassName}>
      {isLoading ? <p className="pdf-preview__state">Loading PDF preview...</p> : null}
      {error ? <p className="pdf-preview__state pdf-preview__state--error">{error}</p> : null}

      {!isLoading && !error && pdfDoc ? (
        <>
          <div className="pdf-preview__canvas-wrap">
            <canvas ref={canvasRef} className="pdf-preview__canvas" aria-label={title} />
          </div>

          {showControls && numPages > 1 ? (
            <div className="pdf-preview__controls">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!canMovePrev}>
                Previous
              </button>
              <span>
                Page {page} of {numPages}
              </span>
              <button type="button" onClick={() => setPage((current) => Math.min(numPages, current + 1))} disabled={!canMoveNext}>
                Next
              </button>
            </div>
          ) : null}

          {showTextSnippet ? (
            <div className="pdf-preview__text">
              <p>{snippet || 'No extractable text found.'}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default PDFPreview
