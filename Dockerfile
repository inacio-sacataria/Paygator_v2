# Etapa 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Dependências nativas (se necessário)
RUN apk add --no-cache python3 make g++

# Copie apenas os arquivos de dependência primeiro
COPY package*.json ./

# Instale TODAS as dependências (incluindo dev)
RUN npm ci

# Copie o restante do código
COPY . .

# Build do projeto
RUN npm run build

# Gere e exiba uma chave de API main no build
RUN node -e "console.log('main_' + require('crypto').randomBytes(32).toString('hex'))"

# Etapa 2: Produção
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copie apenas os arquivos necessários da etapa de build
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Instale apenas dependências de produção
RUN npm ci --only=production

# Crie diretório de logs
RUN mkdir -p logs

# Crie usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]