import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BardAuth } from '../auth'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(() => BardAuth.getUser())
  const navigate = useNavigate()

  function handleLogout() {
    BardAuth.logout()
    setUser(null)
    navigate('/')
  }

  // Re-check auth state whenever the menu toggles (simple reactive approach)
  function toggleMenu() {
    setUser(BardAuth.getUser())
    setMenuOpen(m => !m)
  }

  const linkCls = ({ isActive }) =>
    `nav-link text-sm${isActive ? ' font-bold' : ''}`

  return (
    <header
      id="nav"
      style={{ position: 'sticky', top: 0, zIndex: 50, background: '#F2EBE1', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link to="/" className="font-display" style={{ fontSize: '1.875rem', letterSpacing: '-0.04em', lineHeight: 1, textDecoration: 'none', color: '#000' }}>
          BARD
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '0.875rem' }} className="desktop-nav">
          <NavLink to="/"          className={linkCls}>Home</NavLink>
          <NavLink to="/blogs"     className={linkCls}>Blog</NavLink>
          <NavLink to="/following" className={linkCls}>Following</NavLink>
          <NavLink to="/post"      className={linkCls}>Post</NavLink>
          <NavLink to="/profile"   className={linkCls}>Profile</NavLink>
          <a href="#about" className="nav-link" style={{ fontSize: '0.875rem' }}>About</a>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {!user ? (
            <>
              <Link to="/login" className="nav-link" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'none' }} id="desktop-login">Log In</Link>
              <Link to="/signup"
                className="btn-primary"
                style={{ background: '#000', color: '#fff', fontSize: '0.875rem', fontWeight: 600, padding: '0.5rem 1.25rem', textDecoration: 'none', display: 'none' }}
                id="desktop-signup"
              >Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="nav-link" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Profile</Link>
              <button onClick={handleLogout} className="nav-link" style={{ fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Log Out</button>
            </>
          )}
          <button aria-label="Shopping Bag" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 1, transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.6'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>shopping_bag</span>
          </button>
          <button id="menu-btn" aria-label="Open menu" onClick={toggleMenu}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>

      {/* Auth-aware desktop links (CSS-driven show/hide) */}
      <style>{`
        @media (min-width: 768px) {
          #desktop-login, #desktop-signup { display: block !important; }
          #menu-btn { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', background: '#F2EBE1' }}>
          <Link to="/"          onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/blogs"     onClick={() => setMenuOpen(false)} style={{ fontWeight: 700 }}>Blog</Link>
          <Link to="/following" onClick={() => setMenuOpen(false)}>Following</Link>
          <Link to="/post"      onClick={() => setMenuOpen(false)}>Post</Link>
          <Link to="/profile"   onClick={() => setMenuOpen(false)}>Profile</Link>
          {!user ? (
            <>
              <Link to="/login"  onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}
                className="btn-primary"
                style={{ background: '#000', color: '#fff', textAlign: 'center', padding: '0.5rem', fontWeight: 600, textDecoration: 'none' }}
              >Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Log Out</button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
