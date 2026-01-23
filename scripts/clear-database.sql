-- Script SQL para limpar todos os dados do banco de dados
-- Execute este script diretamente no Supabase SQL Editor ou via psql
-- ATENÇÃO: Este script irá DELETAR TODOS OS DADOS!

-- Limpar todas as tabelas (mantém a estrutura)
TRUNCATE TABLE payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE playfood_orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE playfood_payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE webhook_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE api_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE payment_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE auth_logs RESTART IDENTITY CASCADE;

-- Verificar se todas as tabelas estão vazias
SELECT 
  'payments' as table_name, 
  COUNT(*) as record_count 
FROM payments
UNION ALL
SELECT 
  'playfood_orders' as table_name, 
  COUNT(*) as record_count 
FROM playfood_orders
UNION ALL
SELECT 
  'playfood_payments' as table_name, 
  COUNT(*) as record_count 
FROM playfood_payments
UNION ALL
SELECT 
  'webhook_logs' as table_name, 
  COUNT(*) as record_count 
FROM webhook_logs
UNION ALL
SELECT 
  'api_logs' as table_name, 
  COUNT(*) as record_count 
FROM api_logs
UNION ALL
SELECT 
  'payment_logs' as table_name, 
  COUNT(*) as record_count 
FROM payment_logs
UNION ALL
SELECT 
  'auth_logs' as table_name, 
  COUNT(*) as record_count 
FROM auth_logs;

