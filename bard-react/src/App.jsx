import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import Following from './pages/Following'
import PostWriter from './pages/PostWriter'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/blogs"     element={<Blogs />} />
        <Route path="/following" element={<Following />} />
        <Route path="/post"      element={<PostWriter />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />
      </Routes>
    </>
  )
}
