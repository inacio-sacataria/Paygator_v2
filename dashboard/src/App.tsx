import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import Orders from './pages/Orders'
import Logs from './pages/Logs'
import Vendors from './pages/Vendors'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="payments" element={<Payments />} />
            <Route path="orders" element={<Orders />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="logs" element={<Logs />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

