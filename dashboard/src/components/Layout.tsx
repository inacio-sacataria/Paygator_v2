import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, CreditCard, ShoppingCart, FileText, LogOut } from 'lucide-react'

const Layout = () => {
  const { logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          background: '#1e293b',
          color: 'white',
          padding: '2rem 0',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 2rem 2rem', borderBottom: '1px solid #334155', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
            Paygator
          </div>
        </div>
        <nav>
          <ul style={{ listStyle: 'none' }}>
            <li>
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 2rem',
                  color: isActive('/') ? 'white' : '#cbd5e1',
                  textDecoration: 'none',
                  background: isActive('/') ? '#334155' : 'transparent',
                }}
              >
                <Home size={20} style={{ marginRight: '0.75rem' }} />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/payments"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 2rem',
                  color: isActive('/payments') ? 'white' : '#cbd5e1',
                  textDecoration: 'none',
                  background: isActive('/payments') ? '#334155' : 'transparent',
                }}
              >
                <CreditCard size={20} style={{ marginRight: '0.75rem' }} />
                Pagamentos
              </Link>
            </li>
            <li>
              <Link
                to="/orders"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 2rem',
                  color: isActive('/orders') ? 'white' : '#cbd5e1',
                  textDecoration: 'none',
                  background: isActive('/orders') ? '#334155' : 'transparent',
                }}
              >
                <ShoppingCart size={20} style={{ marginRight: '0.75rem' }} />
                Pedidos
              </Link>
            </li>
            <li>
              <Link
                to="/logs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 2rem',
                  color: isActive('/logs') ? 'white' : '#cbd5e1',
                  textDecoration: 'none',
                  background: isActive('/logs') ? '#334155' : 'transparent',
                }}
              >
                <FileText size={20} style={{ marginRight: '0.75rem' }} />
                Logs
              </Link>
            </li>
            <li style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 2rem',
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LogOut size={20} style={{ marginRight: '0.75rem' }} />
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '250px', padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

