import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Verificar autenticação no servidor
    const checkAuth = async () => {
      try {
        // Usar URL completa para garantir que vá para o backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        // Aviso se a variável não estiver configurada em produção
        if (!import.meta.env.VITE_API_URL && import.meta.env.MODE === 'production') {
          console.error('[AUTH] ⚠️ VITE_API_URL não está configurada! Configure no Vercel: Settings → Environment Variables');
        }
        const response = await fetch(`${apiUrl}/admin/api/auth/check`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (!response.ok) {
          console.error('Auth check failed:', response.status, response.statusText)
          setIsAuthenticated(false)
          sessionStorage.removeItem('admin_authenticated')
          return
        }
        
        const data = await response.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          sessionStorage.setItem('admin_authenticated', 'true')
        } else {
          setIsAuthenticated(false)
          sessionStorage.removeItem('admin_authenticated')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
        sessionStorage.removeItem('admin_authenticated')
      }
    }
    checkAuth()
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      console.log('[LOGIN] Attempting login...');
      // Usar URL completa para garantir que vá para o backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({ password }),
        credentials: 'include',
      })
      
      console.log('[LOGIN] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Login failed:', response.status, errorText)
        return false
      }

      const data = await response.json().catch((err) => {
        console.error('[LOGIN] Error parsing JSON:', err);
        return null;
      })
      
      console.log('[LOGIN] Response data:', data);
      
      if (data?.success) {
        console.log('[LOGIN] Login successful! Setting authenticated state.');
        setIsAuthenticated(true)
        sessionStorage.setItem('admin_authenticated', 'true')
        return true
      }
      
      console.error('[LOGIN] Login failed:', data?.message || 'Unknown error', data)
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${apiUrl}/admin/logout`, { credentials: 'include' })
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

