# Dashboard React - Paygator

## 🎯 Visão Geral

O dashboard React é uma aplicação frontend **desacoplada** do backend, consumindo as APIs REST existentes. Isso permite:

- ✅ **Separação de responsabilidades**: Frontend e backend independentes
- ✅ **Melhor experiência de desenvolvimento**: React + TypeScript + Vite
- ✅ **Escalabilidade**: Pode ser deployado separadamente
- ✅ **Manutenção facilitada**: Código mais organizado e moderno

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd dashboard
npm install
```

### 2. Iniciar Desenvolvimento

```bash
# Terminal 1: Backend (porta 3000)
npm run dev

# Terminal 2: Dashboard React (porta 3001)
cd dashboard
npm run dev
```

O dashboard estará disponível em: `http://localhost:3001`

### 3. Build para Produção

```bash
cd dashboard
npm run build
```

O build será gerado em `dashboard/dist/`

## 📁 Estrutura do Projeto

```
Paygator_v2/
├── src/                    # Backend (APIs)
│   ├── routes/
│   ├── controllers/
│   └── services/
│
└── dashboard/              # Frontend React (NOVO)
    ├── src/
    │   ├── components/     # Componentes reutilizáveis
    │   │   ├── Layout.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── VendorB2CForm.tsx
    │   ├── contexts/       # Context API
    │   │   └── AuthContext.tsx
    │   ├── pages/          # Páginas principais
    │   │   ├── Dashboard.tsx
    │   │   ├── Payments.tsx
    │   │   ├── Orders.tsx
    │   │   ├── Logs.tsx
    │   │   └── Login.tsx
    │   ├── services/       # Serviços de API
    │   │   └── api.ts
    │   └── App.tsx
    ├── package.json
    └── vite.config.ts
```

## 🔌 APIs Consumidas

O dashboard consome as seguintes APIs:

### Estatísticas
- `GET /admin/api/stats` - Estatísticas do dashboard

### Pagamentos
- `GET /admin/api/payments` - Lista de pagamentos com filtros
- `POST /api/v1/payments/process-vendor-b2c` - Processar pagamento B2C ao vendor

### Autenticação
- `POST /admin/login` - Login
- `GET /admin/logout` - Logout

## 🎨 Funcionalidades

### ✅ Implementado

- [x] Login/Autenticação
- [x] Dashboard com estatísticas
- [x] Lista de pagamentos com filtros
- [x] Formulário B2C para pagar vendors
- [x] Layout responsivo com sidebar
- [x] Navegação entre páginas

### 🚧 Em Desenvolvimento

- [ ] Página de Pedidos
- [ ] Página de Logs
- [ ] Gráficos e visualizações
- [ ] Exportação de dados

## 🔧 Configuração

### Proxy de Desenvolvimento

O Vite está configurado para fazer proxy das requisições `/api` e `/admin/api` para o backend em `http://localhost:3000`.

### Variáveis de Ambiente

Crie um arquivo `.env` no diretório `dashboard/` se necessário:

```env
VITE_API_URL=http://localhost:3000
```

## 📦 Deploy

### Opção 1: Deploy Separado

1. Build do dashboard:
```bash
cd dashboard
npm run build
```

2. Servir os arquivos estáticos (ex: Nginx, Vercel, Netlify)

### Opção 2: Integrado com Backend

Você pode servir o build do React através do Express:

```typescript
// No backend
app.use(express.static('dashboard/dist'))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'))
})
```

## 🆚 Comparação: EJS vs React

| Aspecto | EJS (Antigo) | React (Novo) |
|---------|--------------|--------------|
| **Acoplamento** | Fortemente acoplado ao backend | Desacoplado |
| **Manutenção** | Mistura HTML/JS no servidor | Componentes organizados |
| **Performance** | Server-side rendering | Client-side com otimizações |
| **Escalabilidade** | Limitada | Alta (pode ser deployado separadamente) |
| **DX** | Básico | Moderno (HMR, TypeScript, etc) |

## 🔄 Migração

O dashboard EJS antigo ainda está disponível em `/admin/*`, mas o novo dashboard React está em `http://localhost:3001`.

Para migrar completamente:

1. Desenvolver todas as funcionalidades no React
2. Fazer build de produção
3. Servir através do Express ou deploy separado
4. Remover rotas EJS antigas (opcional)

## 📝 Próximos Passos

1. **Completar páginas**: Orders e Logs
2. **Adicionar gráficos**: Usar Recharts para visualizações
3. **Melhorar UX**: Loading states, error handling, toast notifications
4. **Testes**: Adicionar testes unitários e de integração
5. **CI/CD**: Configurar pipeline de deploy

