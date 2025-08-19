# Sistema de Pagamento M-Pesa - Paygator

## Visão Geral

O Paygator agora inclui um sistema completo de pagamento interno usando M-Pesa (Moçambique), que substitui o sistema anterior de links externos por um formulário de pagamento interno e seguro.

## Funcionalidades

- ✅ **Formulário de Pagamento Interno**: Interface moderna e responsiva
- ✅ **Integração M-Pesa**: Processamento de pagamentos via mobile money
- ✅ **Validação de Telefone**: Formato moçambicano (+258XXXXXXXXX)
- ✅ **Polling Automático**: Verificação automática do status do pagamento
- ✅ **Callbacks Simulados**: Sistema de webhooks para atualizações de status
- ✅ **Interface Responsiva**: Funciona em dispositivos móveis e desktop

## Arquitetura do Sistema

### 1. Fluxo de Pagamento

```
1. Cliente cria pagamento via API
   ↓
2. Sistema retorna link interno (/payment-form/{paymentId})
   ↓
3. Cliente acessa formulário e insere telefone
   ↓
4. Sistema processa pagamento M-Pesa
   ↓
5. Sistema aguarda callback/confirmação
   ↓
6. Status é atualizado e cliente é redirecionado
```

### 2. Componentes Principais

- **`payment-form.ejs`**: Interface do usuário
- **`mpesaController.ts`**: Lógica de processamento M-Pesa
- **`paymentFormRoutes.ts`**: Rotas para o formulário
- **`paymentRoutes.ts`**: Rotas da API de pagamentos

## Endpoints da API

### Criar Pagamento
```http
POST /api/v1/payments/create
Content-Type: application/json
X-API-Key: {sua-chave-api}

{
  "amount": 50.00,
  "currency": "MZN",
  "customer": {
    "phone": "+258841234567",
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "returnUrl": "https://seu-site.com/success"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "externalPayment": {
      "id": "ext_1234567890_abc123",
      "data": {
        "status": "pending",
        "amount": 50.00,
        "currency": "MZN"
      }
    },
    "responseType": "INTERNAL_FORM",
    "link": "/payment-form/ext_1234567890_abc123"
  }
}
```

### Processar Pagamento M-Pesa
```http
POST /api/v1/payments/process-mpesa
Content-Type: application/json

{
  "paymentId": "ext_1234567890_abc123",
  "phone": "+258841234567",
  "amount": 50.00,
  "currency": "MZN"
}
```

### Callback M-Pesa (Simulado)
```http
POST /api/v1/payments/mpesa-callback
Content-Type: application/json

{
  "paymentId": "ext_1234567890_abc123",
  "status": "success", // ou "failed"
  "transactionId": "mpesa_1234567890_xyz789"
}
```

### Verificar Status
```http
GET /api/v1/payments/{paymentId}/status
X-API-Key: {sua-chave-api}
```

## URLs do Sistema

### Formulário de Pagamento
- **URL Base**: `/payment-form/{paymentId}`
- **Exemplo**: `/payment-form/ext_1234567890_abc123`

### Formulário com Parâmetros (Compatibilidade)
- **URL Base**: `/payment-form/{paymentId}/{amount}/{currency}`
- **Exemplo**: `/payment-form/ext_1234567890_abc123/50/MZN`

## Interface do Usuário

### Características do Formulário

1. **Design Moderno**: Interface limpa e profissional
2. **Responsivo**: Funciona em todos os dispositivos
3. **Validação**: Verifica formato do telefone moçambicano
4. **Feedback Visual**: Mensagens de sucesso e erro
5. **Loading States**: Indicadores visuais durante processamento
6. **Polling Automático**: Verifica status a cada 10 segundos

### Campos do Formulário

- **Telefone**: Formato +258XXXXXXXXX (prefixo fixo +258)
- **Valor**: Exibido automaticamente do pagamento
- **Moeda**: Exibida automaticamente do pagamento
- **Botão de Pagamento**: Processa o pagamento M-Pesa

