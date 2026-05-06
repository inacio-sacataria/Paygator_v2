import { dataService } from './dataService';
import { logger } from '../utils/logger';
import { OndeDriverService } from './ondeDriverService';
import type { Payment } from './dataService';

export class DriverCheckoutCommitService {
  private ondeService: OndeDriverService;

  constructor() {
    this.ondeService = new OndeDriverService();
  }

  public async processPaymentCommit(paymentId: string): Promise<{ success: boolean; paymentId: string; status: string; error?: string }> {
    const payment = await dataService.getPaymentById(paymentId);
    if (!payment) {
      return { success: false, paymentId, status: 'not_found', error: 'Pagamento nao encontrado.' };
    }

    return this.processPayment(payment);
  }

  public async processPendingCommits(limit = 50): Promise<{
    total: number;
    processed: number;
    completed: number;
    failed: number;
    skipped: number;
    results: Array<{ paymentId: string; success: boolean; status: string; error?: string }>;
  }> {
    const payments = await dataService.getPaymentsByStatuses(['paid', 'commit_failed'], limit);
    const candidates = payments.filter((payment) => {
      const metadata = this.safeParse(payment.metadata);
      return metadata?.type === 'driver_topup_checkout';
    });

    const results: Array<{ paymentId: string; success: boolean; status: string; error?: string }> = [];
    let completed = 0;
    let failed = 0;
    let skipped = 0;

    for (const payment of candidates) {
      const result = await this.processPayment(payment);
      results.push(result);
      if (result.status === 'completed') completed += 1;
      else if (result.status === 'skipped') skipped += 1;
      else failed += 1;
    }

    return {
      total: payments.length,
      processed: candidates.length,
      completed,
      failed,
      skipped,
      results,
    };
  }

  private async processPayment(payment: Payment): Promise<{ success: boolean; paymentId: string; status: string; error?: string }> {
    const paymentId = payment.payment_id;
    const metadata = this.safeParse(payment.metadata);
    const driverId = metadata?.onde?.driverId;
    const invoiceId = metadata?.onde?.invoiceId;
    const commitStatus = metadata?.onde?.commitStatus;

    if (!driverId || !invoiceId) {
      return { success: false, paymentId, status: 'skipped', error: 'Metadata ONDE incompleto.' };
    }

    if (payment.status === 'completed' || commitStatus === 'completed') {
      return { success: true, paymentId, status: 'skipped' };
    }

    await dataService.updatePayment(paymentId, {
      status: 'committing',
      metadata: JSON.stringify({
        ...metadata,
        onde: {
          ...metadata.onde,
          commitStatus: 'processing',
          commitError: null,
        },
      }),
    });

    try {
      await this.ondeService.commitInvoice(driverId, invoiceId);
      await dataService.updatePayment(paymentId, {
        status: 'completed',
        metadata: JSON.stringify({
          ...metadata,
          onde: {
            ...metadata.onde,
            commitStatus: 'completed',
            commitError: null,
            committedAt: new Date().toISOString(),
          },
        }),
      });
      return { success: true, paymentId, status: 'completed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no commit ONDE';
      await dataService.updatePayment(paymentId, {
        status: 'commit_failed',
        metadata: JSON.stringify({
          ...metadata,
          onde: {
            ...metadata.onde,
            commitStatus: 'failed',
            commitError: message,
            committedAt: null,
          },
        }),
      });
      logger.error('Pending ONDE commit failed', { paymentId, driverId, invoiceId, error: message });
      return { success: false, paymentId, status: 'commit_failed', error: message };
    }
  }

  private safeParse(metadata?: string): any {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
}

export const driverCheckoutCommitService = new DriverCheckoutCommitService();
