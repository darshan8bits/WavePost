import { useState, useEffect } from 'react'
import Login from './pages/Login'

function App() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  function handleLogin(newToken) {
    setToken(newToken)
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold text-green-400">Logged in! Dashboard coming soon.</h1>
    </div>
  )
}

export default App