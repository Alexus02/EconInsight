import profileImage from '../../../../assets/Profile-Image-cv.jpeg'
import './cv.css'

// return a small inline SVG icon based on the URL (youtube, facebook, news, generic)
const getPlatformIcon = (url) => {
  if (!url) return null
  const u = url.toLowerCase()
  if (u.includes('youtu') || u.includes('youtube')) {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="2" y="5" width="20" height="14" rx="3" fill="#FF0000" />
        <polygon points="10,8 16,12 10,16" fill="#fff" />
      </svg>
    )
  }

  if (u.includes('facebook.com')) {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#1877F2" />
        <path d="M15 8.5h-1.4c-.6 0-.7.3-.7.7V10h2.1l-.3 2H12.9v6h-2.1v-6H9.8v-2h1.1V9.6c0-1.2.7-1.9 1.8-1.9H15v1.8z" fill="#fff" />
      </svg>
    )
  }

  // news / article sites
  if (u.includes('news') || u.includes('sardc') || u.includes('hdl.handle.net') || u.includes('africannewspage')) {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="4" width="14" height="16" rx="1" fill="#6f5d4d" />
        <rect x="8" y="6" width="8" height="3" fill="#fff" />
        <rect x="8" y="10" width="10" height="2" fill="#fff" />
        <rect x="8" y="13" width="6" height="2" fill="#fff" />
        <circle cx="19" cy="7" r="2" fill="#6f5d4d" />
      </svg>
    )
  }

  // fallback generic link icon
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.9 12a5 5 0 0 1 0-7.1l2.8-2.8a5 5 0 0 1 7.1 0l1.4 1.4" fill="none" stroke="#6f5d4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.1 12a5 5 0 0 1 0 7.1l-2.8 2.8a5 5 0 0 1-7.1 0l-1.4-1.4" fill="none" stroke="#6f5d4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const sections = [
  {
    id: 'summary',
    title: 'Professional Summary',
    intro:
      'Economist and Africa-focused political economy analyst with over 28 years of experience in economic intelligence gathering, macroeconomic and policy analysis, trade and industrial policy, and strategic advisory work across national, regional, and continental institutions in Africa.',
    content: (
      <p className="cv-copy">
        Strong track record in analysing economic trends, interpreting political and institutional developments,
        assessing commercial, policy and implementation risks, and translating complex developments into practical
        insight for business, policy and investment decision-making. Has worked across government, central bank-linked
        enterprise reform, financial-sector economic analysis, regional integration platforms, and the African Union
        system, with extensive exposure to African markets, trade regimes, and continental policy frameworks.
      </p>
    ),
  },
  {
    id: 'competencies',
    title: 'Core Competencies',
    intro: 'Areas of expertise across economic intelligence, policy analysis, and advisory work.',
    content: (
      <div className="tag-grid">
        {[
          'Political economy analysis',
          'Economic forecasting support',
          'Trade and industrial policy',
          'African regional integration',
          'Country and regional research',
          'Policy monitoring and interpretation',
          'Report writing and editing',
          'Economic governance analysis',
          'Business environment reform',
          'Competitiveness analysis',
          'Public finance and revenue policy',
          'Client and stakeholder briefings',
          'Commissioned research',
          'External contributor and expert coordination',
        ].map((item) => (
          <span key={item} className="tag-chip">
            {item}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: 'milestones',
    title: 'Key Milestones',
    intro: 'Selected highlights that show the scope and depth of the career.',
    content: (
      <div className="stack-cards">
        {[
          'Built over 28 years of economics, trade policy, political-economy, and strategic advisory experience across African institutions.',
          'Served across the African Union system from 2018 to the present, providing continent-level analytical leadership on trade policy, industrial policy, regional integration, and implementation risk.',
          'Advised the Chairperson of the African Union on continental frameworks including AfCFTA and Agenda 2063.',
          'Played a lead role in establishing the AIDA Implementation and Coordination Unit at the African Union Commission.',
          'Oversaw development of the African Union SME Strategy and supported its endorsement by the AU Summit in February 2020.',
          'Served as Group Chief Economist / General Manager Research for Intermarket Holdings, producing economic intelligence and a recurring monthly Economic Review Bulletin.',
          'Built strong experience in turnaround diagnostics and enterprise risk analysis through work linked to the Reserve Bank of Zimbabwe.',
          'Developed early foundations as Principal Economist in the Ministry of Finance, contributing to tax reform, tariff reform, and fiscal-policy analysis.',
          'Led and supervised major evidence-based policy studies under USAID-SERA on investment climate reform, export competitiveness, industrial policy, and governance weaknesses.',
          'Delivered technical and analytical leadership for the EU Technical Assistance Facility to the AfCFTA Secretariat.',
        ].map((item) => (
          <article key={item} className="stack-card">
            <p>{item}</p>
          </article>
        ))}
      </div>
    ),
  },
  {
    id: 'consultancy',
    title: 'Selected Consultancy and Advisory Assignments',
    intro: 'Commissioned work across regional and continental institutions.',
    content: (
      <div className="publications-table consultancy-table">
        {(() => {
          const consultancies = [
            { period: '2022 - 2023', assignment: 'AfCFTA Secretariat / EU Technical Assistance Facility', role: 'Senior Programme Manager and analytical lead support' },
            { period: '2021 - 2022', assignment: 'ILO / LEDRIZ', role: 'Technical Lead, AfCFTA and Labour' },
            { period: '2021 - 2022', assignment: 'UNITAR / Africa Union Chairperson Support Project', role: 'Senior Trade Adviser to the AU Chairperson' },
            { period: '2021', assignment: 'UNECA / COMESA', role: 'Economics Consultant' },
            { period: '2018 - 2020', assignment: 'AU Commission / UNIDO collaboration', role: 'Chief Technical Adviser, AIDA' },
            { period: '2017', assignment: 'ZimConsult / UNECA', role: 'Economics Consultant' },
            { period: '2017', assignment: 'SARDC', role: 'Economics Consultant' },
            { period: '2016', assignment: 'Crown Agents / Government of Zimbabwe / AfDB-linked programme', role: 'Industry and Trade Expert' },
            { period: '2015 - 2016', assignment: 'USAID / Strategic Economic Research and Analysis (SERA)', role: 'Senior Economist / Economic Policy Adviser' },
            { period: '2004', assignment: 'European Union / COMESA / Government of Zimbabwe', role: 'Industry and Trade Analysis Assignment' },
          ]

          return (
            <table>
              <thead className="visually-hidden">
                <tr>
                  <th>Period</th>
                  <th>Assignment</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {consultancies.map((item, index) => (
                  <tr key={item.period + '-' + index}>
                    <td className="pub-year">{item.period}</td>
                    <td className="pub-desc">{item.assignment}</td>
                    <td className="pub-agency">{item.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })()}
      </div>
    ),
  },
  {
    id: 'experience',
    title: 'Professional Experience',
    intro: 'Career timeline with selected analyst-relevant contributions.',
    content: (
      <div className="experience-grid">
        {[
          {
            period: '2018 - Present',
            organisation: 'African Union System / AfCFTA Secretariat / AU Chairperson Advisory Roles',
            role: 'Chief Technical Adviser, Senior Trade Adviser, Senior Programme Manager, AfCFTA Implementation and Coordination Expert',
            points: [
              'Delivered continent-level political-economy analysis focused on trade policy, industrial policy, regional integration, implementation risks, and institutional readiness.',
              'Interpreted policy, regulatory, and institutional developments across member states and Regional Economic Communities.',
              'Provided high-level analytical support to the Chairperson of the African Union on continental programmes.',
              'Assessed policy environments to identify risks, bottlenecks, and enabling conditions affecting regional value chains and investment initiatives.',
              'Produced and guided evidence-based analytical work around industrial policy, SME development, investment opportunities, and coordination gaps.',
            ],
          },
          {
            period: 'August 2017 - November 2017',
            organisation: 'ZimConsult / UNECA',
            role: 'Economics Consultant',
            points: [
              'Led technical work on a UNECA-commissioned study examining the role, progress, and prospects of the Tripartite Free Trade Area in Southern Africa.',
              'Assessed implementation status and broader strategic significance within regional economic architecture.',
            ],
          },
          {
            period: 'April 2015 - September 2016',
            organisation: 'USAID - Strategic Economic Research and Analysis (SERA), Zimbabwe',
            role: 'Senior Economist / Economic Policy Adviser',
            points: [
              'Led and supervised research on investment climate reform, trade competitiveness, industrial policy, financial-sector issues, pensions reform, mineral governance, and governance questions.',
              'Oversaw the study On the Brink of Breakthrough: Starting a Business in Zimbabwe and helped shape the Doing Business reform process.',
            ],
          },
          {
            period: '2009 - 2013',
            organisation: 'DFID Economic Governance / PFM Project, Zimbabwe',
            role: 'Lead National Budget Expert',
            points: [
              'Led reviews of budget systems and budget processes in Zimbabwe.',
              'Supported introduction of budget strategy tools, results-based budgeting, and programme-based budgeting.',
            ],
          },
          {
            period: '2005 - 2008',
            organisation: 'Reserve Bank of Zimbabwe / FISCORP (Pvt) Ltd',
            role: 'General Manager & Division Chief - Public Enterprises Re-orientation Programme',
            points: [
              'Carried out diagnostic analysis of operational, financial, institutional, and governance challenges facing public enterprises.',
              'Assessed turnaround options and identified funding instruments and non-monetary interventions for recovery.',
            ],
          },
          {
            period: '2000 - 2005',
            organisation: 'Intermarket Holdings (now Finhold)',
            role: 'General Manager / Group Chief Economist',
            points: [
              'Provided economic intelligence and strategic advisory support on macroeconomic indicators to support investment decisions.',
              'Produced a monthly Economic Review Bulletin for the group and external business clients.',
            ],
          },
          {
            period: '1992 - 1997',
            organisation: 'Ministry of Finance, Government of Zimbabwe',
            role: 'Principal Economist - Tax Analysis and Revenue Policy',
            points: [
              'Contributed technical analysis on tax reform, tariff reform, fiscal restructuring, and broader institutional reforms.',
              'Supported establishment of the Tariff Commission of Zimbabwe and preliminary work linked to the Zimbabwe Revenue Authority.',
            ],
          },
        ].map((item) => (
          <article key={item.period + item.organisation} className="experience-card">
            <p className="experience-card__period">{item.period}</p>
            <h3>{item.organisation}</h3>
            <p className="experience-card__role">{item.role}</p>
            <ul>
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    ),
  },
  {
    id: 'education',
    title: 'Education and Credentials',
    intro: 'Academic background, languages, membership, and technical skills.',
    content: (
      <div className="cv-section--split">
        <div className="detail-list detail-list--two-column">
          <p><strong>Master of Arts in Development Economics</strong><span>Williams College, USA | 1994 - 1995 | Cum Laude</span></p>
          <p><strong>Diploma in Investment Analysis and Portfolio Management</strong><span>University of South Africa | 2002 - 2003</span></p>
          <p><strong>Advanced Course on Aspects of Fiscal Reform</strong><span>International Monetary Fund / ESAIRDM, Zimbabwe | 1993</span></p>
          <p><strong>Bachelor of Science (Honours) in Economics</strong><span>University of Zimbabwe | 1989 - 1991</span></p>
          <p><strong>Languages</strong><span>English fluent; Shona native / fluent</span></p>
          <p><strong>Professional membership</strong><span>Zimbabwe Economics Society</span></p>
          <p><strong>Technical skills</strong><span>Windows, Excel, PowerPoint, SPSS, research and policy analysis, economic reporting, stakeholder briefings</span></p>
        </div>

        <footer className="cv-credentials-footer">
          <strong>Country and regional exposure</strong>
          <ul className="country-list">
            {[
              'Zimbabwe', 'Ghana', 'Ethiopia', 'Nigeria', 'Sierra Leone', 'Zambia', 'Kenya', 'Tanzania', 'Uganda', 'DRC', 'Congo Brazzaville', 'Senegal', 'Mali', 'Gabon', 'Niger', 'Cameroon', 'Liberia', 'Morocco', 'South Africa', 'Namibia', 'Eswatini', 'Guinea-Bissau', 'Guinea-Conakry', 'COMESA', 'EAC', 'ECOWAS', 'IGAD', 'ECCAS', 'UMA', 'CEN-SAD'
            ].map((country, index) => (
              <li key={index}>{country}</li>
            ))}
          </ul>
        </footer>
      </div>
    ),
  },
  {
    id: 'publications',
    title: 'Selected Publications',
    intro: 'Research and policy output across integration, trade, industrialisation, and reform work.',
    content: (
      <div className="publications-table">
        {(() => {
          const pubs = [
            { year: '2004', desc: 'Assessment of Zimbabwe’s compliance to the COMESA Common Investment Area Framework', agency: 'COMESA' },
            { year: '2004', desc: 'Impact Assessment of the COMESA Common External Tariff for Zimbabwe', agency: 'COMESA' },
            { year: '2012', desc: 'Tripartite Free Trade Area Industrial Pillar Baseline Study and complimentary business factors affecting industrial development', agency: '' },
            { year: '2013', desc: 'Industrialization for Economic Transformation and Sustainable Development in Southern Africa: Addressing the Gaps', agency: 'UNECA', url: 'https://hdl.handle.net/10855/22748' },
            { year: '2016', desc: 'Development of the Zimbabwe Regional Integration Strategic Framework (RISF)', agency: 'Crown Agents / AfDB-linked programme' },
            { year: '2015', desc: 'Prospects for Industrial Transformation in SADC: Towards a Regional Industrialisation Roadmap', agency: 'SARDC', url: 'https://www.sardc.net/books/industrial_policy_briefs/Industrialisation_report.pdf' },
            { year: '2017', desc: 'Integration in Southern Africa: The Role, Prospects and Progress of the EAC-COMESA-SADC Tripartite Agreement', agency: 'UNECA', url: 'https://hdl.handle.net/10855/43681' },
            { year: '2017', desc: 'Promoting Growth and Economic Transformation in Southern Africa: The Challenges and Implications for Declining Commodity Prices', agency: 'UNECA', url: 'https://hdl.handle.net/10855/43722' },
            { year: '2019', desc: 'Status on the Implementation of the SADC Integration: Papers on Trade & Market Integration, and on Industrialization', agency: 'SARDC', url: 'https://www.sardc.net/books/industrial_policy_briefs/Industrialisation_report.pdf' },
            { year: '2021', desc: 'Assess the feasibility of establishing and managing a common Agro-industrial park between Zambia and Zimbabwe (CAIP)', agency: 'UNECA and COMESA', url: 'https://hdl.handle.net/10855/43681' },

          ]

          return (
            <table>
              <thead className="visually-hidden">
                <tr>
                  <th>Year</th>
                  <th>Description</th>
                  <th>Agency</th>
                </tr>
              </thead>
              <tbody>
                {pubs.map((p, i) => (
                  <tr key={p.year + '-' + i}>
                    <td className="pub-year">{p.year}</td>
                    <td className="pub-desc">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                          {p.desc}
                          <span className="visually-hidden"> (opens in new tab)</span>
                        </a>
                      ) : (
                        p.desc
                      )}
                    </td>
                    <td className="pub-agency">{p.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })()}
      </div>
    ),
  },
  {
    id: 'media',
    title: 'Media and Public Commentary',
    intro: 'Examples of public-facing commentary and thought leadership.',
    content: (
      <div className="tag-grid">
        {[
          { text: 'Africa’s free trade on track, more efforts needed: Rongai Chizema', url: 'https://youtu.be/7HxfQHdvNU8' },
          { text: 'Talking African Industrialization: Pan Africa Parliament', url: 'https://www.facebook.com/panafricanparliament/videos/511710442936093/' },
          { text: 'Zim ready to ride on AfCFTA opportunities: Rongai Chizema', url: 'https://www.newsday.co.zw/2019/10/zim-ready-to-ride-on-afcfta-opportunities/' },
          { text: 'Industrialisation: Africa’s only Saviour: Rongai Chizema', url: 'https://www.newsday.co.zw/2019/10/industrialisation-africas-only-saviour/' },
          { text: 'SABC 3 News Report on the 2019 Manufacturing Indaba, Sandton South Africa', url: 'https://youtu.be/LN-b-cn9eu4' },
          { text: 'Border Closure to Stabilize Nigeria’s Economy for Africa’s Industrialization', url: 'https://youtu.be/AG4BMdUK3h4' },
          { text: 'Towards harmonized AU-RECs industrial policies for Africa’s economic integration', url: 'https://www.africannewspage.net/2019/10/towards-harmonized-au-recs-industrial-policies-for-africas-economic-integration/' },
          { text: 'LA PRESSE PANAFRICAINE SENSIBILISÉE SUR L’INDUSTRIALISATION', url: 'https://www.youtube.com/watch?v=IPb7JYvXfLw' },
          ].map((item) => (
          <span key={item.text} className="tag-chip tag-chip--muted">
            <a className="no-icon" href={item.url} target="_blank" rel="noopener noreferrer">
              {getPlatformIcon(item.url)}
              <span>{item.text}</span>
              <span className="visually-hidden"> (opens in new tab)</span>
            </a>
          </span>
        ))}
      </div>
    ),
  },
]

const CvSection = ({ section, defaultOpen = false }) => (
  <details className="cv-accordion" open={defaultOpen}>
    <summary className="cv-accordion__summary">
      <span>
        <span className="cv-accordion__kicker">{section.id}</span>
        <strong>{section.title}</strong>
      </span>
      <span className="cv-accordion__icon" aria-hidden="true" />
    </summary>
    <div className="cv-accordion__body">
      <p className="cv-accordion__intro">{section.intro}</p>
      {section.content}
    </div>
  </details>
)

const Cv = () => {
  const summarySection = sections.find(s => s.id === 'summary')

  return (
    <div className="page page--cv">
      <section className="cv-hero">
        <div className="cv-hero__portrait">
          <img src={profileImage} alt="Profile portrait" className="cv-hero__image" loading="lazy" decoding="async" />
        </div>

        <div className="cv-hero__copy">
         
          <h1>Professional profile</h1>
          <p className="cv-lead">{summarySection && summarySection.intro}</p>
          {summarySection && summarySection.content}
          <div className="cv-hero__actions">
            <a href="#accordion" className="button button--primary">Open sections</a>
            <a href="#experience" className="button button--secondary">Jump to experience</a>
          </div>
        </div>
      </section>

      <section className="cv-accordion-list" id="accordion">
        {sections.filter(sec => sec.id !== 'summary').map((section) => (
          <CvSection key={section.id} section={section} />
        ))}
      </section>
    </div>
  )
}

export default Cv