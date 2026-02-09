# PostgreSQL no Render (grupogo)

## External Database URL
Para usar a partir de fora do Render (local, outro host):

```
postgresql://grupogo_user:zqs4NguFv7p2dxMQ6qVkW9GW4GgkooWY@dpg-d652m4dum26s73birp60-a.oregon-postgres.render.com/grupogo
```

Esta URL deve estar em `.env` como `DATABASE_URL`. A API usa-a para logs (api_logs, payment_logs, auth_logs).

## Conexão com PSQL

### Opção 1: Render CLI (recomendado se usas Render)
```bash
render psql dpg-d652m4dum26s73birp60-a
```

### Opção 2: psql local
```bash
PGPASSWORD=zqs4NguFv7p2dxMQ6qVkW9GW4GgkooWY psql -h dpg-d652m4dum26s73birp60-a.oregon-postgres.render.com -U grupogo_user grupogo
```

### Inicializar schema (sem psql instalado)
```bash
node scripts/init-render-db.js
```

**Nota:** Não faças commit das credenciais. Mantém a password apenas em `.env` (que está no .gitignore).
