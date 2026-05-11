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
            in
          </a>
          <a href="https://www.x.com" target="_blank" rel="noreferrer" aria-label="X">
            x
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            ig
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
          <Link to="/library">Research Library</Link>
          <Link to="/blog">Research Papers</Link>
          <Link to="/blog">Case Studies</Link>
          <Link to="/blog">Publications</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
