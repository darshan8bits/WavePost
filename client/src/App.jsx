import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) setToken(savedToken)
  }, [])

  function handleLogin(newToken) {
    setToken(newToken)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard token={token} onLogout={handleLogout} />
}

export default App