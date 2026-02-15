# Paygator Dashboard - React Frontend

Dashboard React para gerenciamento do Paygator. **Usa as APIs do projeto raiz** (Paygator_v2).

## Como correr (projeto raiz + dashboard)

1. **Na raiz do repositório** (API):
   ```bash
   npm install && npm run dev
   ```
   API em `http://localhost:3000`.

2. **Na pasta dashboard**:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
   Dashboard em `http://localhost:3001`. O Vite faz proxy de `/admin` e `/api` para `http://127.0.0.1:3000`, ou usa `VITE_API_URL` se estiver definida.

## Configuração

### Variáveis de Ambiente

O dashboard usa variáveis de ambiente do Vite. Crie um arquivo `.env` na raiz do dashboard:

```env
# URL do Backend API
VITE_API_URL=http://localhost:3000

# Porta do servidor de desenvolvimento
VITE_PORT=3001
```

**Importante**: 
- Variáveis do Vite devem começar com `VITE_`
- Reinicie o servidor após alterar o `.env`
- O arquivo `.env` não é commitado (está no `.gitignore`)

### Exemplo de Configuração

Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O dashboard será iniciado em `http://localhost:3001` e fará requisições para o backend configurado em `VITE_API_URL`.

## Build

```bash
npm run build
```

## Estrutura

- `src/pages/` - Páginas do dashboard
- `src/components/` - Componentes reutilizáveis
- `src/contexts/` - Contextos React (Auth, etc)
- `src/services/` - Serviços de API

## Como Funciona

O dashboard faz requisições diretamente para o backend usando a URL configurada em `VITE_API_URL`:

- Autenticação: `${VITE_API_URL}/admin/login`
- API: `${VITE_API_URL}/admin/api/*`
- Pagamentos: `${VITE_API_URL}/api/v1/payments/*`

## Troubleshooting

### Requisições não funcionam

1. Verifique se o backend está rodando na porta configurada em `VITE_API_URL`
2. Verifique se o arquivo `.env` existe e tem `VITE_API_URL` configurado
3. Reinicie o servidor Vite após alterar o `.env`

### CORS Errors

Certifique-se de que o backend permite requisições de `http://localhost:3001` nas configurações de CORS.
