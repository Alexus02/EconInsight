import Header from './components/header'
import Footer from './components/footer'
import Home from './pages/home'
import About from './pages/about'
import Services from './pages/services'
import Blog from './pages/blog'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import './App.css'

function App() {


  return (
    <>
      <Router >
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
        <Footer />
      </Router>
    </>
  )
}

export default App
