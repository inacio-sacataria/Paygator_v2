import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface TheCodeConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string; // URL para autenticação (oauth/token)
  apiUrl: string; // URL para transações (c2b)
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

  constructor(config: TheCodeConfig) {
    this.config = config;
    // axiosInstance usa apiUrl para transações (c2b)
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: 60000, // 60 segundos
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
        authUrl: this.config.authUrl,
        apiUrl: this.config.apiUrl,
        clientId: this.config.clientId ? 'definido' : 'faltando',
      });

      // Verificar se as credenciais estão presentes
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('THECODE_CLIENT_ID ou THECODE_CLIENT_SECRET não configurados');
      }

      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', this.config.clientId.trim()); // Remover espaços
      formData.append('client_secret', this.config.clientSecret.trim()); // Remover espaços

      // Log detalhado (sem expor credenciais completas)
      logger.info('TheCode M-Pesa - Enviando requisição de autenticação', {
        url: `${this.config.authUrl}/oauth/token`,
        hasClientId: !!this.config.clientId,
        hasClientSecret: !!this.config.clientSecret,
        clientIdLength: this.config.clientId?.length || 0,
        clientSecretLength: this.config.clientSecret?.length || 0,
        clientIdPrefix: this.config.clientId?.substring(0, 8) || 'vazio',
        clientSecretPrefix: this.config.clientSecret?.substring(0, 8) || 'vazio',
        formDataKeys: ['grant_type', 'client_id', 'client_secret'],
      });

      // Usar authUrl para autenticação
      const response = await axios.post(
        `${this.config.authUrl}/oauth/token`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest', // Conforme exemplo do Postman
          },
          timeout: 60000, // 60 segundos
        }
      );

      const body = response.data;
      const token = body.access_token;

      logger.info('TheCode M-Pesa - Resposta da autenticação', {
        status: response.status,
        statusText: response.statusText,
        responseBody: body,
      });

      if (!token) {
        logger.error('TheCode M-Pesa - Token não obtido', {
          response: body,
        });
        throw new Error(`Token de acesso não foi retornado pela API. Resposta: ${JSON.stringify(body)}`);
      }

      logger.info('TheCode M-Pesa - Token obtido com sucesso', {
        hasToken: !!token,
        tokenExpiry: body.expires_in ? `${body.expires_in} segundos` : 'N/A',
        expiresInSeconds: body.expires_in,
      });

      return token;
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
      };

      logger.error('TheCode M-Pesa - Erro ao obter token', errorDetails);

      let errorMessage = `Erro ao autenticar com TheCode: ${error.message}`;
      if (error.response?.data) {
        errorMessage += `. Resposta da API: ${JSON.stringify(error.response.data)}`;
      }
      if (error.response?.status === 401) {
        errorMessage += '. Verifique se as credenciais (THECODE_CLIENT_ID e THECODE_CLIENT_SECRET) estão corretas.';
      }

      throw new Error(errorMessage);
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
        `${this.config.apiUrl}/v1/c2b/mpesa-payment/${this.config.mpesaWallet}/`,
        new URLSearchParams(payload as any).toString(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: 60000, // 60 segundos
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