## Configuração

### 1. Variáveis de Ambiente

```bash
# Configurações do servidor
PORT=3000
NODE_ENV=development

# Configurações de sessão
SESSION_SECRET=paygator-secret-key

# Configurações de CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://seu-site.com
```

### 2. Banco de Dados

O sistema usa SQLite por padrão. Certifique-se de que as tabelas necessárias existem:

```sql
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT,
  status TEXT DEFAULT 'pending',
  customer_id TEXT,
  vendor_id TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testes

### Script de Teste Automatizado

Execute o script de teste para verificar se tudo está funcionando:

```bash
node scripts/test-mpesa-payment.js
```

### Teste Manual

1. **Criar Pagamento**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/create \
     -H "Content-Type: application/json" \
     -H "X-API-Key: test-api-key-123" \
     -d '{"amount": 50.00, "currency": "MZN"}'
   ```

2. **Acessar Formulário**: Abra o link retornado no navegador

3. **Processar Pagamento**: Preencha o telefone e clique em "Pagar"

4. **Simular Callback**: Use o endpoint de callback para simular confirmação

## Segurança

### Medidas Implementadas

- ✅ **Validação de Entrada**: Todos os campos são validados
- ✅ **Rate Limiting**: Proteção contra ataques de força bruta
- ✅ **Logging**: Registro de todas as operações
- ✅ **Validação de Telefone**: Formato específico moçambicano
- ✅ **Sanitização**: Dados são limpos antes do processamento

### Recomendações

1. **Use HTTPS** em produção
2. **Configure CORS** adequadamente
3. **Monitore logs** regularmente
4. **Implemente autenticação** para endpoints sensíveis
5. **Valide webhooks** com assinaturas

## Monitoramento e Logs

### Logs Gerados

- Criação de pagamentos
- Processamento M-Pesa
- Callbacks recebidos
- Erros e exceções
- Acesso ao formulário

### Exemplo de Log

```json
{
  "level": "info",
  "message": "M-Pesa payment initiated successfully",
  "correlationId": "req_1234567890",
  "paymentId": "ext_1234567890_abc123",
  "mpesaTransactionId": "mpesa_1234567890_xyz789",
  "phone": "+258841234567",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Problemas Comuns

1. **Formulário não carrega**
   - Verifique se o paymentId existe no banco
   - Confirme se as rotas estão registradas corretamente

2. **Erro ao processar M-Pesa**
   - Valide formato do telefone (+258XXXXXXXXX)
   - Verifique se o pagamento não foi processado anteriormente

3. **Callback não funciona**
   - Confirme formato correto dos dados
   - Verifique logs para erros específicos

4. **Status não atualiza**
   - Verifique se o polling está funcionando
   - Confirme se o callback foi processado

### Logs de Debug

Ative logs detalhados para debug:

```typescript
// No logger.ts
logger.level = 'debug';
```

## Migração do Sistema Anterior

### Mudanças Principais

1. **Links Externos → Links Internos**
   - Antes: `https://payment-gateway.com/pay/...`
   - Agora: `/payment-form/{paymentId}`

2. **Response Type**
   - Antes: `"IFRAME"`
   - Agora: `"INTERNAL_FORM"`

3. **Processamento**
   - Antes: Redirecionamento externo
   - Agora: Formulário interno + M-Pesa

### Compatibilidade

O sistema mantém compatibilidade com:
- ✅ APIs existentes
- ✅ Estrutura de dados
- ✅ Webhooks
- ✅ Logs e monitoramento

## Suporte

Para suporte técnico ou dúvidas:

- 📧 Email: support@paygator.com
- 📚 Documentação: `/api-docs`
- 🐛 Issues: Repositório GitHub
- 📞 Telefone: +258 84 123 4567

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Desenvolvido por**: Equipe Paygator
