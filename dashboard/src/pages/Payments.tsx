import { useState, useEffect } from 'react'
import { dashboardApi, Payment } from '../services/api'

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ status: '', method: '', dateFrom: '', dateTo: '' })

  useEffect(() => {
    loadPayments()
  }, [page, filters])

  const loadPayments = async () => {
    try {
      setLoading(true)
      console.log('[Payments] Loading payments with filters:', { ...filters, page })
      const data = await dashboardApi.getPayments({ ...filters, page })
      console.log('[Payments] Received data:', data)
      setPayments(data.payments || [])
      setTotalPages(data.totalPages || 1)
      
      if (!data.payments || data.payments.length === 0) {
        console.warn('[Payments] No payments found in response')
      }
    } catch (error) {
      console.error('[Payments] Error loading payments:', error)
      if (error instanceof Error) {
        console.error('[Payments] Error message:', error.message)
        console.error('[Payments] Error stack:', error.stack)
      }
      // Manter os pagamentos existentes em caso de erro
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1e293b' }}>Payments Overview</h1>
      </header>

      {/* Filters */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            loadPayments()
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="">Todos</option>
                <option value="approved">Aprovado</option>
                <option value="pending">Pendente</option>
                <option value="failed">Falhou</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Método</label>
              <select
                value={filters.method}
                onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="">Todos</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="pix">PIX</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Data Início</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Data Fim</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
      ) : payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <div style={{ marginBottom: '1rem' }}>Nenhum pagamento encontrado</div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Verifique o Console do navegador (F12) para mais detalhes
          </div>
        </div>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Payment ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Valor</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Método</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>{payment.payment_id}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background:
                            payment.status === 'approved'
                              ? '#dcfce7'
                              : payment.status === 'pending'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            payment.status === 'approved'
                              ? '#16a34a'
                              : payment.status === 'pending'
                              ? '#d97706'
                              : '#dc2626',
                        }}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      MT {(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem' }}>{payment.payment_method || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <div>Página {page} de {totalPages}</div>
            <div>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  marginRight: '0.5rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Payments

