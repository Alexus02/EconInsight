import Header from './components/header'
import Footer from './components/footer'
import Home from './pages/home'
import About from './pages/about'
import Research from './pages/research'
import Admin from './pages/admin'
import Services from './pages/services'
import Blog from './pages/blog'
import Article from './pages/article'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import "./App.css"

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <main className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/articles/:id" element={<Article />} />
          <Route path="/internal-access-only" element={<Admin />} />
        </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  )
}

export default App
