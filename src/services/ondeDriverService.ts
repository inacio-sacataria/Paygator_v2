import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface OndeDriverWallet {
  amount: number;
  currency: string;
}

export interface OndeDriver {
  driverId: string;
  phone: string;
  fullName?: string;
  wallet?: OndeDriverWallet[];
}

interface OndeInvoiceResponse {
  invoiceId?: string;
  id?: string;
  invoice?: {
    invoiceId?: string;
    id?: string;
  };
}

export class OndeDriverService {
  private client: AxiosInstance;
  private companyId: string;

  constructor() {
    const baseUrl = process.env['ONDE_BASE_URL'] || 'https://api-sandbox.onde.app/v1';
    const token = process.env['ONDE_TOKEN'] || '';
    this.companyId = process.env['ONDE_COMPANY_ID'] || '';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  public isConfigured(): boolean {
    return Boolean(process.env['ONDE_TOKEN'] && this.companyId);
  }

  public async findDriverByPhone(phone: string): Promise<OndeDriver | null> {
    const normalizedPhone = this.normalizePhone(phone);
    const drivers = await this.getDrivers();
    const matches = drivers.filter((driver) => this.normalizePhone(driver.phone) === normalizedPhone);

    if (matches.length === 1) {
      return matches[0] || null;
    }

    if (matches.length > 1) {
      throw new Error('Existe mais de um driver com este telefone no ONDE.');
    }

    return null;
  }

  public async requestTopUpInvoice(driverId: string, amount: number, currency: string): Promise<string> {
    const response = await this.client.post<OndeInvoiceResponse>(
      `/company/${this.companyId}/driver/${driverId}/topUp`,
      {
        money: {
          amount,
          currency,
          formattedName: `${amount} ${currency}`,
        },
        comment: `Driver self top-up ${driverId}`,
      }
    );

    const invoiceId = response.data.invoiceId || response.data.id || response.data.invoice?.invoiceId || response.data.invoice?.id;
    if (!invoiceId) {
      logger.error('ONDE topUp response without invoice id', { data: response.data, driverId, amount, currency });
      throw new Error('Nao foi possivel obter invoiceId da resposta ONDE.');
    }

    return invoiceId;
  }

  public async commitInvoice(driverId: string, invoiceId: string): Promise<void> {
    await this.client.post(`/company/${this.companyId}/driver/${driverId}/commit`, { invoiceId });
  }

  private async getDrivers(): Promise<OndeDriver[]> {
    const response = await this.client.get<OndeDriver[]>(`/company/${this.companyId}/driver`);
    return Array.isArray(response.data) ? response.data : [];
  }

  private normalizePhone(phone: string): string {
    const raw = String(phone || '').replace(/[^\d+]/g, '');
    if (raw.startsWith('+258')) return raw;
    if (raw.startsWith('258')) return `+${raw}`;
    if (/^\d{9}$/.test(raw)) return `+258${raw}`;
    return raw;
  }
}
