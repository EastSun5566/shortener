import { useState, useCallback } from 'react'

export function useAuth () {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'))

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}
