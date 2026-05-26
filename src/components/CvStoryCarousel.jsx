import { useEffect, useRef, useState } from 'react'

export default function CvStoryCarousel({ slides = [], intervalMs = 6000 }) {
  const [index, setIndex] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    if (!slides || slides.length === 0) return undefined

    const start = () => {
      clearInterval(timer.current)
      timer.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length)
      }, intervalMs)
    }

    start()
    return () => clearInterval(timer.current)
  }, [slides, intervalMs])

  const goTo = (i) => setIndex(i % slides.length)
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length)
  const next = () => setIndex((i) => (i + 1) % slides.length)

  if (!slides || slides.length === 0) return null

  return (
    <div
      className="cv-carousel"
      onMouseEnter={() => clearInterval(timer.current)}
      onMouseLeave={() => {
        clearInterval(timer.current)
        timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs)
      }}
    >
      <div className="cv-carousel__viewport">
        {slides.map((s, i) => (
          <article
            key={i}
            className={`cv-carousel__slide ${i === index ? 'cv-carousel__slide--active' : ''}`}
            aria-hidden={i === index ? 'false' : 'true'}
          >
            <div className="cv-carousel__header">
              {s.kicker ? <div className="cv-carousel__kicker">{s.kicker}</div> : null}
              {s.title ? <h3>{s.title}</h3> : null}
            </div>

            {s.cards ? (
              <div className="cv-carousel__cards">
                {s.cards.map((c, ci) => (
                  <div className="cv-highlight-card" key={ci}>
                    {c.label ? <div className="cv-highlight-card__label">{c.label}</div> : null}
                    <div className="cv-highlight-card__value">{c.value}</div>
                  </div>
                ))}
              </div>
            ) : s.body ? (
              <div className="cv-carousel__body">{s.body}</div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="cv-carousel__controls">
        <div>
          <button className="cv-carousel__arrow" aria-label="Previous" onClick={prev}>
            ‹
          </button>
          <button className="cv-carousel__arrow" aria-label="Next" onClick={next}>
            ›
          </button>
        </div>

        <div className="cv-carousel__dots" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`cv-carousel__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
