import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/services.css'
import serviceImg1 from '../assets/economic-research.jpg'
import serviceImg2 from '../assets/market-research.jpg'
import serviceImg3 from '../assets/consultation.jpg'
import serviceImg4 from '../assets/policy-analysis.jpg'
import serviceImg5 from '../assets/hero-money.jpg'
import serviceImg6 from '../assets/econInsight.jpg'
import service_hero from '../assets/services_hero.jpg'


const Services = () => {
  const [selectedService, setSelectedService] = useState(null)

  const services = [
    {
      id: 1,
      title: 'Economic Research',
      image: serviceImg1,
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
      title: 'Market Intelligence',
      image: serviceImg2,
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
      title: 'Strategic Consulting',
      image: serviceImg3,
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
      title: 'Policy Analysis',
      image: serviceImg4,
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
      title: 'Investment Analysis',
      image: serviceImg5,
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
      title: 'Regional Development',
      image: serviceImg6,
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
          <div className="services-hero__cta">
            <Link to="/booking" className="button button--primary services-hero__button">Book a consultation</Link>
          </div>
        </div>
        <div className="services-hero__media">
      <img src={service_hero} alt="Services Hero" className='services-hero__image' />
        </div>
      </section>

      <section className="services-grid-section">
        <div className="services-grid">
          {services.map(service => (
            <div
              key={service.id}
              className={`services-service-card ${selectedService?.id === service.id ? 'services-service-card--active' : ''}`}
              onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
            >
              <div className="services-service-card__icon">
                <img src={service.image} alt={service.title} className="services-service-card__image" />
              </div>
              <h3>{service.title}</h3>
              <div className="services-service-card__description">
                <p>{service.description}</p>
              </div>

              {selectedService?.id === service.id && (
                <div className="services-service-card__details">
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
            <h4>Discovery & Scoping</h4>
            <p>We understand your business challenges and define the research scope</p>
          </div>

          <div className="process-step">
            <h4>Research & Analysis</h4>
            <p>Our team conducts rigorous economic analysis using latest data and methodologies</p>
          </div>

          <div className="process-step">
            <h4>Insights & Recommendations</h4>
            <p>We deliver actionable insights and strategic recommendations based on findings</p>
          </div>

          <div className="process-step">
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
