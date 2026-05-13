import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/header.css'

const Header = () => {
  const [showMenu, setShowMenu] = useState(false)

  const toggleMenu = () => {
    setShowMenu((prev) => !prev)
  }

  return (
    <header className="site-header">
      <Link to="/" className="site-brand" aria-label="EconInsight home">
        EconInsight
      </Link>
      <button
        type="button"
        className={`menu-icon ${showMenu ? 'menu-icon--open' : ''}`}
        onClick={toggleMenu}
        aria-label={showMenu ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={showMenu}
        aria-controls="primary-navigation"
      >

{showMenu ? (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="menu-icon__svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="menu-icon__svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>

)}




      </button>
      <nav id="primary-navigation" className={`site-nav ${showMenu ? 'site-nav--open' : ''}`} aria-label="Primary navigation">
        <Link to="/research" className="site-nav__link" onClick={() => setShowMenu(false)}>
          Research
        </Link>
 
        <Link to="/blog" className="site-nav__link" onClick={() => setShowMenu(false)}>
          Blog
        </Link>
        <Link to="/services" className="site-nav__link" onClick={() => setShowMenu(false)}>
          Services
        </Link>
        <Link to="/about#contact" className="site-nav__cta" onClick={() => setShowMenu(false)}>
          Contact Us
        </Link>
      </nav>
    </header>
  )
}


export default Header
