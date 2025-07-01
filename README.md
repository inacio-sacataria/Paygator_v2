# Paygator API - Playfood Payment Provider Clone

Uma API REST completa que replica exatamente a API Playfood Payment Provider, construída com Node.js, Express, TypeScript e MongoDB. Esta API implementa todos os 7 endpoints obrigatórios conforme as especificações do PlayFood.

## 🚀 Características

- **Node.js + Express + TypeScript**: Stack moderna e tipada
- **MongoDB + Mongoose**: Banco de dados NoSQL escalável
- **Autenticação**: API Key authentication
- **Validação**: Joi para validação de dados com mensagens detalhadas
- **Documentação**: Swagger/OpenAPI completa
- **Logging**: Logging estruturado com Winston
- **Segurança**: HMAC-SHA256, rate limiting, IP validation
- **Webhooks**: Sistema completo de webhooks com retry e dead letter queue
- **Docker**: Containerização completa
- **Health Checks**: Monitoramento de saúde da aplicação
- **API Playfood Clone**: Implementação completa dos 7 endpoints obrigatórios

## 📋 Pré-requisitos

- Node.js 18+
- MongoDB Atlas (ou MongoDB local)
- Docker (opcional)

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd Paygator
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/paygator?retryWrites=true&w=majority

# Security
API_KEY=your-secret-api-key
WEBHOOK_SECRET=your-webhook-secret

# Logging
LOG_LEVEL=info
```

4. **Execute a aplicação**
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🎯 API Playfood Payment Provider

Esta API implementa exatamente os 7 endpoints obrigatórios da API Playfood Payment Provider:

### Endpoints Implementados

1. **POST /payments/create** - Criar pagamento
2. **POST /payments/info** - Obter informações do pagamento
3. **POST /payments/capture** - Capturar pagamento
4. **POST /payments/refund** - Reembolsar pagamento
5. **POST /merchants/register** - Registrar merchant
6. **POST /transfers/create** - Criar transferência
7. **POST /service/payments/webhook/v2/{paymentSettingsId}** - Processar webhook

### Base URL
```
http://localhost:3000/api/v1
```

### Exemplo Rápido

**Criar um pagamento:**
```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: test-123" \
  -d '{
    "paymentId": "pay_123456789",
    "amount": 51.75,
    "currency": "USD",
    "customer": {
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567",
      "name": "John Doe",
      "billingAddress": {
        "countryCode": "US",
        "stateCode": "CA",
        "city": "Los Angeles",
        "postcode": "90001",
        "street1": "123 Main Street",
        "street2": "Apt 4B"
      },
      "external": {
        "id": "cust_ext_12345",
        "data": null
      }
    },
    "locale": "en-US",
    "returnUrl": "https://example.com/payment/success",
    "orderDetails": {
      "orderId": "order_123456789",
      "public": {
        "vendorId": "vendor_001",
        "vendorName": "Pizza Palace",
        "cartTotal": 45.00,
        "deliveryTotal": 5.00,
        "taxTotal": 4.50,
        "serviceFeeTotal": 2.25,
        "discountTotal": 5.00
      },
      "internal": {
        "vendorMerchant": {
          "id": "merch_001",
          "businessType": "INDIVIDUAL",
          "taxId": "12-3456789",
          "name": "Pizza Palace",
          "address": {
            "addressLine": "456 Business Ave",
            "city": "San Francisco",
            "countryCode": "US",
            "zip": "94102"
          },
          "phone": "+1-555-987-6543",
          "email": "contact@pizzapalace.com",
          "active": true,
          "data": {
            "companyData": null,
            "merchantData": null
          }
        },
        "vendorShare": 85.5
      }
    }
  }'
```

**Resposta:**
```json
{
  "externalPayment": {
    "id": "ext_pay_abc123def456",
    "data": {
      "gateway": "playfood",
      "status": "pending",
      "createdAt": "2023-12-01T10:30:00.000Z",
      "expiresAt": "2023-12-01T11:00:00.000Z"
    }
  },
  "responseType": "IFRAME",
  "link": "https://playfood-payment-gateway.com/pay/ext_pay_abc123def456"
}
```

### Documentação Completa

Para documentação detalhada com todos os exemplos, veja:
- [PLAYFOOD_API_EXAMPLES.md](./PLAYFOOD_API_EXAMPLES.md) - Exemplos completos de uso
- [http://localhost:3000/api-docs](http://localhost:3000/api-docs) - Documentação Swagger interativa

## 📚 Documentação da API

### Formato Padronizado de Resposta

Todos os endpoints da API retornam respostas no seguinte formato padronizado:

#### Sucesso (2xx)
```json
{
  "success": true,
  "data": {
    // Dados específicos do endpoint
  },
  "message": "Operação realizada com sucesso",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "req_123"
}
```

#### Erro (4xx/5xx)
```json
{
  "success": false,
  "data": null,
  "message": "Descrição do erro",
  "errors": [
    "Detalhe específico do erro 1",
    "Detalhe específico do erro 2"
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "req_123"
}
```

### Endpoints Principais

#### Health Check
```http
GET /health
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 123.45,
    "environment": "development",
    "version": "1.0.0"
  },
  "message": "Service is healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "health_check"
}
```

#### Criação de Pagamento
```http
POST /api/payments/create
Content-Type: application/json
X-API-Key: your-api-key
X-Correlation-ID: req_123

