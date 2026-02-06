import axios from 'axios'

// Usar URL completa para garantir que vá para o backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Aviso se a variável não estiver configurada em produção
if (!import.meta.env.VITE_API_URL && import.meta.env.MODE === 'production') {
  console.error('[API] ⚠️ VITE_API_URL não está configurada! Configure no Vercel: Settings → Environment Variables');
  console.error('[API] Usando fallback:', API_BASE_URL);
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/admin/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
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
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await axios.post(`${API_BASE_URL}/api/v1/payments/process-vendor-b2c`, data, {
      withCredentials: true,
    })
    return response.data
  },
}

export default api

