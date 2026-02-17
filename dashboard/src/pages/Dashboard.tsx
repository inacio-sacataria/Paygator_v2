import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { dashboardApi, DashboardStats } from '../services/api'
import { DollarSign, CheckCircle, Clock, XCircle, Calendar, TrendingUp } from 'lucide-react'
import VendorB2CForm from '../components/VendorB2CForm'

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const [distributeLoading, setDistributeLoading] = useState(false)
  const [distributeResult, setDistributeResult] = useState<{ message: string; total?: number; distributed?: number; failed?: number } | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
      setError('')
    } catch (err) {
      setError('Erro ao carregar estatísticas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDistributeAll = async () => {
    try {
      setDistributeLoading(true)
      setDistributeResult(null)
      const res = await dashboardApi.distributePayments()
      setDistributeResult({
        message: res.message,
        total: res.data?.total,
        distributed: res.data?.distributed,
        failed: res.data?.failed,
      })
      if (res.success) loadStats()
    } catch (err: any) {
      setDistributeResult({ message: err.response?.data?.message || err.message || 'Erro ao distribuir' })
    } finally {
      setDistributeLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
        {error}
      </div>
    )
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1e293b' }}>Dashboard</h1>
      </header>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title="Total de Pagamentos"
          value={stats?.totalPayments || 0}
          subtitle="Total histórico"
          icon={<DollarSign size={24} />}
          color="#3b82f6"
        />
        <StatCard
          title="Valor Total"
          value={`MT ${(stats?.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Receita total"
          icon={<TrendingUp size={24} />}
          color="#16a34a"
        />
        <StatCard
          title="Pagamentos Aprovados"
          value={stats?.successfulPayments || 0}
          subtitle="Aprovados com sucesso"
          icon={<CheckCircle size={24} />}
          color="#16a34a"
        />
        <StatCard
          title="Pagamentos Pendentes"
          value={stats?.pendingPayments || 0}
          subtitle="Aguardando processamento"
          icon={<Clock size={24} />}
          color="#d97706"
        />
        <StatCard
          title="Pagamentos Falharam"
          value={stats?.failedPayments || 0}
          subtitle="Falharam no processamento"
          icon={<XCircle size={24} />}
          color="#dc2626"
        />
        <StatCard
          title="Hoje"
          value={stats?.todayPayments || 0}
          subtitle={`MT ${(stats?.todayAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} hoje`}
          icon={<Calendar size={24} />}
          color="#3b82f6"
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <ActionCard
          title="Ver Todos os Pagamentos"
          description="Visualizar histórico completo de pagamentos"
          link="/payments"
        />
        <ActionCard
          title="Ver Vendors"
          description="Lista de vendors e payouts (comissões)"
          link="/vendors"
        />
        <ActionCard
          title="Ver Pedidos"
          description="Gerenciar pedidos e status"
          link="/orders"
        />
        <ActionCard
          title="Pagamentos Pendentes"
          description="Revisar pagamentos aguardando"
          link="/payments?status=pending"
        />
      </div>

      {/* Distribuir todos os pagamentos concluídos */}
      <div
        style={{
          marginTop: '2rem',
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
          Distribuir pagamentos aos vendors
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Envia todos os pagamentos com status <strong>concluído</strong> que ainda não foram pagos ao vendor. O sistema calcula a comissão e regista em Payouts.
        </p>
        <button
          type="button"
          onClick={handleDistributeAll}
          disabled={distributeLoading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: distributeLoading ? 'wait' : 'pointer',
          }}
        >
          {distributeLoading ? 'A processar...' : 'Distribuir todos os pagamentos concluídos'}
        </button>
        {distributeResult && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '6px',
              background: distributeResult.failed !== undefined && distributeResult.failed > 0 ? '#fef3c7' : '#dcfce7',
              color: '#166534',
            }}
          >
            {distributeResult.message}
            {distributeResult.total !== undefined && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Total: {distributeResult.total} | Distribuídos: {distributeResult.distributed} | Falhas: {distributeResult.failed}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vendor B2C Form */}
      <VendorB2CForm
        initialPaymentId={searchParams.get('paymentId') || ''}
        initialCommission={searchParams.get('commissionPercentage') || ''}
        initialPhone={searchParams.get('vendorPhone') || ''}
      />
    </div>
  )
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color: string
}) => (
  <div
    style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{title}</span>
      <div style={{ padding: '0.5rem', borderRadius: '6px', background: `${color}20`, color }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{subtitle}</div>
  </div>
)

const ActionCard = ({ title, description, link }: { title: string; description: string; link: string }) => (
  <div
    style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
    }}
  >
    <Link
      to={link}
      style={{
        color: '#3b82f6',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '1rem',
        display: 'block',
        marginBottom: '0.5rem',
      }}
    >
      {title}
    </Link>
    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{description}</p>
  </div>
)

export default Dashboard

