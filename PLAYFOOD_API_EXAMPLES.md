# Paygator API - Exemplos Práticos

Este documento contém exemplos práticos de como usar a API Paygator em diferentes cenários.

## 🍕 Cenário: Sistema de Delivery de Comida

### 1. Fluxo Completo de Pedido

#### Passo 1: Criar Pedido
```bash
curl -X POST http://localhost:3000/api/v1/playfood/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-playfood-api-key" \
  -d '{
    "orderId": "order_20240115_001",
    "customer": {
      "name": "Maria Silva",
      "email": "maria@email.com",
      "phone": "+5511999999999",
      "address": {
        "street": "Rua das Palmeiras, 456",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "country": "BR"
      }
    },
    "items": [
      {
        "name": "Pizza Margherita",
        "quantity": 1,
        "unitPrice": 45.00,
        "totalPrice": 45.00,
        "description": "Pizza com molho de tomate, mussarela e manjericão"
      },
      {
        "name": "Refrigerante Cola",
        "quantity": 2,
        "unitPrice": 8.00,
        "totalPrice": 16.00,
        "description": "Refrigerante Coca-Cola 350ml"
      }
    ],
    "totalAmount": 61.00,
    "deliveryFee": 5.00,
    "estimatedDeliveryTime": "2024-01-15T20:30:00Z",
    "notes": "Entregar no portão"
  }'
```

#### Passo 2: Criar Pagamento
```bash
curl -X POST http://localhost:3000/api/v1/playfood/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-playfood-api-key" \
  -d '{
    "orderId": "order_20240115_001",
    "amount": 66.00,
    "currency": "BRL",
    "paymentMethod": "credit_card",
    "customer": {
      "name": "Maria Silva",
      "email": "maria@email.com",
      "phone": "+5511999999999"
    },
    "returnUrl": "https://restaurante.com/success",
    "cancelUrl": "https://restaurante.com/cancel"
  }'
```

#### Passo 3: Atualizar Status do Pedido
```bash
curl -X PUT http://localhost:3000/api/v1/playfood/orders/order_20240115_001 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-playfood-api-key" \
  -d '{
    "status": "preparing",
    "estimatedDeliveryTime": "2024-01-15T20:45:00Z",
    "notes": "Pizza saindo do forno"
  }'
```

#### Passo 4: Finalizar Pedido
```bash
curl -X PUT http://localhost:3000/api/v1/playfood/orders/order_20240115_001 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-playfood-api-key" \
  -d '{
    "status": "delivered",
    "notes": "Pedido entregue com sucesso"
  }'
```

### 2. Processamento de Pagamento

#### Criar Pagamento via Provedor
```bash
curl -X POST http://localhost:3000/api/v1/playfood-payments/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "paymentId": "pay_20240115_001",
    "amount": 66.00,
    "currency": "BRL",
    "customer": {
      "email": "maria@email.com",
      "phone": "+5511999999999",
      "name": "Maria Silva"
    },
    "locale": "pt-BR",
    "returnUrl": "https://restaurante.com/success",
    "orderDetails": {
      "orderId": "order_20240115_001",
      "items": [
        {
          "name": "Pizza Margherita",
          "quantity": 1,
          "unitPrice": 45.00
        },
        {
          "name": "Refrigerante Cola",
          "quantity": 2,
          "unitPrice": 8.00
        }
      ]
    }
  }'
```

#### Consultar Status do Pagamento
```bash
curl -X POST http://localhost:3000/api/v1/playfood-payments/info \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "paymentId": "pay_20240115_001",
    "externalPayment": {
      "id": "ext_pay_20240115_001"
    }
  }'
```

## 🏪 Cenário: E-commerce

### 1. Pagamento de Produto

