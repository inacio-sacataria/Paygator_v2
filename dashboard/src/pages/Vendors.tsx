import { useEffect, useState } from 'react'
import { dashboardApi, Vendor, VendorPayout } from '../services/api'

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [payouts, setPayouts] = useState<VendorPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [vRes, pRes] = await Promise.all([
        dashboardApi.getVendors({ limit: 100 }),
        dashboardApi.getVendorPayouts({ limit: 200 }),
      ])
      setVendors(vRes.vendors || [])
      setPayouts(pRes.payouts || [])
      setError('')
    } catch (err) {
      setError('Erro ao carregar vendors e payouts')
      console.error(err)
    } finally {
      setLoading(false)
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
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1e293b' }}>Vendors</h1>
      </header>

      <section
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Lista de Vendors</h2>
        {vendors.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>ID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Nome</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Email</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Telefone</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Vendor Share %</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.vendor_id}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{v.vendor_id}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{v.name}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{v.email || '-'}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{v.phone || '-'}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{(v.vendor_share ?? 85)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>Nenhum vendor registado.</p>
        )}
      </section>

      <section
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Payouts / Comissões</h2>
        {payouts.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Payment ID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Vendor</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Comissão Sistema</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Valor Vendor</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id ?? p.payment_id + p.vendor_id}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{p.payment_id}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{p.vendor_id}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{(p.total_amount / 100).toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{(p.system_commission_amount / 100).toFixed(2)} ({p.system_commission_pct}%)</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{(p.vendor_amount / 100).toFixed(2)}</td>
                    <td
                      style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e2e8f0',
                        color: p.status === 'completed' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : '#d97706',
                      }}
                    >
                      {p.status}
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleString('pt-BR') : (p.created_at ? new Date(p.created_at).toLocaleString('pt-BR') : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>Nenhum payout registado.</p>
        )}
      </section>
    </div>
  )
}

export default Vendors
