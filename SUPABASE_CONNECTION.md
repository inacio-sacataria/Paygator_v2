# Conexão Supabase (projeto rpngvbwrrewforclansy)

## IPv4 vs IPv6

O host **direct** do Supabase (`db.rpngvbwrrewforclansy.supabase.co`) **não tem IPv4** — só **IPv6**.  
Se a tua rede não suportar IPv6, vais ter `EHOSTUNREACH`.  

**Solução:** usar a connection string do **pooler** (Session mode). O pooler tem IPv4.

| Tipo | Host | IPv4? |
|------|------|--------|
| Direct | `db.rpngvbwrrewforclansy.supabase.co` | ❌ Não (só IPv6) |
| **Pooler (Session mode)** | `xxx.pooler.supabase.com` | ✅ Sim |

## Usar connection string do pooler (recomendado)

1. **Supabase Dashboard** → teu projeto → **Project Settings** → **Database**.
2. Em **Connection string** escolhe **"Session mode"** (Connection pooling).
3. Copia a URI (host do tipo `aws-0-xx.pooler.supabase.com`).
4. No `.env` define **`DATABASE_URL`** com essa URI.

Exemplo:
```env
DATABASE_URL=postgresql://postgres.rpngvbwrrewforclansy:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

## URLs e chaves

| Variável | Valor |
|----------|--------|
| **Project URL** | https://rpngvbwrrewforclansy.supabase.co |
| **Direct (só IPv6)** | postgresql://postgres:[PASSWORD]@db.rpngvbwrrewforclansy.supabase.co:5432/postgres |
| **Pooler (IPv4)** | Obter em Database → Connection string → Session mode |

## O que falta no `.env`

1. **Password da base de dados**
   - No Supabase: **Project Settings** (ícone engrenagem) → **Database** → **Database password**.
   - Se não lembras da password, usa **Reset database password** e cola a nova no `.env`:
   - `SUPABASE_PASSWORD=tua_password_aqui`
   - Ou preenche a connection string completa:  
     `DATABASE_URL=postgresql://postgres:tua_password@db.rpngvbwrrewforclansy.supabase.co:5432/postgres`

2. **Anon key (se der erro de auth)**
   - No dashboard: **Project Settings** → **API** → **Project API keys** → **anon public**.
   - Se a chave for um JWT longo (começa com `eyJ...`), usa essa em vez da publishable:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`

## Testar conexão

```bash
npm run test-db
```

(Com `DATABASE_URL` vazia, o script usa `SUPABASE_HOST` + `SUPABASE_PASSWORD`. Garante que `SUPABASE_PASSWORD` está definida.)

## Criar tabelas no Supabase (se for a primeira vez)

O projeto usa as tabelas: `payments`, `api_logs`, `payment_logs`, `auth_logs`.

Com a password no `.env`, podes criar o schema com:

```bash
# Usa SUPABASE_* ou DATABASE_URL do .env
node scripts/init-render-db.js
```

(O script `init-render-db.js` lê `DATABASE_URL`. Se estiveres a usar só `SUPABASE_*`, define temporariamente  
`DATABASE_URL=postgresql://postgres:TUAPASSWORD@db.rpngvbwrrewforclansy.supabase.co:5432/postgres`  
e corre o script.)
