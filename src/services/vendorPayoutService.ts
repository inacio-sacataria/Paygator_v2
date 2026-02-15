import { logger } from '../utils/logger';
import { dataService, type VendorPayout } from './dataService';
import { loggingService } from './loggingService';
import { E2PaymentsService } from './e2paymentsService';
import { config } from '../config/environment';

export interface ProcessOneVendorB2COptions {
  commissionPercentage?: number;
  vendorPhone?: string;
  correlationId?: string;
}

export interface ProcessOneVendorB2CResult {
  success: boolean;
  paymentId: string;
  payout?: VendorPayout;
  data?: {
    transactionId?: string;
    totalAmount: number;
    vendorAmount: number;
    systemCommission: number;
    systemCommissionAmount: number;
    vendorShare: number;
  };
  error?: string;
}

class VendorPayoutServiceClass {
  private e2paymentsService: E2PaymentsService;

  constructor() {
    this.e2paymentsService = new E2PaymentsService({
      clientId: config.e2payments.clientId,
      clientSecret: config.e2payments.clientSecret,
      authUrl: config.e2payments.authUrl,
      apiUrl: config.e2payments.apiUrl,
      emolaWallet: config.e2payments.emolaWallet,
    });
  }

  async processOneVendorB2C(
    paymentId: string,
    options: ProcessOneVendorB2COptions = {}
  ): Promise<ProcessOneVendorB2CResult> {
    const { commissionPercentage, vendorPhone: overrideVendorPhone, correlationId = 'admin' } = options;

    const originalPayment = await dataService.getPaymentById(paymentId);
    if (!originalPayment) {
      return { success: false, paymentId, error: 'Pagamento não encontrado' };
    }

    if (originalPayment.status !== 'completed' && originalPayment.status !== 'approved') {
      return { success: false, paymentId, error: 'O pagamento C2B deve estar completado antes de processar o pagamento ao vendor' };
    }

    let metadata: Record<string, unknown>;
    try {
      metadata = JSON.parse(originalPayment.metadata || '{}');
    } catch {
      metadata = {};
    }
    if (metadata['vendorB2CPayment'] && (metadata['vendorB2CPayment'] as { status?: string })['status'] === 'completed') {
      return { success: false, paymentId, error: 'Vendor já foi pago para este pagamento' };
    }

    const orderDetails = (metadata['orderDetails'] as Record<string, unknown>) || {};
    const internalData = (orderDetails['internal'] as Record<string, unknown>) || {};
    const vendorMerchant = (internalData['vendorMerchant'] as Record<string, unknown>) || {};
    const vendorShare = (internalData['vendorShare'] as number) ?? 100;

    let systemCommission: number;
    if (commissionPercentage !== undefined && commissionPercentage !== null && String(commissionPercentage).trim() !== '') {
      const parsed = typeof commissionPercentage === 'number' ? commissionPercentage : parseFloat(String(commissionPercentage));
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        return { success: false, paymentId, error: 'Comissão deve estar entre 0 e 100' };
      }
      systemCommission = parsed;
    } else {
      systemCommission = 100 - vendorShare;
    }

    const totalAmount = originalPayment.amount;
    const vendorAmount = totalAmount * (vendorShare / 100);
    const systemCommissionAmount = totalAmount * (systemCommission / 100);

    const vendorPhone = overrideVendorPhone || (vendorMerchant['phone'] as string);
    if (!vendorPhone) {
      return { success: false, paymentId, error: 'Telefone do vendor não encontrado. Forneça vendorPhone ou configure no vendorMerchant' };
    }

    const phoneNumber = vendorPhone.replace(/^\+258/, '');
    if (!phoneNumber.match(/^(86|87)[0-9]{7}$/)) {
      return { success: false, paymentId, error: 'Formato de telefone inválido para Emola. Use número começando com 86 ou 87 (ex: +258861234567)' };
    }

    const vendorId = originalPayment.vendor_id || (orderDetails['public'] as Record<string, unknown>)?.['vendorId'] as string || 'unknown';

    // Criar registo de payout (processing)
    const payoutId = await dataService.createVendorPayout({
      payment_id: paymentId,
      vendor_id: vendorId,
      total_amount: totalAmount,
      vendor_share_pct: vendorShare,
      system_commission_pct: systemCommission,
      system_commission_amount: systemCommissionAmount,
      vendor_amount: vendorAmount,
      status: 'processing',
    });

