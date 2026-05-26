import Header from './components/userNav/header.jsx'
import Footer from './components/userNav/footer.jsx'
import Home from './pages/userPages/home/home.jsx'
import About from './pages/userPages/about/about.jsx'
import Research from './pages/research'
import ResearchDetails from './pages/research-details'
import Admin from './pages/admin'
import Services from './pages/services'
import Cv from './pages/cv'
import Booking from './pages/booking'
import Blog from './pages/userPages/blog/blog.jsx'
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
          <Route path="/cv" element={<Cv />} />
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
