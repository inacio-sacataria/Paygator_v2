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

# Etapa 2: Produção
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copie apenas os arquivos necessários da etapa de build
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist

# Instale apenas dependências de produção
RUN npm ci --only=production

# Crie diretório de logs
RUN mkdir -p logs

# Crie usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]