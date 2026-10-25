import { Link } from 'react-router-dom'
import { TOPICS } from '../data'
import UserPostsSection from '../components/UserPostsSection'

const PILLARS = [
  { icon: '🌞', title: 'Slow Mornings',   desc: 'The first hour sets the tone for the whole day. We believe in protecting mornings — no rush, no notifications, just presence.' },
  { icon: '🧠', title: 'Mental Clarity',  desc: 'A quieter mind makes better decisions. Our guides on journaling, breathwork, and digital detox help you think more clearly.' },
  { icon: '🌌', title: 'Deep Rest',       desc: 'Sleep is not laziness — it is the foundation of everything. We cover the science and rituals of truly restorative rest.' },
  { icon: '🌿', title: 'Time in Nature',  desc: 'Sunlight, fresh air, bare feet on grass — the simplest remedies are often the most profound. We write about getting outside.' },
  { icon: '📚', title: 'Read More',       desc: 'Books, long-form essays, and analogue habits. We champion the lost art of reading slowly, deeply, and without a screen in hand.' },
  { icon: '📝', title: 'Journal Daily',   desc: 'Writing is thinking. A daily journaling practice can reduce anxiety, sharpen focus, and help you understand yourself better.' },
]

export default function Home() {
  return (
    <div style={{ background: '#F2EBE1', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* HERO */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 1.5rem 6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-img-wrap { order: -1; }
          }
        `}</style>

        {/* Image */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
            <div style={{ position: 'absolute', inset: 0, transform: 'translate(16px,16px)', background: 'rgba(0,0,0,0.1)' }} />
            <img
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&auto=format&fit=crop"
              alt="Person relaxing in nature"
              style={{ position: 'relative', width: '100%', objectFit: 'cover', aspectRatio: '3/2' }}
            />
          </div>
        </div>

        {/* Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280' }}>A Mindful Living Journal</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1, letterSpacing: '-0.01em', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>
            Slow Down,<br />Live Fully.
          </h1>
          <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.7, maxWidth: 360 }}>
            Honest stories, practical guides, and quiet inspiration for people who want less noise and more meaning in their daily lives.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', listStyle: 'none' }}>
            {['Ideas for a calmer, more intentional life', 'Deep dives into wellness, sleep & mindfulness', 'New stories every week, no fluff'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                {item}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <Link to="/blogs" className="btn-primary" style={{ background: '#000', color: '#fff', fontWeight: 600, padding: '0.75rem 2rem', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Read the Blog
            </Link>
            <a href="#topics" style={{ fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 4 }}>
              Browse Topics →
            </a>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.75rem 0', overflow: 'hidden', background: '#000', color: '#fff' }}>
        <div className="marquee-inner" style={{ display: 'flex', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {['Mindful Living','Rest & Recovery','Slow Mornings','Mental Clarity','Intentional Days','Journal & Reflect','Mindful Living','Rest & Recovery','Slow Mornings','Mental Clarity','Intentional Days','Journal & Reflect'].map((item, i, arr) => (
            <span key={i} style={{ paddingLeft: i % 2 === 0 ? '3rem' : '1rem', paddingRight: i % 2 === 0 ? '3rem' : '1rem' }}>{item}</span>
          ))}
        </div>
      </div>

      {/* TRENDING TOPICS */}
      <section id="topics" style={{ maxWidth: 1280, margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ marginBottom: '3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Explore</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Trending Topics</h2>
          </div>
          <Link to="/blogs" style={{ fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: 4, color: '#000' }}>View all posts →</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {TOPICS.map(t => (
            <Link key={t.id} to={`/blogs?topic=${t.id}`} className={`topic-card${t.reverse ? ' reverse' : ''}`} aria-label={`Explore ${t.label} posts`}>
              <div className="topic-card__img" style={{ background: t.color }}>
                <img src={t.img} alt={t.label} />
                <span className="topic-num">{t.num}</span>
              </div>
              <div className="topic-card__body">
                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280' }}>{t.sub}</p>
                <h3 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>{t.label}</h3>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6 }}>{t.desc}</p>
                <div>{t.tags.map(tag => <span key={tag} className="topic-tag topic-tag-hover">{tag}</span>)}</div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Read posts <span className="topic-arrow">→</span></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section id="pillars" style={{ maxWidth: 1280, margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ marginBottom: '3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>What We Believe</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>The BARD Philosophy</h2>
          </div>
          <a href="#about" style={{ fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: 4, color: '#000' }}>Our story →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {PILLARS.map(p => (
            <div key={p.title} className="feature-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1.875rem' }}>{p.icon}</div>
              <h3 className="font-display" style={{ fontSize: '1.5rem', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>{p.title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT BANNER */}
      <section id="about" style={{ background: '#000', color: '#fff', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: 768, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>Why We Write</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'center' }}>
            Words are Power.<br />Rest is Radical.
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 480 }}>
            BARD was built on one belief — that in a world addicted to speed, choosing to slow down is an act of courage. We write for people who are done with hustle culture and ready to build something quieter, and better.
          </p>
          <Link to="/signup" style={{ marginTop: '1rem', border: '1px solid #fff', color: '#fff', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 2.5rem', textDecoration: 'none', transition: 'background 0.2s, color 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff' }}
          >
            Join the Community
          </Link>
        </div>
      </section>

      {/* USER POSTS */}
      <UserPostsSection />

      {/* NEWSLETTER */}
      <section id="contact" style={{ maxWidth: 1280, margin: '0 auto', padding: '5rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.75rem' }}>Stay grounded</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Weekly Words<br />Worth Reading.</h2>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.7, maxWidth: 360 }}>One thoughtful email a week. New stories, quiet recommendations, and ideas for living better — no spam, no noise. Ever.</p>
        </div>
        <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 480 }}>
          <input className="nl-input" type="text" placeholder="Your Name" required />
          <input className="nl-input" type="email" placeholder="Email Address" required />
          <button type="submit" className="btn-primary" style={{ background: '#000', color: '#fff', fontWeight: 600, padding: '0.75rem', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Subscribe</button>
        </form>
      </section>

      {/* FOOTER */}
      <footer style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: '#757575' }}>
        <Link to="/" className="font-display" style={{ fontSize: '1.5rem', letterSpacing: '-0.04em', color: '#000', textDecoration: 'none' }}>BARD</Link>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
          {[['/', 'Home'], ['/blogs', 'Blog'], ['/following', 'Following'], ['/login', 'Log In'], ['/signup', 'Sign Up'], ['/profile', 'Profile']].map(([to, label]) => (
            <Link key={to} to={to} className="nav-link" style={{ color: '#757575', fontSize: '0.75rem' }}>{label}</Link>
          ))}
        </nav>
        <p>© 2026 BARD. All rights reserved.</p>
      </footer>
    </div>
  )
}
