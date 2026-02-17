import axios from 'axios'

// Usar URL completa para garantir que vá para o backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DASHBOARD_API_KEY = 'main_70a3ae2d414936451d05d19f7ca4b01c1761ee04b519b93961f56fa2a27cc914';

// Avisos em produção
if (!import.meta.env.VITE_API_URL && import.meta.env.MODE === 'production') {
  console.error('[API] ⚠️ VITE_API_URL não está configurada! Configure no Vercel: Settings → Environment Variables');
  console.error('[API] Usando fallback:', API_BASE_URL);
}

if (!DASHBOARD_API_KEY) {
  console.warn('[API] ⚠️ VITE_API_KEY não está configurada. As rotas /admin/api vão depender apenas de sessão (cookies).');
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/admin/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    ...(DASHBOARD_API_KEY
      ? { 'X-API-Key': DASHBOARD_API_KEY }
      : {}),
  },
})

export interface DashboardStats {
  totalPayments: number
  totalAmount: number
  successfulPayments: number
  pendingPayments: number
  failedPayments: number
  todayPayments: number
  todayAmount: number
}

export interface Payment {
  payment_id: string
  order_id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  vendor_name?: string
  vendor_email?: string
  vendor_phone?: string
  created_at: string
}

export interface PaymentFilter {
  page?: number
  status?: string
  method?: string
  dateFrom?: string
  dateTo?: string
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/stats')
    return response.data
  },

  getPayments: async (filter: PaymentFilter = {}) => {
    try {
      console.log('[API] Fetching payments with filter:', filter)
      const response = await api.get('/payments', { params: filter })
      console.log('[API] Payments response status:', response.status)
      console.log('[API] Payments response data:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[API] Error fetching payments:', error)
      if (error.response) {
        console.error('[API] Response status:', error.response.status)
        console.error('[API] Response data:', error.response.data)
      } else if (error.request) {
        console.error('[API] Request made but no response received:', error.request)
      } else {
        console.error('[API] Error setting up request:', error.message)
      }
      throw error
    }
  },

  processVendorB2C: async (data: {
    paymentId: string
    commissionPercentage?: number
    vendorPhone?: string
  }) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await axios.post(`${base}/api/v1/payments/process-vendor-b2c`, data, {
      withCredentials: true,
    })
    return response.data
  },

  // Vendors e payouts (APIs do projeto raiz: /admin/api/*)
  getVendors: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<{ vendors: Vendor[] }>('/vendors', { params })
    return response.data
  },

  getVendorPayouts: async (params?: { limit?: number }) => {
    const response = await api.get<{ payouts: VendorPayout[] }>('/vendor-payouts', { params })
    return response.data
  },

  distributePayments: async () => {
    const response = await api.post<DistributePaymentsResponse>('/distribute-payments')
    return response.data
  },
}

export interface Vendor {
  id?: number
  vendor_id: string
  name: string
  external_id?: string
  tax_id?: string
  phone?: string
  email?: string
  address?: string
  vendor_share?: number
  data?: string
  created_at?: string
  updated_at?: string
}

export interface VendorPayout {
  id?: number
  payment_id: string
  vendor_id: string
  total_amount: number
  vendor_share_pct: number
  system_commission_pct: number
  system_commission_amount: number
  vendor_amount: number
  status: string
  b2c_transaction_id?: string
  paid_at?: string
  error_message?: string
  created_at?: string
  updated_at?: string
}

export interface DistributePaymentsResponse {
  success: boolean
  message: string
  data?: {
    total: number
    distributed: number
    failed: number
    results: { paymentId: string; success: boolean; error?: string }[]
  }
}

export default api

