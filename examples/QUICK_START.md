# 🚀 Quick Start - Testar Endpoint de Pagamento

## ❌ Erro Comum: "API key is required"

Se você recebeu este erro, significa que o header `X-API-Key` não foi enviado corretamente.

## ✅ Solução

### No Postman/Insomnia:

**Headers:**
```
x-api-key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
Content-Type: application/json
```

**⚠️ IMPORTANTE:** O header deve ser `x-api-key` (minúsculas), não `X-API-Key`!

### Exemplo Completo de Requisição:

**URL:** `POST http://localhost:3000/api/v1/payments/create`

**Headers:**
```
x-api-key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 100.50
}
```

### API Keys Válidas (configuradas por padrão):

1. `main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e`
2. `playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5`
3. `main_70a3ae2d414936451d05d19f7ca4b01c1761ee04b519b93961f56fa2a27cc914`

### Usando cURL:

```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "x-api-key: main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.50}'
```

### Usando JavaScript/Fetch:

```javascript
fetch('http://localhost:3000/api/v1/payments/create', {
  method: 'POST',
  headers: {
    'x-api-key': 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 100.50
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔍 Verificar se o Servidor Está Rodando

Certifique-se de que o servidor está ativo:

```bash
npm start
# ou
npm run dev
```

O servidor deve estar rodando na porta 3000 (ou a porta configurada no `.env`).

