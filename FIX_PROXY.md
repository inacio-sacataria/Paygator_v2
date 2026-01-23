# Fix Proxy - Dashboard React

## Problema
O proxy do Vite não está redirecionando corretamente as requisições `/admin/*` para o backend.

## Solução Aplicada
Atualizei `dashboard/vite.config.ts` com:
- Regex `^/admin` e `^/api` para garantir que todas as rotas sejam capturadas
- Logs de debug para ver o que está sendo redirecionado

## ⚠️ AÇÃO NECESSÁRIA: Reiniciar o Vite

**IMPORTANTE**: O Vite precisa ser reiniciado para aplicar as mudanças no proxy!

1. **Pare o servidor Vite** (Ctrl+C na janela do PowerShell do dashboard)

2. **Reinicie o servidor Vite**:
   ```powershell
   cd dashboard
   npm run dev
   ```

3. **Verifique os logs**:
   - No console do Vite, você deve ver logs `[VITE PROXY] Proxying: ...` quando fizer requisições
   - Isso confirma que o proxy está funcionando

## Teste

Após reiniciar, tente fazer login novamente. Você deve ver:
- No console do Vite: logs de proxy
- No console do backend: logs `[AUTH CHECK] Route called` e `[LOGIN] Route called`
- No navegador: login funcionando

## Se ainda não funcionar

Verifique se o backend está rodando:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/admin/api/test" -Method GET
```

Deve retornar: `{"message":"Test route works",...}`

