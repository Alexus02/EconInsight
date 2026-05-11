import React from 'react'
import SkeletonLoader from '../components/SkeletonLoader'
import '../styles/skeleton.css'

const Home = () => {
  return (
    <div className="home-skeleton">
      <section className="home-hero">
        <div className="hero-text">
          <SkeletonLoader variant="title" style={{width: '60%'}} />
          <SkeletonLoader variant="text" style={{width: '90%'}} />
          <SkeletonLoader variant="text" style={{width: '80%'}} />
          <div style={{height:16}} />
          <div style={{display:'flex', gap:12}}>
            <SkeletonLoader variant="small-rect" style={{width:120}} />
            <SkeletonLoader variant="small-rect" style={{width:120}} />
          </div>
        </div>

        <div className="hero-media">
          <SkeletonLoader variant="rect" />
        </div>
      </section>

      <section>
        <h3>Latest research</h3>
        <div className="home-cards">
          {[1,2,3].map(i => (
            <div key={i} className="card-skeleton">
              <SkeletonLoader variant="small-rect" />
              <div style={{height:12}} />
              <SkeletonLoader variant="title" style={{width:'70%'}} />
              <SkeletonLoader variant="text" style={{width:'90%'}} />
            </div>
          ))}
        </div>
      </section>

      <section className="home-media">
        <div>
          <SkeletonLoader variant="rect" className="media-image" />
        </div>
        <div>
          <SkeletonLoader variant="title" style={{width:'60%'}} />
          <SkeletonLoader variant="text" style={{width:'90%'}} />
          <SkeletonLoader variant="text" style={{width:'85%'}} />
          <div style={{height:16}} />
          <SkeletonLoader variant="small-rect" style={{width:140}} />
        </div>
      </section>

      <section>
        <h3>Our Services</h3>
        <div className="home-services">
          {[1,2,3].map(i => (
            <div key={i}>
              <SkeletonLoader variant="small-rect" />
              <div style={{height:12}} />
              <SkeletonLoader variant="title" style={{width:'60%'}} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>What Clients Say</h3>
        <div className="home-testimonials">
          {[1,2,3].map(i => (
            <div key={i} style={{padding:12}}>
              <SkeletonLoader variant="circle" />
              <div style={{height:12}} />
              <SkeletonLoader variant="text" style={{width:'80%'}} />
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <SkeletonLoader variant="small-rect" style={{width:160, height:44}} />
        <SkeletonLoader variant="small-rect" style={{width:140, height:44}} />
      </section>
    </div>
  )
}

export default Home