{
  "paymentId": "pay_123456789",
  "externalPaymentId": "ext_987654321",
  "amount": 100.00,
  "currency": "BRL",
  "paymentMethod": "credit_card",
  "orderDetails": {
    "orderId": "order_123",
    "description": "Payment for order #123",
    "customerId": "cust_456"
  },
  "metadata": {
    "source": "web",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "externalPayment": {
      "id": "ext_1705312200000_abc123def",
      "data": {
        "status": "pending",
        "created_at": "2024-01-15T10:30:00Z",
        "payment_method": "credit_card",
        "amount": 100.00,
        "currency": "BRL"
      }
    },
    "responseType": "IFRAME",
    "link": "https://payment-gateway.com/pay/ext_1705312200000_abc123def?amount=100.00&currency=BRL"
  },
  "message": "Payment created successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "req_123"
}
```

#### Status do Pagamento
```http
GET /api/payments/status/{paymentId}
X-API-Key: your-api-key
X-Correlation-ID: req_123
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_123456789",
    "status": "pending",
    "amount": 100.00,
    "currency": "BRL",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Payment status retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "req_123"
}
```

#### Processamento de Webhook
```http
POST /api/webhooks/process
Content-Type: application/json
X-Correlation-ID: req_123

{
  "id": "webhook_123",
  "event_type": "payment.completed",
  "data": {
    "payment_id": "pay_123456789",
    "amount": 100.00,
    "currency": "BRL",
    "status": "completed"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Webhook processed successfully",
    "webhook_id": "webhook_123"
  },
  "message": "Webhook processed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "req_123"
}
```

## 🔧 Testando com Postman

1. **Importe a coleção**
   - Abra o Postman
   - Clique em "Import"
   - Selecione o arquivo `Paygator_API_Postman_Collection.json`

2. **Configure as variáveis**
   - `base_url`: `http://localhost:3000`
   - `api_key`: Sua chave de API
   - `correlation_id`: Será gerado automaticamente

3. **Teste os endpoints**
   - Health Check: `GET /health`
   - Criação de Pagamento: `POST /api/payments/create`
   - Status do Pagamento: `GET /api/payments/status/{paymentId}`
   - Webhooks: `POST /api/webhooks/process`

## 🐳 Docker

### Construir a imagem
```bash
docker build -t paygator-api .
```

### Executar o container
```bash
docker run -p 3000:3000 --env-file .env paygator-api
```

### Docker Compose
```bash
docker-compose up -d
```

## 🔒 Segurança

### Autenticação
- **API Key**: Header `X-API-Key` obrigatório para endpoints protegidos
- **Correlation ID**: Header `X-Correlation-ID` para rastreamento

### Validação de Assinatura
- **HMAC-SHA256**: Para webhooks
- **IP Whitelist**: Configurável
- **Rate Limiting**: 100 requests por 15 minutos por IP

### Headers de Segurança
- Helmet.js para headers de segurança
- CORS configurado
- Rate limiting por IP

## 📊 Monitoramento

### Logs
- Logs estruturados em JSON
- Níveis: error, warn, info, debug
- Rotação automática de arquivos

### Health Checks
- Endpoint `/health` para monitoramento
- Métricas de uptime e status

### Webhook Status
- Endpoint `/api/webhooks/status` para estatísticas
- Logs detalhados em `/api/webhooks/logs`

## 🚀 Deploy

### Variáveis de Ambiente de Produção
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
API_KEY=your-production-api-key
WEBHOOK_SECRET=your-production-webhook-secret
LOG_LEVEL=warn
```

### CI/CD
- GitHub Actions configurado
- Testes automáticos
- Deploy automático

## 📝 Estrutura do Projeto

```
src/
├── config/           # Configurações
├── controllers/      # Controladores da API
├── middleware/       # Middlewares (auth, validation, etc.)
├── models/          # Modelos do MongoDB
├── routes/          # Rotas da API
├── services/        # Lógica de negócio
├── types/           # Tipos TypeScript
├── utils/           # Utilitários (logger, etc.)
└── app.ts           # Aplicação principal
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, envie um email para suporte@paygator.com ou abra uma issue no GitHub.

---

**Paygator API** - Integração de pagamentos simplificada 🚀 