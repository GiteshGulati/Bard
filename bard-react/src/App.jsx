import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './context/authState'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import Following from './pages/Following'
import PostWriter from './pages/PostWriter'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import ArticleDetail from './pages/ArticleDetail'
import PublicProfile from './pages/PublicProfile'
import Bookmarks from './pages/Bookmarks'
import Notifications from './pages/Notifications'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminModeration from './pages/AdminModeration'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading, registrationCompleted } = useAuth()
  if (loading) return null
  if (user && !registrationCompleted) return <Navigate to="/profile" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function NotFound() {
  return <main style={{ maxWidth: 720, margin: '5rem auto', padding: '0 1.5rem' }}><h1 className="font-display">Page not found</h1><p>This page may have moved or the link may be invalid.</p><a href="/blogs">Browse stories</a></main>
}

export default function App() {
  const location = useLocation()
  const { clearRegistrationCompleted } = useAuth()

  useEffect(() => {
    if (location.pathname !== '/signup') clearRegistrationCompleted()
  }, [location.pathname, clearRegistrationCompleted])

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/blogs"     element={<Blogs />} />
        <Route path="/following" element={<Following />} />
        <Route path="/article/id/:id" element={<RequireAuth><ArticleDetail byId /></RequireAuth>} />
        <Route path="/article/:slug" element={<ArticleDetail />} />
        <Route path="/post"      element={<RequireAuth><PostWriter /></RequireAuth>} />
        <Route path="/profile"   element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAdmin><AdminModeration /></RequireAdmin>} />
        <Route path="/login"     element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/signup"       element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
