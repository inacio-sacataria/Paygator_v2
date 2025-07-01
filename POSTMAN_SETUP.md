# Paygator API - Coleção Postman

Esta coleção contém todos os endpoints da API Paygator, um clone completo do Playfood Payment Provider.

## 📋 Índice

- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura da Coleção](#estrutura-da-coleção)
- [Autenticação](#autenticação)
- [Exemplos de Uso](#exemplos-de-uso)
- [Troubleshooting](#troubleshooting)

## 🚀 Instalação

### 1. Importar a Coleção

1. Abra o **Postman**
2. Clique em **"Import"** no canto superior esquerdo
3. Arraste o arquivo `Paygator_API_Postman_Collection.json` ou clique em **"Upload Files"**
4. Selecione o arquivo e clique em **"Import"**

### 2. Configurar Variáveis de Ambiente

Após importar, configure as variáveis:

1. Clique no ícone de **engrenagem** (⚙️) ao lado do nome da coleção
2. Vá para a aba **"Variables"**
3. Configure as seguintes variáveis:

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `baseUrl` | `http://localhost:3000` | URL base da API |
| `apiKey` | `your-api-key-here` | Chave da API principal |
| `playfoodApiKey` | `your-playfood-api-key-here` | Chave da API Playfood |

## ⚙️ Configuração

### Variáveis de Ambiente

#### Para Desenvolvimento Local
```
baseUrl: http://localhost:3000
apiKey: test-api-key-123
playfoodApiKey: test-playfood-key-456
```

#### Para Produção
```
baseUrl: https://api.paygator.com
apiKey: [sua-chave-de-produção]
playfoodApiKey: [sua-chave-playfood-produção]
```

### Headers Globais

A coleção já está configurada com:
- `Content-Type: application/json` (quando necessário)
- `X-API-Key: {{apiKey}}` (autenticação automática)

## 📁 Estrutura da Coleção

### 1. **Payments** - Pagamentos Principais
- `Create Payment` - Criar novo pagamento
- `Get Payment Status` - Consultar status
- `Cancel Payment` - Cancelar pagamento

### 2. **Playfood Orders** - Pedidos Playfood
- `Create Order` - Criar pedido
- `List Orders` - Listar pedidos
- `Get Order` - Consultar pedido
- `Update Order` - Atualizar pedido
- `Cancel Order` - Cancelar pedido

### 3. **Playfood Payments** - Pagamentos Playfood
- `Create Payment` - Criar pagamento
- `List Payments` - Listar pagamentos
- `Get Payment` - Consultar pagamento
- `Refund Payment` - Estornar pagamento

### 4. **Playfood Payment Provider** - Provedor de Pagamento
- `Create Payment` - Criar pagamento via provedor
- `Get Payment Info` - Informações do pagamento
- `Capture Payment` - Capturar pagamento
- `Refund Payment` - Estornar pagamento
- `Register Merchant` - Registrar comerciante
- `Create Transfer` - Criar transferência

### 5. **Webhooks** - Notificações
- `Process Payment Webhook` - Processar webhook de pagamento
- `Process Playfood Webhook` - Processar webhook Playfood
- `Create Webhook Config` - Configurar webhook
- `List Webhook Configs` - Listar configurações
- `Update Webhook Config` - Atualizar configuração
- `Delete Webhook Config` - Remover configuração
- `Get Webhook Status` - Status dos webhooks
- `Get Webhook Logs` - Logs de webhooks

### 6. **Status & Health** - Monitoramento
- `Get Playfood Status` - Status da API Playfood
- `Get Payment Settings` - Configurações de pagamento

## 🔐 Autenticação

### API Key Authentication
A maioria dos endpoints requer autenticação via API Key no header:
```
X-API-Key: {{apiKey}}
```

### Webhook Authentication
Webhooks usam assinatura digital:
```
X-Webhook-Signature: sha256=abc123...
X-Playfood-Signature: sha256=def456...
```

## 💡 Exemplos de Uso

### 1. Criar um Pagamento

**Endpoint:** `POST /api/v1/payments/create`

**Body:**
```json
{
  "paymentId": "pay_123456789",
  "externalPaymentId": 123456789,
  "amount": 100.50,
  "currency": "BRL",
  "customer": {
    "email": "customer@example.com",
    "phone": "+5511999999999",
    "name": "João Silva",
    "billingAddress": {
      "countryCode": "BR",
      "stateCode": "SP",
      "city": "São Paulo",
      "postcode": "01234-567",
      "street1": "Rua das Flores, 123"
    }
  },
  "locale": "pt-BR",
  "returnUrl": "https://example.com/return",
  "orderDetails": {
    "orderId": "order_123456789",
    "public": {
      "vendorId": "vendor_123456789",
      "vendorName": "Restaurante Exemplo",
      "cartTotal": 100.50,
      "deliveryTotal": 10.00,
      "taxTotal": 5.00,
      "serviceFeeTotal": 2.50
    }
  }
}
```

### 2. Criar um Pedido Playfood

**Endpoint:** `POST /api/v1/playfood/orders`

**Body:**
```json
{
  "orderId": "order_123456789",
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "country": "BR"
    }
  },
  "items": [
    {
      "name": "Hambúrguer Clássico",
      "quantity": 2,
      "unitPrice": 25.00,
      "totalPrice": 50.00,
      "description": "Hambúrguer com queijo e salada"
    }
  ],
  "totalAmount": 65.00,
  "deliveryFee": 5.00,
  "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
  "notes": "Sem cebola no hambúrguer"
}
```

### 3. Listar Pedidos com Filtros

**Endpoint:** `GET /api/v1/playfood/orders?page=1&limit=10&status=pending`

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)
- `status`: Filtro por status (opcional)

## 🔧 Troubleshooting

### Erro 401 - Unauthorized
**Problema:** API Key inválida ou ausente
**Solução:** Verifique se a variável `apiKey` está configurada corretamente

### Erro 404 - Not Found
**Problema:** Endpoint não encontrado
**Solução:** Verifique se o servidor está rodando e se a URL está correta

### Erro 400 - Bad Request
**Problema:** Dados inválidos no body
**Solução:** Verifique se o JSON está válido e se todos os campos obrigatórios estão presentes

### Erro 429 - Too Many Requests
**Problema:** Rate limit excedido
**Solução:** Aguarde alguns segundos antes de fazer nova requisição

### Erro 500 - Internal Server Error
**Problema:** Erro interno do servidor
**Solução:** Verifique os logs do servidor para mais detalhes

## 📝 Notas Importantes

1. **Rate Limiting:** A API possui rate limiting configurado
2. **Validação:** Todos os endpoints validam dados de entrada
3. **Logs:** Todas as requisições são logadas
4. **Webhooks:** Requerem assinatura válida para segurança
5. **IDs:** Use IDs únicos para evitar conflitos

## 🚀 Próximos Passos

1. Configure as variáveis de ambiente
2. Teste os endpoints básicos primeiro
3. Configure webhooks para receber notificações
4. Implemente a integração no seu sistema

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique a documentação da API
- Consulte os logs do servidor
- Entre em contato com o time de desenvolvimento

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2024 