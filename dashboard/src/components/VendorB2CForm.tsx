import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'

interface VendorB2CFormProps {
  initialPaymentId?: string
  initialCommission?: string
  initialPhone?: string
}

const VendorB2CForm = ({ initialPaymentId, initialCommission, initialPhone }: VendorB2CFormProps) => {
  const [paymentId, setPaymentId] = useState(initialPaymentId || '')
  const [commission, setCommission] = useState(initialCommission || '')
  const [vendorPhone, setVendorPhone] = useState(initialPhone || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; data?: any } | null>(null)

  useEffect(() => {
    if (initialPaymentId) setPaymentId(initialPaymentId)
    if (initialCommission) setCommission(initialCommission)
    if (initialPhone) setVendorPhone(decodeURIComponent(initialPhone))
  }, [initialPaymentId, initialCommission, initialPhone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const data = await dashboardApi.processVendorB2C({
        paymentId: paymentId.trim(),
        commissionPercentage: commission ? parseFloat(commission) : undefined,
        vendorPhone: vendorPhone.trim() || undefined,
      })

      if (data.success) {
        setResult({
          type: 'success',
          message: 'Pagamento B2C ao vendor processado com sucesso!',
          data: data.data,
        })
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Erro ao processar pagamento B2C ao vendor',
        })
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Erro de conexão',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: '2rem',
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '1.5rem' }}>
        Pagar Vendor (B2C com Comissão)
      </h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Após um pagamento C2B ser completado, use esta ferramenta para pagar o vendor. O sistema calcula
        automaticamente a comissão baseada no vendorShare do pagamento original.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
              Payment ID (C2B Completo)
            </label>
            <input
              type="text"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
              placeholder="ID do pagamento C2B completado"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
              Comissão do Sistema (%)
            </label>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              step="0.1"
              min="0"
              max="100"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
              placeholder="Deixe vazio para usar vendorShare do pagamento"
            />
            <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
              Opcional: Se não informado, usa o vendorShare do pagamento original
            </small>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
            Telefone do Vendor (Opcional)
          </label>
          <input
            type="text"
            value={vendorPhone}
            onChange={(e) => setVendorPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
            placeholder="+258862502502 (opcional se configurado no vendorMerchant)"
          />
          <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
            Opcional: Se não informado, usa o telefone do vendorMerchant do pagamento
          </small>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Processando...' : 'Pagar Vendor (B2C)'}
          </button>
        </div>
      </form>

      {result && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '6px',
            background: result.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: result.type === 'success' ? '#16a34a' : '#dc2626',
          }}
        >
          <strong>{result.type === 'success' ? 'Sucesso!' : 'Erro:'}</strong>
          <br />
          {result.message}
          {result.data && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <strong>Detalhes:</strong>
              <br />
              Transaction ID: {result.data.transactionId || 'N/A'}
              <br />
              Status: {result.data.status || 'N/A'}
              <br />
              <strong>Valores:</strong>
              <br />
              Valor Total: MT {(result.data.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <br />
              Valor ao Vendor: MT {(result.data.vendorAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <br />
              Comissão do Sistema: {result.data.systemCommission || 'N/A'}% (MT{' '}
              {(result.data.systemCommissionAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VendorB2CForm

