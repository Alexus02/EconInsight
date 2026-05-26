import './cv.css'

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
      <div className="timeline-list">
        {[
          'ILO / LEDRIZ - Technical Lead, AfCFTA and Labour (2021-2022)',
          'UNECA / COMESA - Economics Consultant (2021)',
          'UNITAR / Africa Union Chairperson Support Project - Senior Trade Adviser to the AU Chairperson (2021-2022)',
          'ZimConsult / UNECA - Economics Consultant (2017)',
          'SARDC - Economics Consultant (2017)',
          'Crown Agents / Government of Zimbabwe / AfDB-linked programme - Industry and Trade Expert (2016)',
          'USAID - Strategic Economic Research and Analysis (SERA) - Senior Economist / Economic Policy Adviser (2015-2016)',
          'European Union / COMESA / Government of Zimbabwe - Industry and Trade Analysis Assignment (2004)',
          'AU Commission / UNIDO collaboration - Chief Technical Adviser, AIDA (2018-2020)',
          'AfCFTA Secretariat / EU Technical Assistance Facility - Senior Programme Manager and analytical lead support (2022-2023)',
        ].map((item, index) => (
          <article key={item} className="timeline-item">
            <span className="timeline-item__index">{String(index + 1).padStart(2, '0')}</span>
            <p>{item}</p>
          </article>
        ))}
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
        <article>
          <div className="detail-list">
            <p><strong>Master of Arts in Development Economics</strong><span>Williams College, USA | 1994 - 1995 | Cum Laude</span></p>
            <p><strong>Diploma in Investment Analysis and Portfolio Management</strong><span>University of South Africa | 2002 - 2003</span></p>
            <p><strong>Advanced Course on Aspects of Fiscal Reform</strong><span>International Monetary Fund / ESAIRDM, Zimbabwe | 1993</span></p>
            <p><strong>Bachelor of Science (Honours) in Economics</strong><span>University of Zimbabwe | 1989 - 1991</span></p>
          </div>
        </article>

        <article>
          <div className="detail-list">
            <p><strong>Languages</strong><span>English fluent; Shona native / fluent</span></p>
            <p><strong>Professional membership</strong><span>Zimbabwe Economics Society</span></p>
            <p><strong>Technical skills</strong><span>Windows, Excel, PowerPoint, SPSS, research and policy analysis, economic reporting, stakeholder briefings</span></p>
            <p><strong>Country and regional exposure</strong><span>Zimbabwe, Ghana, Ethiopia, Nigeria, Sierra Leone, Zambia, Kenya, Tanzania, Uganda, DRC, Congo Brazzaville, Senegal, Mali, Gabon, Niger, Cameroon, Liberia, Morocco, South Africa, Namibia, Eswatini, Guinea-Bissau, Guinea-Conakry, and broader SADC, COMESA, EAC, ECOWAS, IGAD, ECCAS, UMA and CEN-SAD exposure</span></p>
          </div>
        </article>
      </div>
    ),
  },
  {
    id: 'publications',
    title: 'Selected Publications',
    intro: 'Research and policy output across integration, trade, industrialisation, and reform work.',
    content: (
      <div className="stack-cards">
        {[
          '2021: Assess the feasibility of establishing and managing a common Agro-industrial park between Zambia and Zimbabwe (CAIP) - UNECA and COMESA.',
          '2019: Status on the Implementation of the SADC Integration: Papers on Trade & Market Integration, and on Industrialization - SARDC.',
          '2017: Integration in Southern Africa: The Role, Prospects and Progress of the EAC-COMESA-SADC Tripartite Agreement - UNECA.',
          '2017: Promoting Growth and Economic Transformation in Southern Africa: The Challenges and Implications for Declining Commodity Prices - UNECA.',
          '2015: Prospects for Industrial Transformation in SADC: Towards a Regional Industrialisation Roadmap - SARDC.',
          '2016: Development of the Zimbabwe Regional Integration Strategic Framework (RISF) - Crown Agents / AfDB-linked programme.',
          '2013: Industrialization for Economic Transformation and Sustainable Development in Southern Africa: Addressing the Gaps - UNECA.',
          '2012: Tripartite Free Trade Area Industrial Pillar Baseline Study and complimentary business factors affecting industrial development.',
          '2004: Assessment of Zimbabwe’s compliance to the COMESA Common Investment Area Framework.',
          '2004: Impact Assessment of the COMESA Common External Tariff for Zimbabwe.',
        ].map((item) => (
          <article key={item} className="stack-card stack-card--soft">
            <p>{item}</p>
          </article>
        ))}
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
          'Africa’s free trade on track, more efforts needed: Rongai Chizema',
          'Talking African Industrialization: Pan Africa Parliament',
          'Zim ready to ride on AfCFTA opportunities: Rongai Chizema',
          'Industrialisation: Africa’s only Saviour: Rongai Chizema',
          'SABC 3 News Report on the 2019 Manufacturing Indaba, Sandton South Africa',
          'Border Closure to Stabilize Nigeria’s Economy for Africa’s Industrialization',
          'Towards harmonized AU-RECs industrial policies for Africa’s economic integration',
          'LA PRESSE PANAFRICAINE SENSIBILISÉE SUR L’INDUSTRIALISATION',
        ].map((item) => (
          <span key={item} className="tag-chip tag-chip--muted">
            {item}
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
  return (
    <div className="page page--cv">
      <section className="cv-hero">
        <p className="cv-kicker">Curriculum Vitae</p>
        <h1>Professional profile</h1>
        <p className="cv-lead">
          Economist and Africa-focused political economy analyst with over 28 years of experience in economic
          intelligence gathering, macroeconomic and policy analysis, trade and industrial policy, and strategic
          advisory work across national, regional, and continental institutions in Africa.
        </p>
        <div className="cv-hero__actions">
          <a href="#accordion" className="button button--primary">Open sections</a>
          <a href="#experience" className="button button--secondary">Jump to experience</a>
        </div>
      </section>

      <section className="cv-accordion-list" id="accordion">
        {sections.map((section, index) => (
          <CvSection key={section.id} section={section} />
        ))}
      </section>
    </div>
  )
}

export default Cv