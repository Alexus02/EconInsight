import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/userNav/header.jsx'
import Footer from './components/userNav/footer.jsx'
import logo from './assets/econinsight_logo_v2.svg'
import "./App.css"

const lazyPageCache = new Map()

function lazyPage(loader) {
  if (!lazyPageCache.has(loader)) {
    lazyPageCache.set(loader, lazy(() => loader()))
  }

  return lazyPageCache.get(loader)
}

const Home = lazyPage(() => import('./pages/userPages/home/home.jsx'))
const About = lazyPage(() => import('./pages/userPages/about/about.jsx'))
const Research = lazyPage(() => import('./pages/userPages/research/research.jsx'))
const ResearchDetails = lazyPage(() => import('./pages/userPages/research/research-details'))
const Admin = lazyPage(() => import('./pages/admin'))
const Services = lazyPage(() => import('./pages/userPages/services/services.jsx'))
const Cv = lazyPage(() => import('./pages/userPages/services/cv/cv'))
const Booking = lazyPage(() => import('./pages/userPages/services/booking/booking'))
const Blog = lazyPage(() => import('./pages/userPages/blog/blog.jsx'))
const Post = lazyPage(() => import('./pages/userPages/blog/post.jsx'))

function PageLoader() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 'calc(100vh - 180px)',
        padding: '32px 16px',
      }}
    >
      <img
        src={logo}
        alt="Loading EconInsight"
        style={{ display: 'block', width: 'min(72vw, 320px)', height: 'auto' }}
      />
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const isAdmin = location.pathname === '/internal-access-only'

  return (
    <>
      {!isAdmin && <Header />}
      <main className="app-shell">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/research" element={<Research />} />
            <Route path="/research/:id" element={<ResearchDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/cv" element={<Cv />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/posts/:id" element={<Post />} />
            
            <Route path="/internal-access-only" element={<Admin />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}

function App() {
  return (
    <div className="App">
      <Router>
        <AppContent />
      </Router>
    </div>
  )
}

export default App
