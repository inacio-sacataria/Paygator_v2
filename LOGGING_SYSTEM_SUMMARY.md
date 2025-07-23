# Sistema de Logging - Paygator

## 📋 Resumo da Implementação

O sistema de logging foi completamente implementado no Paygator, fornecendo um histórico completo de todas as chamadas da API e atividades do sistema.

## 🗄️ Tabelas Criadas

### 1. `api_logs` - Logs de Chamadas da API
- **Propósito**: Registrar todas as requisições e respostas da API
- **Campos principais**:
  - `correlation_id`: ID único para rastrear requisições
  - `method`: Método HTTP (GET, POST, PUT, DELETE)
  - `url`: Endpoint chamado
  - `ip_address`: IP do cliente
  - `user_agent`: User agent do cliente
  - `api_key`: Chave de API utilizada
  - `request_headers`: Headers da requisição
  - `request_body`: Corpo da requisição (dados sensíveis redatados)
  - `response_status`: Status code da resposta
  - `response_body`: Corpo da resposta
  - `response_time_ms`: Tempo de resposta em milissegundos
  - `error_message`: Mensagem de erro (se houver)
  - `created_at`: Timestamp da criação

### 2. `payment_logs` - Logs de Pagamentos
- **Propósito**: Registrar todas as atividades relacionadas a pagamentos
- **Campos principais**:
  - `payment_id`: ID do pagamento
  - `external_payment_id`: ID externo do pagamento
  - `action`: Ação realizada (created, updated, status_changed, failed)
  - `previous_status`: Status anterior
  - `new_status`: Novo status
  - `amount`: Valor do pagamento
  - `currency`: Moeda
  - `customer_email`: Email do cliente
  - `error_message`: Mensagem de erro (se houver)
  - `metadata`: Dados adicionais em JSON
  - `correlation_id`: ID de correlação
  - `created_at`: Timestamp da criação

### 3. `auth_logs` - Logs de Autenticação
- **Propósito**: Registrar tentativas de autenticação
- **Campos principais**:
  - `correlation_id`: ID único da requisição
  - `api_key`: Chave de API utilizada
  - `ip_address`: IP do cliente
  - `user_agent`: User agent do cliente
  - `action`: Ação (login, logout, auth_success, auth_failed)
  - `status`: Status (success, failed)
  - `error_message`: Mensagem de erro (se houver)
  - `created_at`: Timestamp da criação

## 🔧 Componentes Implementados

### 1. LoggingService (`src/services/loggingService.ts`)
- **Funcionalidades**:
  - `logApiCall()`: Salvar logs de chamadas da API
  - `logPayment()`: Salvar logs de pagamentos
  - `logAuth()`: Salvar logs de autenticação
  - `getApiLogs()`: Buscar logs de API com filtros
  - `getPaymentLogs()`: Buscar logs de pagamentos com filtros
  - `getLogStats()`: Obter estatísticas de logs

### 2. Middleware de Logging (`src/middleware/logging.ts`)
- **Funcionalidades**:
  - Geração automática de Correlation IDs
  - Captura de dados da requisição e resposta
  - Redação de dados sensíveis (telefones)
  - Log automático de todas as chamadas da API
  - Medição de tempo de resposta

### 3. Endpoints de API
- **`/admin/api/logs`**: Listar logs de API com filtros
- **`/admin/api/payment-logs`**: Listar logs de pagamentos com filtros
- **`/admin/api/log-stats`**: Obter estatísticas de logs

### 4. Dashboard de Logs (`src/views/admin/logs.ejs`)
- **Funcionalidades**:
  - Visualização em tempo real dos logs
  - Filtros por método, status, data, etc.
  - Paginação
  - Estatísticas em tempo real
  - Atualização automática a cada 30 segundos
  - Interface responsiva e moderna

## 🚀 Como Usar

### 1. Acessar o Dashboard de Logs
```
http://localhost:3000/admin/logs
```

### 2. Ver Logs de API
- Acesse a aba "Logs de API"
- Use os filtros para buscar logs específicos
- Visualize detalhes de cada requisição

### 3. Ver Logs de Pagamentos
- Acesse a aba "Logs de Pagamentos"
- Filtre por Payment ID, ação, data, etc.
- Acompanhe o histórico de cada pagamento

### 4. API Endpoints
```bash
# Obter logs de API
GET /admin/api/logs?page=1&method=POST&status=200

# Obter logs de pagamentos
GET /admin/api/payment-logs?page=1&action=created

# Obter estatísticas
GET /admin/api/log-stats
```

## 📊 Estatísticas Disponíveis

- **Total de logs de API**
- **Total de logs de pagamentos**
- **Total de logs de autenticação**
- **Logs de hoje**
- **Contagem de erros**
- **Contagem de sucessos**

## 🔍 Filtros Disponíveis

### Logs de API
- **Método**: GET, POST, PUT, DELETE
- **Status**: 200, 400, 401, 500, etc.
- **Data**: Data início e fim
- **URL**: Busca por URL específica

### Logs de Pagamentos
- **Ação**: created, updated, status_changed, failed
- **Payment ID**: ID específico do pagamento
- **Data**: Data início e fim

## 🛡️ Segurança

- **Dados sensíveis redatados**: Telefones são mascarados nos logs
- **Correlation IDs**: Rastreamento único de cada requisição
- **Logs de erro**: Captura detalhada de erros para debugging
- **Performance**: Logs assíncronos para não impactar performance

## 📈 Benefícios

1. **Auditoria Completa**: Histórico de todas as atividades
2. **Debugging**: Rastreamento de problemas com Correlation IDs
3. **Monitoramento**: Estatísticas em tempo real
4. **Compliance**: Logs para auditoria e compliance
5. **Performance**: Análise de tempos de resposta
6. **Segurança**: Monitoramento de tentativas de acesso

## 🔄 Atualizações Automáticas

- **Dashboard**: Atualiza automaticamente a cada 30 segundos
- **Logs em tempo real**: Novos logs aparecem automaticamente
- **Estatísticas**: Atualizadas em tempo real

## 🎯 Próximos Passos

1. **Exportação de Logs**: Implementar exportação para CSV/JSON
2. **Alertas**: Configurar alertas para erros críticos
3. **Retenção**: Política de retenção de logs antigos
4. **Backup**: Backup automático dos logs
5. **Análise Avançada**: Dashboards com gráficos e métricas

## ✅ Status: COMPLETO

O sistema de logging está 100% funcional e pronto para uso em produção! 