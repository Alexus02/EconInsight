import { Link } from 'react-router-dom'
import '../styles/footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <Link to="/" className=" site-brand--footer">
          EconInsight
        </Link>



        <div className="site-footer__socials" aria-label="Social links">
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v13h-4V8zm7 0h3.6v1.8h.05c.5-.95 1.72-1.95 3.55-1.95C19.5 7.85 21 9.94 21 13.18V21h-4v-6.1c0-1.47-.03-3.36-2.05-3.36-2.05 0-2.36 1.6-2.36 3.25V21h-4V8z" />
            </svg>
          </a>
          <a href="https://www.x.com" target="_blank" rel="noreferrer" aria-label="X">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="#111" fill="none" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.055 1.96.24 2.42.405.58.21 1 .46 1.44.9.44.44.69.86.9 1.44.165.46.35 1.25.405 2.42.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.96-.405 2.42-.21.58-.46 1-.9 1.44-.44.44-.86.69-1.44.9-.46.165-1.25.35-2.42.405-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.96-.24-2.42-.405-.58-.21-1-.46-1.44-.9-.44-.44-.69-.86-.9-1.44-.165-.46-.35-1.25-.405-2.42C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.055-1.17.24-1.96.405-2.42.21-.58.46-1 .9-1.44.44-.44.86-.69 1.44-.9.46-.165 1.25-.35 2.42-.405C8.416 2.212 8.8 2.2 12 2.2zm0 3.5A6.3 6.3 0 1018.3 12 6.308 6.308 0 0012 5.7zm0 10.4A4.1 4.1 0 1116.1 12 4.108 4.108 0 0112 16.1zm5.6-10.95a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/>
            </svg>
          </a>
        </div>
      </div>
      <div className="site-footer__columns">
        <div>
          <h3>Company</h3>
          <Link to="/about">About Us</Link>
          <a href="mailto:hello@econinsight.com">Contact</a>
          <Link to="/blog">Blog</Link>
        </div>
        <div>
          <h3>Services</h3>
          <Link to="/services">Market Intelligence</Link>
          <Link to="/services">Economic Forecasting</Link>
          <Link to="/services">Policy Analysis</Link>
        </div>
        <div className="site-footer__resources">
          <h3>Resources</h3>
          <Link to="/research">Research Library</Link>
          <Link to="/blog">Research Papers</Link>
          <Link to="/blog">Case Studies</Link>
          <Link to="/blog">Publications</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
