import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface TheCodeConfig {
  clientId: string;
  clientSecret: string;
  mpesaWallet: string;
}

export interface MpesaPaymentRequest {
  phone: string;
  amount: number;
  reference: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  data?: any;
}

/**
 * Serviço para integração com TheCode M-Pesa
 * Baseado no SDK PHP: Explicador\E2PaymentsPhpSdk\Mpesa
 */
export class TheCodeService {
  private config: TheCodeConfig;
  private axiosInstance: AxiosInstance;
  private baseUrl = 'https://e2payments.explicador.co.mz'; // URL base da API

  constructor(config: TheCodeConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obtém token de acesso OAuth
   */
  private async getAccessToken(): Promise<string> {
    try {
      logger.info('TheCode M-Pesa - Obtendo token de acesso', {
        clientId: this.config.clientId ? 'definido' : 'faltando',
      });

      const formData = new URLSearchParams();
      formData.append('client_id', this.config.clientId);
      formData.append('client_secret', this.config.clientSecret);
      formData.append('grant_type', 'client_credentials');

      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      );

      const body = response.data;
      const token = body.access_token;

      if (!token) {
        logger.error('TheCode M-Pesa - Token não obtido', {
          response: body,
        });
        throw new Error('Token de acesso não foi retornado pela API');
      }

      logger.info('TheCode M-Pesa - Token obtido com sucesso', {
        hasToken: !!token,
      });

      return token;
    } catch (error: any) {
      logger.error('TheCode M-Pesa - Erro ao obter token', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Erro ao autenticar com TheCode: ${error.message}`);
    }
  }

  /**
   * Processa pagamento M-Pesa (C2B)
   * Equivalente ao método c2b() do SDK PHP
   */
  async processMpesaPayment(request: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
    try {
      // Validar configurações
      if (!this.config.clientId || !this.config.clientSecret || !this.config.mpesaWallet) {
        logger.error('TheCode M-Pesa - Configurações faltando', {
          clientId: this.config.clientId ? 'definido' : 'faltando',
          clientSecret: this.config.clientSecret ? 'definido' : 'faltando',
          mpesaWallet: this.config.mpesaWallet ? 'definido' : 'faltando',
        });
        return {
          success: false,
          message: 'Configurações do TheCode incompletas',
        };
      }

      // Obter token de acesso
      const token = await this.getAccessToken();

      logger.info('TheCode M-Pesa - Iniciando processamento de pagamento', {
        number: request.phone,
        amount: request.amount,
        reference: request.reference,
        walletId: this.config.mpesaWallet,
      });

      // Fazer requisição C2B
      // Baseado no SDK PHP, o endpoint deve ser similar ao Emola
      // Usar form-urlencoded como no E2Payments
      const payload = {
        client_id: this.config.clientId,
        phone: request.phone,
        amount: request.amount,
        reference: request.reference,
      };

      const response = await axios.post(
        `${this.baseUrl}/v1/c2b/mpesa-payment/${this.config.mpesaWallet}/`,
        new URLSearchParams(payload as any).toString(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: 30000,
        }
      );

      const responseData = response.data;

      logger.info('TheCode M-Pesa - Resposta do pagamento', {
        statusCode: response.status,
        hasResponse: !!responseData,
        hasSuccess: !!responseData?.success,
        success: responseData?.success,
        responseData,
      });

      // Verificar se a resposta indica sucesso
      // O formato pode variar, então verificamos diferentes possibilidades
      const isSuccess = 
        (responseData?.response?.success === true) ||
        (responseData?.success === true) ||
        (response.status >= 200 && response.status < 300 && !responseData?.error);

      if (isSuccess) {
        logger.info('TheCode M-Pesa - Pagamento processado com sucesso', {
          reference: request.reference,
          amount: request.amount,
        });

        return {
          success: true,
          message: 'Pagamento processado com sucesso',
          transactionId: responseData?.transactionId || responseData?.response?.transactionId,
          data: responseData,
        };
      } else {
        logger.warn('TheCode M-Pesa - Pagamento falhou', {
          responseData,
        });

        // Extrair mensagem de erro mais detalhada da resposta
        let errorMessage = 'Falha ao processar pagamento';
        
        if (responseData?.mpesa_server_response) {
          const mpesaResponse = responseData.mpesa_server_response;
          errorMessage = mpesaResponse.output_ResponseDesc || errorMessage;
          
          // Log detalhado do erro da API M-Pesa
          logger.error('TheCode M-Pesa - Detalhes do erro da API', {
            responseCode: mpesaResponse.output_ResponseCode,
            responseDesc: mpesaResponse.output_ResponseDesc,
            thirdPartyReference: mpesaResponse.output_ThirdPartyReference,
            conversationId: mpesaResponse.output_ConversationID,
          });
        } else if (responseData?.response?.output_ResponseDesc) {
          errorMessage = responseData.response.output_ResponseDesc;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.response?.message) {
          errorMessage = responseData.response.message;
        }

        return {
          success: false,
          message: errorMessage,
          data: responseData,
        };
      }
    } catch (error: any) {
      logger.error('TheCode M-Pesa - Erro no processamento', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // Extrair mensagem de erro mais detalhada
      let errorMessage = error.message || 'Erro ao processar pagamento M-Pesa';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Verificar se há resposta do servidor M-Pesa
        if (errorData.mpesa_server_response) {
          const mpesaResponse = errorData.mpesa_server_response;
          errorMessage = mpesaResponse.output_ResponseDesc || errorMessage;
          
          logger.error('TheCode M-Pesa - Erro da API M-Pesa', {
            responseCode: mpesaResponse.output_ResponseCode,
            responseDesc: mpesaResponse.output_ResponseDesc,
            thirdPartyReference: mpesaResponse.output_ThirdPartyReference,
            conversationId: mpesaResponse.output_ConversationID,
          });
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
        data: error.response?.data,
      };
    }
  }
}

