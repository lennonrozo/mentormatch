import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { FiLayers, FiUsers, FiMessageCircle, FiUser, FiSettings, FiLogOut } from 'react-icons/fi'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import MyProfile from './pages/MyProfile'
import Swipe from './pages/Swipe'
import Matches from './pages/Matches'
import Connections from './pages/Connections'
import UserProfile from './pages/UserProfile'
import Settings from './pages/Settings'
import { getActiveSessionId, removeSession } from './utils/sessions'

function TopNav(){
  const location = useLocation()
  const path = location.pathname
  const isAuth = path === '/signin' || path === '/signup' || path === '/'
  const [visible, setVisible] = React.useState(true)
  const [lastScrollY, setLastScrollY] = React.useState(0)

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  if(isAuth) return null
  
  const handleLogout = () => {
    const sid = getActiveSessionId()
    if(sid) removeSession(sid)
    window.location.href = '/signin'
  }
  
  return (
    <nav className={`top-nav ${visible ? 'visible' : 'hidden'}`}>
      <Link to="/swipe" className={path.startsWith('/swipe')? 'active':''}><FiLayers/> <span>Swipe</span></Link>
      <Link to="/matches" className={path.startsWith('/matches')? 'active':''}><FiUsers/> <span>Matches</span></Link>
      <Link to="/connections" className={path.startsWith('/connections')? 'active':''}><FiMessageCircle/> <span>Chats</span></Link>
      <Link to="/profile" className={path.startsWith('/profile')? 'active':''}><FiUser/> <span>Profile</span></Link>
      <Link to="/settings" className={path.startsWith('/settings')? 'active':''}><FiSettings/> <span>Settings</span></Link>
      <button onClick={handleLogout} className="logout-btn"><FiLogOut/> <span>Logout</span></button>
    </nav>
  )
}

function BottomNav(){
  const location = useLocation()
  const path = location.pathname
  const isAuth = path === '/signin' || path === '/signup' || path === '/'
  if(isAuth) return null
  return null
}

export default function App(){
  return (
    <div className="app-root">
      <TopNav/>
      <main className="main">
        <Routes>
          <Route path="/" element={<SignIn/>} />
          <Route path="/signup" element={<SignUp/>} />
          <Route path="/signin" element={<SignIn/>} />
          <Route path="/profile" element={<MyProfile/>} />
          <Route path="/swipe" element={<Swipe/>} />
          <Route path="/matches" element={<Matches/>} />
          <Route path="/connections" element={<Connections/>} />
          <Route path="/user/:id" element={<UserProfile/>} />
          <Route path="/settings" element={<Settings/>} />
        </Routes>
      </main>
      <BottomNav/>
    </div>
  )
}
