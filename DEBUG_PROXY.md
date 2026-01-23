# Debug Proxy - Dashboard React

## Problema
O dashboard React está tentando fazer requisições para `/admin/login` e `/admin/api/auth/check`, mas está recebendo erro 500.

## Soluções Aplicadas

### 1. Proxy do Vite (`dashboard/vite.config.ts`)
- Configurado para redirecionar `/admin` e `/api` para `http://localhost:3000`
- Adicionado `logLevel: 'debug'` para ver logs do proxy

### 2. Backend (`src/routes/adminRoutes.ts`)
- Adicionados logs de debug nas rotas `/admin/api/auth/check` e `/admin/login`
- Rotas retornam JSON para requisições da API

### 3. CORS (`src/config/environment.ts`)
- `http://localhost:3001` já está nas origens permitidas
- Headers permitidos incluem `X-Requested-With`

## Como Testar

1. **Reinicie o servidor Vite** (importante!):
   ```powershell
   # Pare o servidor (Ctrl+C) e reinicie:
   cd dashboard
   npm run dev
   ```

2. **Verifique os logs do backend** quando fizer login:
   - Deve aparecer `[LOGIN] Route called` no console do backend
   - Deve aparecer `[AUTH CHECK] Route called` no console do backend

3. **Verifique o console do navegador**:
   - Deve aparecer `[LOGIN] Attempting login...`
   - Deve aparecer `[LOGIN] Response status: 200`

## Se ainda não funcionar

1. Verifique se o backend está rodando na porta 3000:
   ```powershell
   curl http://localhost:3000/admin/api/test
   ```

2. Verifique se o proxy está funcionando:
   - Abra o DevTools do navegador
   - Vá na aba Network
   - Tente fazer login
   - Veja se a requisição vai para `localhost:3001/admin/login` (errado) ou `localhost:3000/admin/login` (correto)

3. Se o proxy não estiver funcionando:
   - Pare o servidor Vite
   - Delete `dashboard/node_modules/.vite` (cache do Vite)
   - Reinicie o servidor Vite

