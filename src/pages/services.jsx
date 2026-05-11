import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/services.css'


const Services = () => {
  const [selectedService, setSelectedService] = useState(null)

  const services = [
    {
      id: 1,
      icon: '📊',
      title: 'Economic Research',
      description: 'Comprehensive economic analysis and research on market trends, policies, and business opportunities',
      details: [
        'Market sizing and opportunity analysis',
        'Sector and industry analysis',
        'Economic impact assessments',
        'Trend forecasting and scenario planning',
        'Competitive landscape analysis'
      ]
    },
    {
      id: 2,
      icon: '📈',
      title: 'Market Intelligence',
      description: 'Data-driven market insights to support strategic business decisions',
      details: [
        'Consumer and market research',
        'Competitive benchmarking',
        'Market entry strategies',
        'Pricing and revenue optimization',
        'Customer segmentation analysis'
      ]
    },
    {
      id: 3,
      icon: '🎯',
      title: 'Strategic Consulting',
      description: 'Expert guidance on business strategy informed by economic expertise',
      details: [
        'Business strategy development',
        'Growth acceleration planning',
        'Operational efficiency analysis',
        'Risk assessment and mitigation',
        'Expansion and diversification strategies'
      ]
    },
    {
      id: 4,
      icon: '🔍',
      title: 'Policy Analysis',
      description: 'Government policy evaluation and economic impact assessment',
      details: [
        'Policy impact modeling',
        'Regulatory analysis',
        'Fiscal and monetary policy review',
        'Trade policy analysis',
        'Development strategy support'
      ]
    },
    {
      id: 5,
      icon: '💼',
      title: 'Investment Analysis',
      description: 'Economic due diligence and investment opportunity assessment',
      details: [
        'Investment opportunity evaluation',
        'Economic due diligence',
        'Deal structuring support',
        'Risk analysis and mitigation',
        'Post-deal economic integration'
      ]
    },
    {
      id: 6,
      icon: '🌍',
      title: 'Regional Development',
      description: 'Economic development strategies for regions and communities',
      details: [
        'Regional economic development planning',
        'Local business ecosystem analysis',
        'Infrastructure impact assessment',
        'Skills and talent strategy',
        'Inclusive growth planning'
      ]
    }
  ]

  return (
    <div className="page page--services">
      <section className="services-hero">
        <div className="services-hero__content">
          <h1>Our Services</h1>
          <p>Comprehensive economic research and consulting solutions tailored to your needs</p>
        </div>
        <div className="services-hero__media">
          <div className="placeholder-image placeholder-large">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="300" fill="#e5e5e5" />
              <text x="200" y="150" textAnchor="middle" fontSize="16" fill="#999">
                Services Hero Image
              </text>
            </svg>
          </div>
        </div>
      </section>

      <section className="services-grid-section">
        <div className="services-grid">
          {services.map(service => (
            <div
              key={service.id}
              className={`service-card ${selectedService?.id === service.id ? 'active' : ''}`}
              onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
            >
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p className="service-description">{service.description}</p>

              {selectedService?.id === service.id && (
                <div className="service-details">
                  <ul>
                    {service.details.map((detail, idx) => (
                      <li key={idx}>
                        <span className="bullet">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="service-process">
        <div className="section-header">
          <h2>How We Work</h2>
          <p>Our proven approach to delivering economic insights and recommendations</p>
        </div>

        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-image placeholder-small">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#e5e5e5" />
                <text x="100" y="100" textAnchor="middle" fontSize="12" fill="#999">
                  Discovery
                </text>
              </svg>
            </div>
            <h4>Discovery & Scoping</h4>
            <p>We understand your business challenges and define the research scope</p>
          </div>

          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-image placeholder-small">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#e5e5e5" />
                <text x="100" y="100" textAnchor="middle" fontSize="12" fill="#999">
                  Analysis
                </text>
              </svg>
            </div>
            <h4>Research & Analysis</h4>
            <p>Our team conducts rigorous economic analysis using latest data and methodologies</p>
          </div>

          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-image placeholder-small">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#e5e5e5" />
                <text x="100" y="100" textAnchor="middle" fontSize="12" fill="#999">
                  Insights
                </text>
              </svg>
            </div>
            <h4>Insights & Recommendations</h4>
            <p>We deliver actionable insights and strategic recommendations based on findings</p>
          </div>

          <div className="process-step">
            <div className="step-number">4</div>
            <div className="step-image placeholder-small">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#e5e5e5" />
                <text x="100" y="100" textAnchor="middle" fontSize="12" fill="#999">
                  Implementation
                </text>
              </svg>
            </div>
            <h4>Implementation Support</h4>
            <p>We support you in implementing recommendations and tracking outcomes</p>
          </div>
        </div>
      </section>

      <section className="services-cta">
        <h2>Ready to Get Started?</h2>
        <p>Contact us to discuss how our services can support your business objectives</p>
        <Link to="/about#contact" className="button button--primary button--large">
          Contact Our Team
        </Link>
      </section>
    </div>
  )
}

export default Services
