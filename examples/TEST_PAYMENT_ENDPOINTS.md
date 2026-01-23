# 🧪 Guia de Teste - Endpoints de Pagamento

Este guia mostra como testar os endpoints de pagamento implementados.

## 📋 Pré-requisitos

1. **Variáveis de ambiente configuradas** no arquivo `.env`:
   ```env
   E2PAYMENTS_CLIENT_ID=98ce725a-544b-4841-9304-74efef98534e
   E2PAYMENTS_CLIENT_SECRET=14bOAVyBNAcwp6qRK2aRwrDO1z7fjqSWUdEPL03J
   E2PAYMENTS_API_URL=https://mpesaemolatech.com
   E2PAYMENTS_EMOLA_WALLET=989488

   THECODE_CLIENT_ID=98cd2d3b-5e4f-42e0-8c93-d01fc871b858
   THECODE_CLIENT_SECRET=adazkz8CM456yLhzNQz4m3JOOmmFVEm3fHkrbDFh
   THECODE_MPESA_WALLET=455130
   ```

2. **Servidor rodando**: `npm start` ou `npm run dev`

3. **API Key**: Use uma das chaves configuradas em `config.security.apiKeys`

## 🔄 Fluxo de Pagamento

### 1. Criar Pagamento

**Endpoint:** `POST {{baseUrl}}/api/v1/payments/create`

**Headers:**
```
Content-Type: application/json
X-API-Key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
```

**Body (mínimo):**
```json
{
  "amount": 100.50
}
```

**Body (completo):**
```json
{
  "amount": 100.50,
  "currency": "MZN",
  "customer": {
    "email": "cliente@exemplo.com",
    "phone": "+258841234567",
    "name": "João Silva"
  },
  "paymentMethod": "mobile_money",
  "locale": "pt-MZ",
  "returnUrl": "https://seusite.com/pagamento-sucesso",
  "orderDetails": {
    "orderId": "ORD-12345",
    "public": {
      "vendorId": "vendor-001",
      "vendorName": "Minha Loja",
      "cartTotal": 100.50
    }
  }
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "externalPayment": {
    "id": "ext_1234567890_abc123",
    "data": {
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z",
      "payment_method": "mobile_money",
      "amount": 100.50,
      "currency": "MZN"
    }
  },
  "responseType": "REDIRECT",
  "link": "http://localhost:3000/payment-form/pay_1234567890",
  "message": "Payment created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlation_id": "abc-123-def"
}
```

### 2. Processar Pagamento Emola

**Endpoint:** `POST {{baseUrl}}/api/v1/payments/process-emola`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "paymentId": "pay_1234567890",
  "phone": "+258861234567",
  "amount": 100.50,
  "currency": "MZN"
}
```

**Importante:** 
- O número de telefone deve começar com **86** ou **87** para Emola
- O formato pode ser `+258861234567` ou `861234567`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Pagamento e-Mola processado com sucesso",
  "data": {
    "transactionId": "emola_1234567890",
    "status": "completed",
    "reference": "PAYMENT_1234567890"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlation_id": "abc-123-def"
}
```

### 3. Processar Pagamento M-Pesa

**Endpoint:** `POST {{baseUrl}}/api/v1/payments/process-mpesa`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "paymentId": "pay_1234567890",
  "phone": "+258841234567",
  "amount": 100.50,
  "currency": "MZN"
}
```

**Importante:** 
- O número de telefone deve começar com **84** ou **85** para M-Pesa
- O formato pode ser `+258841234567` ou `841234567`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Pagamento M-Pesa processado com sucesso",
  "data": {
    "transactionId": "mpesa_1234567890",
    "status": "completed",
    "reference": "PAY_1234567890"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlation_id": "abc-123-def"
}
```

### 4. Verificar Status do Pagamento

**Endpoint:** `GET {{baseUrl}}/api/v1/payments/{paymentId}/status`

**Headers:**
```
X-API-Key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
```

**Resposta (200):**
```json
{
  "paymentId": "pay_1234567890",
  "status": "completed",
  "amount": 100.50,
  "currency": "MZN",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:05.000Z"
}
```

## 🧪 Testando com Postman/Insomnia

### Collection JSON para Postman

1. **Criar variável de ambiente:**
   - `baseUrl`: `http://localhost:3000`
   - `apiKey`: `main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e`

2. **Importar requests:**
   - Criar pagamento: `POST {{baseUrl}}/api/v1/payments/create`
   - Processar Emola: `POST {{baseUrl}}/api/v1/payments/process-emola`
   - Processar M-Pesa: `POST {{baseUrl}}/api/v1/payments/process-mpesa`
   - Verificar status: `GET {{baseUrl}}/api/v1/payments/{{paymentId}}/status`

## ⚠️ Validações Importantes

### Números de Telefone

- **Emola**: Deve começar com `86` ou `87`
  - ✅ `+258861234567`
  - ✅ `861234567`
  - ❌ `+258841234567` (M-Pesa)

- **M-Pesa**: Deve começar com `84` ou `85`
  - ✅ `+258841234567`
  - ✅ `841234567`
  - ❌ `+258861234567` (Emola)

### Campos Obrigatórios

**Criar Pagamento:**
- `amount` (obrigatório)

**Processar Pagamento:**
- `paymentId` (obrigatório)
- `phone` (obrigatório)
- `amount` (obrigatório)
- `currency` (obrigatório)

## 🔍 Debugging

Se encontrar erros:

1. **Verificar logs do servidor** para ver mensagens detalhadas
2. **Verificar variáveis de ambiente** estão configuradas corretamente
3. **Verificar formato do telefone** (deve começar com 84/85 para M-Pesa ou 86/87 para Emola)
4. **Verificar se o paymentId existe** antes de processar o pagamento

## 📝 Exemplo Completo de Fluxo

```bash
# 1. Criar pagamento
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e" \
  -d '{"amount": 100.50}'

# Resposta: {"link": "http://localhost:3000/payment-form/pay_1234567890", ...}

# 2. Processar pagamento Emola
curl -X POST http://localhost:3000/api/v1/payments/process-emola \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_1234567890",
    "phone": "+258861234567",
    "amount": 100.50,
    "currency": "MZN"
  }'

# 3. Verificar status
curl -X GET http://localhost:3000/api/v1/payments/pay_1234567890/status \
  -H "X-API-Key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e"
```

