
import { useEffect, useState } from 'react'
import { logsApi, LogStats, ApiLog, PaymentLog, PaginatedLogs } from '../services/api'

type Tab = 'api' | 'payments'

const Logs = () => {
  const [tab, setTab] = useState<Tab>('api')
  const [stats, setStats] = useState<LogStats | null>(null)
  const [apiLogs, setApiLogs] = useState<PaginatedLogs<ApiLog> | null>(null)
  const [paymentLogs, setPaymentLogs] = useState<PaginatedLogs<PaymentLog> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      setError('')
      const [statsRes, apiRes, payRes] = await Promise.all([
        logsApi.getStats(),
        logsApi.getApiLogs({ page: 1 }),
        logsApi.getPaymentLogs({ page: 1 }),
      ])
      setStats(statsRes)
      setApiLogs(apiRes)
      setPaymentLogs(payRes)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }

  const renderStats = () => {
    if (!stats) return null
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard title="Logs de API" value={stats.totalApiLogs} subtitle="Total histórico" color="#3b82f6" />
        <StatCard title="Logs de Pagamentos" value={stats.totalPaymentLogs} subtitle="Total histórico" color="#16a34a" />
        <StatCard title="Erros" value={stats.errorCount} subtitle="Total de erros em API" color="#dc2626" />
        <StatCard
          title="Logs Hoje"
          value={stats.todayApiLogs + stats.todayPaymentLogs}
          subtitle="API + Pagamentos (hoje)"
          color="#d97706"
        />
      </div>
    )
  }

  const renderApiLogs = () => {
    if (!apiLogs || apiLogs.logs.length === 0) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Nenhum log de API encontrado.</div>
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <Th>Método</Th>
              <Th>URL</Th>
              <Th>Status</Th>
              <Th>Tempo</Th>
              <Th>IP</Th>
              <Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {apiLogs.logs.map((log, idx) => (
              <tr key={idx}>
                <Td>{log.method}</Td>
                <Td>{log.url}</Td>
                <Td
                  style={{
                    color:
                      (log.response_status || 0) >= 500
                        ? '#dc2626'
                        : (log.response_status || 0) >= 400
                        ? '#d97706'
                        : '#16a34a',
                  }}
                >
                  {log.response_status ?? '-'}
                </Td>
                <Td>{log.response_time_ms != null ? `${log.response_time_ms} ms` : '-'}</Td>
                <Td>{log.ip_address || '-'}</Td>
                <Td>{new Date(log.created_at).toLocaleString('pt-BR')}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderPaymentLogs = () => {
    if (!paymentLogs || paymentLogs.logs.length === 0) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Nenhum log de pagamento encontrado.</div>
      )
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <Th>Payment ID</Th>
              <Th>Ação</Th>
              <Th>Status</Th>
              <Th>Valor</Th>
              <Th>Cliente</Th>
              <Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {paymentLogs.logs.map((log, idx) => (
              <tr key={idx}>
                <Td>{log.payment_id}</Td>
                <Td>{log.action}</Td>
                <Td>
                  {log.previous_status || '—'} → {log.new_status || '—'}
                </Td>
                <Td>
                  {log.amount != null
                    ? `MT ${log.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '-'}
                </Td>
                <Td>{log.customer_email || '-'}</Td>
                <Td>{new Date(log.created_at).toLocaleString('pt-BR')}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1e293b' }}>Logs</h1>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'A atualizar...' : 'Atualizar'}
        </button>
      </header>

      {renderStats()}

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <TabButton active={tab === 'api'} onClick={() => setTab('api')}>
            Logs de API
          </TabButton>
          <TabButton active={tab === 'payments'} onClick={() => setTab('payments')}>
            Logs de Pagamentos
          </TabButton>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {loading && !apiLogs && !paymentLogs ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando logs...</div>
          ) : tab === 'api' ? (
            renderApiLogs()
          ) : (
            renderPaymentLogs()
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  subtitle,
  color,
}: {
  title: string
  value: number
  subtitle: string
  color: string
}) => (
  <div
    style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{title}</span>
      <div
        style={{
          padding: '0.5rem',
          borderRadius: '6px',
          background: `${color}20`,
          color,
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        LOGS
      </div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{value}</div>
    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{subtitle}</div>
  </div>
)

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      padding: '0.75rem 1rem',
      border: 'none',
      background: active ? '#eff6ff' : 'transparent',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      color: active ? '#1d4ed8' : '#64748b',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
)

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    style={{
      padding: '0.75rem',
      textAlign: 'left',
      borderBottom: '1px solid #e2e8f0',
      background: '#f8fafc',
      fontWeight: 500,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748b',
    }}
  >
    {children}
  </th>
)

const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', color: '#111827' }}>{children}</td>
)

export default Logs
