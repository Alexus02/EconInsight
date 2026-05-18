import Header from './components/header'
import Footer from './components/footer'
import Home from './pages/home'
import About from './pages/about'
import Research from './pages/research'
import ResearchDetails from './pages/research-details'
import Admin from './pages/admin'
import Services from './pages/services'
import Booking from './pages/booking'
import Blog from './pages/blog'
import Post from './pages/post'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import "./App.css"

function AppContent() {
  const location = useLocation()
  const isAdmin = location.pathname === '/internal-access-only'

  return (
    <>
      {!isAdmin && <Header />}
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/research/:id" element={<ResearchDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/posts/:id" element={<Post />} />
          
          <Route path="/internal-access-only" element={<Admin />} />
        </Routes>
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