```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "paymentId": "pay_ecommerce_001",
    "externalPaymentId": 123456789,
    "paymentMethod": "credit_card",
    "paymentMethodId": "pm_visa_001",
    "amount": 299.99,
    "currency": "BRL",
    "customer": {
      "email": "cliente@email.com",
      "phone": "+5511888888888",
      "name": "João Santos",
      "billingAddress": {
        "countryCode": "BR",
        "stateCode": "RJ",
        "city": "Rio de Janeiro",
        "postcode": "20000-000",
        "street1": "Avenida Rio Branco, 100",
        "street2": "Sala 501"
      },
      "external": {
        "id": "cust_ecommerce_001",
        "data": {
          "customerType": "individual",
          "loyaltyPoints": 150
        }
      }
    },
    "locale": "pt-BR",
    "returnUrl": "https://loja.com/success",
    "orderDetails": {
      "orderId": "order_ecommerce_001",
      "public": {
        "vendorId": "vendor_loja_001",
        "vendorName": "Loja Virtual Exemplo",
        "cartTotal": 299.99,
        "deliveryTotal": 15.00,
        "taxTotal": 0.00,
        "serviceFeeTotal": 0.00,
        "discountTotal": 25.00
      },
      "internal": {
        "vendorMerchant": {
          "id": "merchant_loja_001",
          "externalId": "ext_merchant_001",
          "businessType": "COMPANY",
          "taxId": "12.345.678/0001-90",
          "name": "Loja Virtual Exemplo Ltda",
          "address": {
            "addressLine": "Rua do Comércio, 123",
            "city": "São Paulo",
            "countryCode": "BR",
            "zip": "01234-567"
          },
          "phone": "+5511777777777",
          "email": "contato@loja.com",
          "active": true,
          "data": {
            "companyData": {
              "industry": "ecommerce"
            },
            "merchantData": {
              "category": "electronics"
            }
          }
        },
        "vendorShare": 0.95
      }
    }
  }'
```

### 2. Estorno de Pagamento

```bash
curl -X POST http://localhost:3000/api/v1/playfood-payments/refund \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "paymentId": "pay_ecommerce_001",
    "externalPayment": {
      "id": "ext_pay_ecommerce_001"
    },
    "amountToRefund": 299.99,
    "reason": "Cliente solicitou cancelamento do pedido"
  }'
```

## 🏦 Cenário: Sistema Bancário

### 1. Registro de Comerciante

```bash
curl -X POST http://localhost:3000/api/v1/playfood-payments/merchant/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "merchantId": "merchant_restaurante_001",
    "businessName": "Restaurante Sabor Caseiro Ltda",
    "taxId": "12.345.678/0001-90",
    "address": {
      "street": "Rua das Flores, 789",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "country": "BR"
    },
    "contact": {
      "email": "contato@saborcaseiro.com",
      "phone": "+5511666666666"
    },
    "bankAccount": {
      "bankCode": "001",
      "agency": "1234",
      "account": "12345678",
      "accountType": "checking"
    }
  }'
```

### 2. Transferência para Comerciante

```bash
curl -X POST http://localhost:3000/api/v1/playfood-payments/transfer/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "merchantId": "merchant_restaurante_001",
    "amount": 2500.00,
    "currency": "BRL",
    "description": "Transferência semanal de vendas - Semana 01/2024"
  }'
```

## 🔔 Cenário: Webhooks

### 1. Configurar Webhook

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/configure \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "url": "https://meuapp.com/webhooks/payment",
    "events": ["payment.succeeded", "payment.failed", "payment.refunded"],
    "secret": "webhook-secret-key-123",
    "description": "Webhook para notificações de pagamento"
  }'
```

### 2. Processar Webhook (Simulação)

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=abc123..." \
  -d '{
    "event": "payment.succeeded",
    "data": {
      "paymentId": "pay_20240115_001",
      "amount": 66.00,
      "currency": "BRL",
      "status": "succeeded",
      "timestamp": "2024-01-15T20:30:00Z",
      "customer": {
        "email": "maria@email.com",
        "name": "Maria Silva"
      }
    }
  }'
```

## 📊 Consultas e Relatórios

### 1. Listar Pedidos com Filtros

```bash
# Pedidos pendentes
curl -X GET "http://localhost:3000/api/v1/playfood/orders?status=pending&page=1&limit=20" \
  -H "X-API-Key: your-playfood-api-key"

# Pedidos de hoje
curl -X GET "http://localhost:3000/api/v1/playfood/orders?date=2024-01-15&page=1&limit=50" \
  -H "X-API-Key: your-playfood-api-key"
```

### 2. Listar Pagamentos

```bash
# Pagamentos completados
curl -X GET "http://localhost:3000/api/v1/playfood/payments?status=completed&page=1&limit=20" \
  -H "X-API-Key: your-playfood-api-key"

# Pagamentos por período
curl -X GET "http://localhost:3000/api/v1/playfood/payments?startDate=2024-01-01&endDate=2024-01-15" \
  -H "X-API-Key: your-playfood-api-key"
```

### 3. Status dos Webhooks

