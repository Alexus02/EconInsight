import FileViewer from '../components/file-viewer'
import '../styles/library.css'

function Library() {
  return (
    <section className="library-page">
      <div className="library-page__intro">
        <p className="library-kicker">Research library</p>
        <h1>EconInsight documents</h1>
        <p>Browse the latest research files published by the host portal.</p>
      </div>

      <FileViewer />
    </section>
  )
}

export default Library
