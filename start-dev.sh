#!/bin/bash

# Script para iniciar Backend e Dashboard React

echo "🚀 Iniciando Paygator Backend e Dashboard..."

# Verificar se o dashboard tem node_modules
if [ ! -d "dashboard/node_modules" ]; then
    echo "📦 Instalando dependências do dashboard..."
    cd dashboard
    npm install
    cd ..
fi

# Iniciar Backend em background
echo "🔧 Iniciando Backend na porta 3000..."
npm run dev &
BACKEND_PID=$!

# Aguardar um pouco antes de iniciar o dashboard
sleep 3

# Iniciar Dashboard React em background
echo "⚛️  Iniciando Dashboard React na porta 3001..."
cd dashboard
npm run dev &
DASHBOARD_PID=$!
cd ..

echo ""
echo "✅ Ambos os servidores foram iniciados!"
echo "   Backend:    http://localhost:3000"
echo "   Dashboard:  http://localhost:3001"
echo ""
echo "PIDs: Backend=$BACKEND_PID, Dashboard=$DASHBOARD_PID"
echo "Pressione Ctrl+C para parar ambos os servidores"

# Aguardar e limpar processos ao sair
trap "kill $BACKEND_PID $DASHBOARD_PID 2>/dev/null; exit" INT TERM
wait

