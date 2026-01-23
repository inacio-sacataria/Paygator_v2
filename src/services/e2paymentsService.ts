import axios from 'axios';
import { logger } from '../utils/logger';

export interface E2PaymentsConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string; // URL para autenticação (oauth/token)
  apiUrl: string; // URL para transações (c2b/b2c)
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
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: E2PaymentsConfig) {
    this.config = config;
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
        authUrl: this.config.authUrl,
        apiUrl: this.config.apiUrl,
        clientId: this.config.clientId ? 'definido' : 'faltando',
      });

      // Verificar se as credenciais estão presentes
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('CLIENT_ID ou CLIENT_SECRET não configurados');
      }

      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', this.config.clientId.trim()); // Remover espaços
      formData.append('client_secret', this.config.clientSecret.trim()); // Remover espaços

      // Log detalhado (sem expor credenciais completas)
      logger.info('E2Payments - Enviando requisição de autenticação', {
        url: `${this.config.authUrl}/oauth/token`,
        hasClientId: !!this.config.clientId,
        hasClientSecret: !!this.config.clientSecret,
        clientIdLength: this.config.clientId?.length || 0,
        clientSecretLength: this.config.clientSecret?.length || 0,
        clientIdPrefix: this.config.clientId?.substring(0, 8) || 'vazio',
        clientSecretPrefix: this.config.clientSecret?.substring(0, 8) || 'vazio',
        formDataKeys: ['grant_type', 'client_id', 'client_secret'],
      });

      // Usar authUrl para autenticação (não usar axiosInstance que tem baseURL diferente)
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

      logger.info('E2Payments - Resposta da autenticação', {
        status: response.status,
        hasToken: !!token,
        responseKeys: Object.keys(body || {}),
      });

      if (!token) {
        logger.error('E2Payments - Token não obtido', {
          response: body,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Token de acesso não foi retornado pela API. Resposta: ${JSON.stringify(body)}`);
      }

      // Armazenar token e calcular expiração
      // expires_in está em segundos, converter para milissegundos
      const expiresIn = body.expires_in || 3600; // Default 1 hora se não especificado
      this.accessToken = token;
      // Usar expires_in da resposta, com margem de 5 minutos
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
      
      logger.info('E2Payments - Token armazenado', {
        expiresIn: expiresIn,
        expiresInHours: (expiresIn / 3600).toFixed(2),
        tokenExpiry: this.tokenExpiry.toISOString(),
      });

      logger.info('E2Payments - Token obtido com sucesso', {
        hasToken: !!token,
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
      
      logger.error('E2Payments - Erro ao obter token', errorDetails);
      
      // Log do que foi enviado (sem expor credenciais completas)
      if (error.config?.data) {
        const formDataStr = error.config.data;
        logger.error('E2Payments - Dados enviados na requisição', {
          hasGrantType: formDataStr.includes('grant_type'),
          hasClientId: formDataStr.includes('client_id'),
          hasClientSecret: formDataStr.includes('client_secret'),
          dataLength: formDataStr.length,
        });
      }
      
      // Mensagem de erro mais detalhada
      let errorMessage = `Erro ao autenticar com E2Payments: ${error.message}`;
      if (error.response?.data) {
        errorMessage += `. Resposta da API: ${JSON.stringify(error.response.data)}`;
      }
      if (error.response?.status === 401) {
        errorMessage += '\n\n⚠️ ERRO 401 - Client authentication failed';
        errorMessage += '\n\nPossíveis causas:';
        errorMessage += '\n1. CLIENT_ID ou CLIENT_SECRET incorretos no arquivo .env';
        errorMessage += '\n2. Credenciais expiradas ou revogadas pela E2Payments';
        errorMessage += '\n3. Espaços extras nas credenciais (verifique o .env)';
        errorMessage += '\n4. Arquivo .env não está sendo carregado (reinicie o servidor)';
        errorMessage += '\n\nVerifique:';
        errorMessage += '\n- Arquivo .env na raiz do projeto';
        errorMessage += '\n- Variáveis E2PAYMENTS_CLIENT_ID e E2PAYMENTS_CLIENT_SECRET';
        errorMessage += '\n- Reinicie o servidor após alterar o .env';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Processa pagamento Emola
   */
  async processEmolaPayment(request: EmolaPaymentRequest): Promise<EmolaPaymentResponse> {
    try {
      // Validar configurações
      if (!this.config.apiUrl || !this.config.clientId || !this.config.clientSecret || !this.config.emolaWallet) {
        const missingConfig = [];
        if (!this.config.apiUrl) missingConfig.push('E2PAYMENTS_API_URL');
        if (!this.config.clientId) missingConfig.push('E2PAYMENTS_CLIENT_ID');
        if (!this.config.clientSecret) missingConfig.push('E2PAYMENTS_CLIENT_SECRET');
        if (!this.config.emolaWallet) missingConfig.push('E2PAYMENTS_EMOLA_WALLET');
        
        logger.error('E2Payments - Configurações faltando', {
          apiUrl: this.config.apiUrl ? 'definido' : 'faltando',
          clientId: this.config.clientId ? 'definido' : 'faltando',
          clientSecret: this.config.clientSecret ? 'definido' : 'faltando',
          emolaWallet: this.config.emolaWallet ? 'definido' : 'faltando',
          missing: missingConfig,
        });
        return {
          success: false,
          message: `Configurações do E2Payments incompletas. Variáveis faltando: ${missingConfig.join(', ')}. Configure no arquivo .env`,
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

      const url = `${this.config.apiUrl}/v1/c2b/emola-payment/${this.config.emolaWallet}/`;
      const body = new URLSearchParams(payload as any).toString();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      };

      logger.info('E2Payments - Enviando requisição de pagamento', {
        url,
        method: 'POST',
        payload,
        bodyString: body,
        headers: {
          ...headers,
          Authorization: `Bearer ${token.substring(0, 20)}...`, // Log parcial do token
        },
        walletId: this.config.emolaWallet,
        phone: request.phone,
        amount: request.amount,
        reference: request.reference,
      });

      // Fazer requisição de pagamento
      const response = await axios.post(
        url,
        body,
        {
          headers,
          timeout: 60000, // 60 segundos
        }
      );

      const responseData = response.data;
      const statusCode = response.status;

      logger.info('E2Payments - Resposta do pagamento recebida', {
        statusCode,
        statusText: response.statusText,
        successful: response.status >= 200 && response.status < 300,
        responseHeaders: response.headers,
        responseData,
        responseDataType: typeof responseData,
        responseDataString: JSON.stringify(responseData),
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
      const errorDetails: any = {
        message: error.message,
        errorType: error.constructor?.name,
        code: error.code,
        stack: error.stack,
      };

      // Detalhes da requisição que falhou
      if (error.config) {
        errorDetails.request = {
          url: error.config.url,
          method: error.config.method,
          baseURL: error.config.baseURL,
          fullURL: `${error.config.baseURL || ''}${error.config.url || ''}`,
          headers: error.config.headers,
          data: error.config.data,
          timeout: error.config.timeout,
        };
      }

      // Detalhes da resposta de erro
      if (error.response) {
        errorDetails.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          dataString: JSON.stringify(error.response.data),
        };
      }

      // Detalhes se não houver resposta (erro de rede, timeout, etc)
      if (!error.response) {
        errorDetails.noResponse = true;
        if (error.code === 'ECONNABORTED') {
          errorDetails.timeout = true;
          errorDetails.message = 'Timeout na requisição (60 segundos)';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          errorDetails.connectionError = true;
          errorDetails.message = `Erro de conexão: ${error.message}`;
        }
      }

      logger.error('E2Payments - Erro no processamento', errorDetails);

      // Extrair mensagem de erro mais detalhada
      let errorMessage = error.message || 'Erro ao processar pagamento Emola';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Tentar extrair mensagem de erro da resposta
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = `Erro ${error.response.status}: ${JSON.stringify(errorData)}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        data: error.response?.data,
      };
    }
  }

  /**
   * Processa pagamento Emola B2C (Business to Customer)
   * B2C é usado para enviar dinheiro da empresa para o cliente
   */
  async processEmolaB2CPayment(request: EmolaPaymentRequest): Promise<EmolaPaymentResponse> {
    try {
      // Validar configurações
      if (!this.config.apiUrl || !this.config.clientId || !this.config.clientSecret || !this.config.emolaWallet) {
        logger.error('E2Payments B2C - Configurações faltando', {
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

      logger.info('E2Payments B2C - Enviando requisição de pagamento', {
        payload,
        endpoint: `${this.config.apiUrl}/v1/b2c/emola-payment/${this.config.emolaWallet}/`,
      });

      // Fazer requisição de pagamento B2C
      const response = await axios.post(
        `${this.config.apiUrl}/v1/b2c/emola-payment/${this.config.emolaWallet}/`,
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
      const statusCode = response.status;

      logger.info('E2Payments B2C - Resposta do pagamento', {
        statusCode,
        successful: response.status >= 200 && response.status < 300,
        responseData,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info('E2Payments B2C - Pagamento processado com sucesso', {
          reference: request.reference,
          amount: request.amount,
        });

        return {
          success: true,
          message: 'Pagamento B2C processado com sucesso',
          data: responseData,
        };
      } else {
        logger.warning('E2Payments B2C - Pagamento falhou', {
          statusCode,
          responseData,
        });

        return {
          success: false,
          message: responseData.message || 'Falha ao processar pagamento B2C',
          data: responseData,
        };
      }
    } catch (error: any) {
      logger.error('E2Payments B2C - Erro no processamento', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao processar pagamento Emola B2C',
        data: error.response?.data,
      };
    }
  }
}