    metadata['vendorB2CPayment'] = {
      status: 'processing',
      initiatedAt: new Date().toISOString(),
      totalAmount,
      vendorAmount,
      systemCommission,
      systemCommissionAmount,
      vendorShare,
      vendorPhone,
    };
    await dataService.updatePayment(paymentId, { metadata: JSON.stringify(metadata) });

    await loggingService.logPayment({
      paymentId,
      action: 'status_changed',
      previousStatus: originalPayment.status,
      newStatus: originalPayment.status,
      amount: totalAmount,
      correlationId,
      metadata: { provider: 'emola', type: 'vendor_b2c', status: 'processing', vendorAmount, systemCommissionAmount, vendorPhone },
    });

    const reference = `VENDOR_${paymentId.substring(0, 20)}_${Date.now()}`.substring(0, 27);

    try {
      const paymentResult = await this.e2paymentsService.processEmolaB2CPayment({
        phone: phoneNumber,
        amount: vendorAmount,
        reference,
      });

      if (paymentResult.success) {
        const vbp = metadata['vendorB2CPayment'] as Record<string, unknown> || {};
        metadata['vendorB2CPayment'] = {
          ...vbp,
          transactionId: paymentResult.transactionId || `vendor_b2c_${Date.now()}`,
          status: 'completed',
          completedAt: new Date().toISOString(),
          reference,
          responseData: paymentResult.data,
        };
        await dataService.updatePayment(paymentId, { metadata: JSON.stringify(metadata) });

        const paidAt = new Date().toISOString();
        const payoutUpdate: Partial<VendorPayout> = { status: 'completed', paid_at: paidAt };
        if (paymentResult.transactionId) payoutUpdate.b2c_transaction_id = paymentResult.transactionId;
        await dataService.updateVendorPayout(payoutId, payoutUpdate);

        await loggingService.logPayment({
          paymentId,
          action: 'status_changed',
          previousStatus: originalPayment.status,
          newStatus: originalPayment.status,
          amount: totalAmount,
          correlationId,
          metadata: { provider: 'emola', type: 'vendor_b2c', status: 'completed', transactionId: paymentResult.transactionId, vendorAmount, systemCommissionAmount },
        });

        const payout: VendorPayout = {
          id: payoutId,
          payment_id: paymentId,
          vendor_id: vendorId,
          total_amount: totalAmount,
          vendor_share_pct: vendorShare,
          system_commission_pct: systemCommission,
          system_commission_amount: systemCommissionAmount,
          vendor_amount: vendorAmount,
          status: 'completed',
          ...(paymentResult.transactionId ? { b2c_transaction_id: paymentResult.transactionId } : {}),
          paid_at: paidAt,
        };

        const data: ProcessOneVendorB2CResult['data'] = {
          totalAmount,
          vendorAmount,
          systemCommission,
          systemCommissionAmount,
          vendorShare,
        };
        if (paymentResult.transactionId) data.transactionId = paymentResult.transactionId;
        return {
          success: true,
          paymentId,
          payout,
          data,
        };
      }

      // Falha B2C
      const vbpFail = metadata['vendorB2CPayment'] as Record<string, unknown> || {};
      metadata['vendorB2CPayment'] = {
        ...vbpFail,
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: paymentResult.message,
        responseData: paymentResult.data,
      };
      await dataService.updatePayment(paymentId, { metadata: JSON.stringify(metadata) });
      await dataService.updateVendorPayout(payoutId, {
        status: 'failed',
        error_message: paymentResult.message || 'B2C failed',
      });

      await loggingService.logPayment({
        paymentId,
        action: 'failed',
        previousStatus: originalPayment.status,
        newStatus: originalPayment.status,
        amount: totalAmount,
        correlationId,
        metadata: { provider: 'emola', type: 'vendor_b2c', status: 'failed', vendorAmount, error: paymentResult.message },
      });

      return {
        success: false,
        paymentId,
        error: paymentResult.message || 'Falha ao processar pagamento B2C ao vendor',
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await dataService.updateVendorPayout(payoutId, { status: 'failed', error_message: errMsg });
      const vbpErr = metadata['vendorB2CPayment'] as Record<string, unknown> || {};
      metadata['vendorB2CPayment'] = {
        ...vbpErr,
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: errMsg,
      };
      await dataService.updatePayment(paymentId, { metadata: JSON.stringify(metadata) });
      logger.error('Vendor B2C error', { paymentId, error: errMsg });
      return { success: false, paymentId, error: errMsg };
    }
  }
}

export const vendorPayoutService = new VendorPayoutServiceClass();
