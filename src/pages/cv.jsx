import CvStoryCarousel from '../components/CvStoryCarousel'
import '../styles/cv-highlights.css'

const slides = [
  {
    kicker: 'Highlights',
    title: 'Selected CV Highlights',
    cards: [
      { label: 'Experience', value: '10+ years' },
      { label: 'Publications', value: '30+' },
    ],
  },
  {
    kicker: 'Skills',
    title: 'Core Competencies',
    body: 'Macroeconomics · Forecasting · Data Analysis · Policy Research',
  },
  {
    kicker: 'Education',
    title: 'Academic Background',
    body: 'PhD in Economics; MSc in Econometrics',
  },
]

export default function Cv() {
  return (
    <main className="page page--cv">
      <section className="cv-hero">
        <div className="section-heading">
          <p className="eyebrow">Curriculum Vitae</p>
          <h1>Professional Profile</h1>
        </div>
        <CvStoryCarousel slides={slides} intervalMs={6000} />
      </section>
    </main>
  )
}
