import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import Following from './pages/Following'
import PostWriter from './pages/PostWriter'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/profile" replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/blogs"     element={<Blogs />} />
        <Route path="/following" element={<Following />} />
        <Route path="/post"      element={<RequireAuth><PostWriter /></RequireAuth>} />
        <Route path="/profile"   element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/login"     element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/signup"       element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </>
  )
}
