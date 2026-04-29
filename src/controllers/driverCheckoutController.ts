import { Response } from 'express';
import { dataService } from '../services/dataService';
import { AuthenticatedRequest } from '../middleware/logging';
import { logger } from '../utils/logger';
import { OndeDriverService } from '../services/ondeDriverService';
import { TheCodeService } from '../services/thecodeService';
import { E2PaymentsService } from '../services/e2paymentsService';
import { config } from '../config/environment';

type CheckoutProvider = 'mpesa' | 'emola';

export class DriverCheckoutController {
  private ondeService: OndeDriverService;
  private mpesaService: TheCodeService;
  private emolaService: E2PaymentsService;

  constructor() {
    this.ondeService = new OndeDriverService();
    this.mpesaService = new TheCodeService({
      clientId: config.thecode.clientId,
      clientSecret: config.thecode.clientSecret,
      authUrl: config.thecode.authUrl,
      apiUrl: config.thecode.apiUrl,
      mpesaWallet: config.thecode.mpesaWallet,
    });
    this.emolaService = new E2PaymentsService({
      clientId: config.e2payments.clientId,
      clientSecret: config.e2payments.clientSecret,
      authUrl: config.e2payments.authUrl,
      apiUrl: config.e2payments.apiUrl,
      emolaWallet: config.e2payments.emolaWallet,
    });
  }

  public createTopUpCheckout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { phone, amount, provider } = req.body as { phone: string; amount: number; provider: CheckoutProvider };

      const normalized = this.normalizeAndValidatePhone(phone);
      if (!normalized.valid || !normalized.normalized) {
        res.status(400).json({
          success: false,
          message: normalized.reason || 'Numero de telefone invalido.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      if (!this.ondeService.isConfigured()) {
        res.status(500).json({
          success: false,
          message: 'ONDE nao configurado. Defina ONDE_BASE_URL, ONDE_COMPANY_ID e ONDE_TOKEN.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const localPhone = normalized.local || '';
      if (!this.isProviderCompatible(provider, localPhone)) {
        const message = provider === 'mpesa'
          ? 'Para M-Pesa use numeros iniciados por 84 ou 85.'
          : 'Para e-Mola use numeros iniciados por 86 ou 87.';
        res.status(400).json({
          success: false,
          message,
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const matchedDriver = await this.ondeService.findDriverByPhone(normalized.normalized);
      if (!matchedDriver) {
        res.status(404).json({
          success: false,
          message: 'Driver nao encontrado para este telefone.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const currency = 'MZN';
      const invoiceId = await this.ondeService.requestTopUpInvoice(matchedDriver.driverId, amount, currency);
      const paymentId = `drv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const metadataObject = {
        type: 'driver_topup_checkout',
        phone: normalized.normalized,
        localPhone,
        provider,
        amount,
        currency,
        onde: {
          driverId: matchedDriver.driverId,
          driverName: matchedDriver.fullName || '',
          invoiceId,
          commitStatus: 'pending',
        },
      };

      await dataService.createPayment({
        payment_id: paymentId,
        provider,
        amount,
        currency,
        status: 'pending',
        customer_id: normalized.normalized,
        vendor_id: matchedDriver.driverId,
        metadata: JSON.stringify(metadataObject),
      });

      const paymentResult = provider === 'mpesa'
        ? await this.mpesaService.processMpesaPayment({ phone: localPhone, amount, reference: paymentId.slice(0, 15) })
        : await this.emolaService.processEmolaPayment({ phone: localPhone, amount, reference: paymentId.slice(0, 27) });

      if (!paymentResult.success) {
        await dataService.updatePayment(paymentId, {
          status: 'failed',
          metadata: JSON.stringify({
            ...metadataObject,
            error: paymentResult.message || 'Falha no provedor de pagamento',
            providerResponse: paymentResult.data,
          }),
        });

        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Falha ao processar pagamento.',
          data: {
            paymentId,
            status: 'failed',
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      let commitStatus: 'completed' | 'failed' = 'completed';
      let commitError: string | undefined;
      try {
        await this.ondeService.commitInvoice(matchedDriver.driverId, invoiceId);
      } catch (error) {
        commitStatus = 'failed';
        commitError = error instanceof Error ? error.message : 'Erro desconhecido no commit ONDE';
      }

      const finalStatus = commitStatus === 'completed' ? 'completed' : 'processing';
      await dataService.updatePayment(paymentId, {
        status: finalStatus,
        metadata: JSON.stringify({
          ...metadataObject,
          transactionId: paymentResult.transactionId || '',
          providerResponse: paymentResult.data,
          onde: {
            ...metadataObject.onde,
            commitStatus,
            commitError: commitError || null,
            committedAt: commitStatus === 'completed' ? new Date().toISOString() : null,
          },
        }),
      });

      res.status(200).json({
        success: true,
        message: commitStatus === 'completed' ? 'Checkout concluido e saldo creditado.' : 'Pagamento concluido, commit pendente.',
        data: {
          paymentId,
          invoiceId,
          driverId: matchedDriver.driverId,
          status: finalStatus,
          commitStatus,
          commitError,
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown',
      });
    } catch (error) {
      logger.error('Driver checkout error', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        message: 'Erro ao processar checkout do driver.',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown',
      });
    }
  };

  public getCheckoutStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentId = req.params['paymentId'];
      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'paymentId e obrigatorio.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const payment = await dataService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Checkout nao encontrado.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const metadata = this.safeParse(payment.metadata);
      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.payment_id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          phone: metadata.phone || null,
          driverId: metadata.onde?.driverId || null,
          invoiceId: metadata.onde?.invoiceId || null,
          commitStatus: metadata.onde?.commitStatus || null,
          commitError: metadata.onde?.commitError || null,
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar status do checkout.',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown',
      });
    }
  };

  public retryCommit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentId = req.params['paymentId'];
      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'paymentId e obrigatorio.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const payment = await dataService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Checkout nao encontrado.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

      const metadata = this.safeParse(payment.metadata);
      const driverId = metadata.onde?.driverId;
      const invoiceId = metadata.onde?.invoiceId;
      if (!driverId || !invoiceId) {
        res.status(400).json({
          success: false,
          message: 'Este pagamento nao possui dados de commit ONDE.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown',
        });
        return;
      }

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

      res.status(200).json({
        success: true,
        message: 'Commit executado com sucesso.',
        data: { paymentId, driverId, invoiceId, commitStatus: 'completed' },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Falha ao executar commit.',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown',
      });
    }
  };

  private safeParse(metadata?: string): any {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  private normalizeAndValidatePhone(input: string): { valid: boolean; normalized?: string; local?: string; reason?: string } {
    const raw = String(input || '').replace(/[^\d+]/g, '');
    let local = raw;
    if (local.startsWith('+258')) local = local.slice(4);
    if (local.startsWith('258')) local = local.slice(3);

    if (!/^(84|85|86|87)\d{7}$/.test(local)) {
      return { valid: false, reason: 'Numero invalido. Use 84, 85, 86 ou 87 com 9 digitos.' };
    }
    return { valid: true, local, normalized: `+258${local}` };
  }

  private isProviderCompatible(provider: CheckoutProvider, localPhone: string): boolean {
    if (provider === 'mpesa') {
      return /^(84|85)\d{7}$/.test(localPhone);
    }
    return /^(86|87)\d{7}$/.test(localPhone);
  }
}
