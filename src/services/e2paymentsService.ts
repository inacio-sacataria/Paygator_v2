import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface E2PaymentsConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  emolaWallet: string;
}

export interface EmolaPaymentRequest {
  phone: string;
  amount: number;
  reference: string;
}

export interface EmolaPaymentResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  data?: any;
}

export class E2PaymentsService {
  private config: E2PaymentsConfig;
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: E2PaymentsConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }

  /**
   * Obtém token de acesso OAuth
   */
  private async getAccessToken(): Promise<string> {
    // Verificar se o token ainda é válido (com margem de 5 minutos)
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      logger.info('E2Payments - Obtendo token de acesso', {
        apiUrl: this.config.apiUrl,
        clientId: this.config.clientId ? 'definido' : 'faltando',
      });

      const formData = new URLSearchParams();
      formData.append('client_id', this.config.clientId);
      formData.append('client_secret', this.config.clientSecret);
      formData.append('grant_type', 'client_credentials');

      const response = await this.axiosInstance.post('/oauth/token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const body = response.data;
      const token = body.access_token;

      if (!token) {
        logger.error('E2Payments - Token não obtido', {
          response: body,
        });
        throw new Error('Token de acesso não foi retornado pela API');
      }

      // Armazenar token e calcular expiração (assumindo 1 hora de validade)
      this.accessToken = token;
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // 55 minutos

      logger.info('E2Payments - Token obtido com sucesso', {
        hasToken: !!token,
      });

      return token;
    } catch (error: any) {
      logger.error('E2Payments - Erro ao obter token', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Erro ao autenticar com E2Payments: ${error.message}`);
    }
  }

  /**
   * Processa pagamento Emola
   */
  async processEmolaPayment(request: EmolaPaymentRequest): Promise<EmolaPaymentResponse> {
    try {
      // Validar configurações
      if (!this.config.apiUrl || !this.config.clientId || !this.config.clientSecret || !this.config.emolaWallet) {
        logger.error('E2Payments - Configurações faltando', {
          apiUrl: this.config.apiUrl ? 'definido' : 'faltando',
          clientId: this.config.clientId ? 'definido' : 'faltando',
          clientSecret: this.config.clientSecret ? 'definido' : 'faltando',
          emolaWallet: this.config.emolaWallet ? 'definido' : 'faltando',
        });
        return {
          success: false,
          message: 'Configurações do E2Payments incompletas',
        };
      }

      // Obter token de acesso
      const token = await this.getAccessToken();

      // Preparar payload
      const payload = {
        client_id: this.config.clientId,
        phone: request.phone,
        amount: request.amount,
        reference: request.reference,
      };

      logger.info('E2Payments - Enviando requisição de pagamento', {
        payload,
        endpoint: `${this.config.apiUrl}/v1/c2b/emola-payment/${this.config.emolaWallet}/`,
      });

      // Fazer requisição de pagamento
      const response = await this.axiosInstance.post(
        `/v1/c2b/emola-payment/${this.config.emolaWallet}/`,
        new URLSearchParams(payload as any).toString(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      const responseData = response.data;
      const statusCode = response.status;

      logger.info('E2Payments - Resposta do pagamento', {
        statusCode,
        successful: response.status >= 200 && response.status < 300,
        responseData,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info('E2Payments - Pagamento processado com sucesso', {
          reference: request.reference,
          amount: request.amount,
        });

        return {
          success: true,
          message: 'Pagamento processado com sucesso',
          data: responseData,
        };
      } else {
        logger.warning('E2Payments - Pagamento falhou', {
          statusCode,
          responseData,
        });

        return {
          success: false,
          message: responseData.message || 'Falha ao processar pagamento',
          data: responseData,
        };
      }
    } catch (error: any) {
      logger.error('E2Payments - Erro no processamento', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao processar pagamento Emola',
        data: error.response?.data,
      };
    }
  }
}