```bash
curl -X GET http://localhost:3000/api/v1/webhooks/status \
  -H "X-API-Key: your-api-key"
```

### 4. Logs de Webhooks

```bash
curl -X GET "http://localhost:3000/api/v1/webhooks/logs?page=1&limit=10" \
  -H "X-API-Key: your-api-key"
```

## 🛠️ Scripts de Teste

### Script PowerShell para Teste Completo

```powershell
# Configurar variáveis
$baseUrl = "http://localhost:3000"
$apiKey = "your-api-key"
$playfoodApiKey = "your-playfood-api-key"

# 1. Criar pedido
$orderData = @{
    orderId = "test_order_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    customer = @{
        name = "Teste Cliente"
        email = "teste@email.com"
        phone = "+5511999999999"
        address = @{
            street = "Rua Teste, 123"
            city = "São Paulo"
            state = "SP"
            zipCode = "01234-567"
            country = "BR"
        }
    }
    items = @(
        @{
            name = "Produto Teste"
            quantity = 1
            unitPrice = 50.00
            totalPrice = 50.00
            description = "Produto para teste"
        }
    )
    totalAmount = 50.00
    deliveryFee = 5.00
    estimatedDeliveryTime = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
    notes = "Pedido de teste"
} | ConvertTo-Json -Depth 10

$orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/playfood/orders" -Method POST -Headers @{
    "Content-Type" = "application/json"
    "X-API-Key" = $playfoodApiKey
} -Body $orderData

Write-Host "Pedido criado: $($orderResponse.data.id)"

# 2. Criar pagamento
$paymentData = @{
    orderId = $orderResponse.data.id
    amount = 55.00
    currency = "BRL"
    paymentMethod = "credit_card"
    customer = @{
        name = "Teste Cliente"
        email = "teste@email.com"
        phone = "+5511999999999"
    }
    returnUrl = "https://example.com/success"
    cancelUrl = "https://example.com/cancel"
} | ConvertTo-Json -Depth 5

$paymentResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/playfood/payments" -Method POST -Headers @{
    "Content-Type" = "application/json"
    "X-API-Key" = $playfoodApiKey
} -Body $paymentData

Write-Host "Pagamento criado: $($paymentResponse.data.id)"

# 3. Atualizar status do pedido
$updateData = @{
    status = "preparing"
    notes = "Pedido em preparação"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/v1/playfood/orders/$($orderResponse.data.id)" -Method PUT -Headers @{
    "Content-Type" = "application/json"
    "X-API-Key" = $playfoodApiKey
} -Body $updateData

Write-Host "Pedido atualizado com sucesso"
```

### Script Bash para Teste Rápido

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
API_KEY="your-api-key"
PLAYFOOD_API_KEY="your-playfood-api-key"

echo "🧪 Iniciando testes da API Paygator..."

# Teste de status
echo "📊 Verificando status da API..."
curl -s -X GET "$BASE_URL/api/v1/playfood/status" \
  -H "X-API-Key: $PLAYFOOD_API_KEY" | jq '.'

# Teste de criação de pedido
echo "📝 Criando pedido de teste..."
ORDER_ID="test_order_$(date +%Y%m%d_%H%M%S)"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/playfood/orders" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $PLAYFOOD_API_KEY" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "customer": {
      "name": "Teste Cliente",
      "email": "teste@email.com",
      "phone": "+5511999999999",
      "address": {
        "street": "Rua Teste, 123",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "country": "BR"
      }
    },
    "items": [
      {
        "name": "Produto Teste",
        "quantity": 1,
        "unitPrice": 50.00,
        "totalPrice": 50.00,
        "description": "Produto para teste"
      }
    ],
    "totalAmount": 50.00,
    "deliveryFee": 5.00,
    "estimatedDeliveryTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "notes": "Pedido de teste"
  }')

echo "✅ Pedido criado:"
echo $ORDER_RESPONSE | jq '.'

echo "🎉 Testes concluídos!"
```

## 📋 Checklist de Implementação

- [ ] Configurar variáveis de ambiente
- [ ] Testar endpoints básicos
- [ ] Implementar autenticação
- [ ] Configurar webhooks
- [ ] Implementar tratamento de erros
- [ ] Configurar logs
- [ ] Testar fluxo completo
- [ ] Implementar monitoramento
- [ ] Documentar integração
- [ ] Treinar equipe

---

**Nota:** Todos os exemplos usam dados fictícios para demonstração. Em produção, use dados reais e siga as melhores práticas de segurança.