const mongoose = require('mongoose');

// Schema simplificado para o script
const PaymentSchema = new mongoose.Schema({
  order_id: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['BRL', 'USD', 'EUR'], default: 'BRL' },
  payment_method: { 
    type: String, 
    enum: ['credit_card', 'debit_card', 'pix', 'cash', 'online'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'approved', 'failed', 'cancelled', 'refunded'],
    default: 'pending' 
  },
  gateway: { type: String, required: true },
  gateway_transaction_id: String,
  installments: Number,
  card_brand: String,
  card_last_four: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'playfood_payments'
});

const Payment = mongoose.model('PlayfoodPayment', PaymentSchema);

// Dados de exemplo
const samplePayments = [
  {
    order_id: 'ORD-20241201-001',
    amount: 5175, // R$ 51.75
    currency: 'BRL',
    payment_method: 'credit_card',
    status: 'approved',
    gateway: 'paygator',
    gateway_transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9),
    card_brand: 'Visa',
    card_last_four: '4242',
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
  },
  {
    order_id: 'ORD-20241201-002',
    amount: 3250, // R$ 32.50
    currency: 'BRL',
    payment_method: 'pix',
    status: 'approved',
    gateway: 'paygator',
    gateway_transaction_id: 'pix_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  },
  {
    order_id: 'ORD-20241201-003',
    amount: 8900, // R$ 89.00
    currency: 'BRL',
    payment_method: 'debit_card',
    status: 'pending',
    gateway: 'paygator',
    card_brand: 'Mastercard',
    card_last_four: '1234',
    created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) // Últimos 3 dias
  },
  {
    order_id: 'ORD-20241201-004',
    amount: 12500, // R$ 125.00
    currency: 'BRL',
    payment_method: 'credit_card',
    status: 'failed',
    gateway: 'paygator',
    card_brand: 'Visa',
    card_last_four: '5678',
    created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
  },
  {
    order_id: 'ORD-20241201-005',
    amount: 6750, // R$ 67.50
    currency: 'BRL',
    payment_method: 'online',
    status: 'approved',
    gateway: 'paygator',
    gateway_transaction_id: 'online_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date() // Hoje
  },
  {
    order_id: 'ORD-20241201-006',
    amount: 4200, // R$ 42.00
    currency: 'BRL',
    payment_method: 'pix',
    status: 'approved',
    gateway: 'paygator',
    gateway_transaction_id: 'pix_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date() // Hoje
  },
  {
    order_id: 'ORD-20241201-007',
    amount: 15600, // R$ 156.00
    currency: 'BRL',
    payment_method: 'credit_card',
    status: 'refunded',
    gateway: 'paygator',
    gateway_transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9),
    card_brand: 'American Express',
    card_last_four: '9876',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
  },
  {
    order_id: 'ORD-20241201-008',
    amount: 2850, // R$ 28.50
    currency: 'BRL',
    payment_method: 'cash',
    status: 'approved',
    gateway: 'paygator',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 dia atrás
  },
  {
    order_id: 'ORD-20241201-009',
    amount: 9999, // R$ 99.99
    currency: 'BRL',
    payment_method: 'credit_card',
    status: 'cancelled',
    gateway: 'paygator',
    card_brand: 'Visa',
    card_last_four: '1111',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    order_id: 'ORD-20241201-010',
    amount: 7325, // R$ 73.25
    currency: 'BRL',
    payment_method: 'debit_card',
    status: 'approved',
    gateway: 'paygator',
    gateway_transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9),
    card_brand: 'Elo',
    card_last_four: '3333',
    created_at: new Date() // Hoje
  }
];

async function seedDatabase() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect('mongodb+srv://inaciosacataria:d0nt2025D0drugs@cluster.mongodb.net/paygator?retryWrites=true&w=majority');
    
    console.log('📦 Conectado ao MongoDB');
    
    // Limpar dados existentes
    await Payment.deleteMany({});
    console.log('🧹 Dados existentes removidos');
    
    // Inserir dados de exemplo
    await Payment.insertMany(samplePayments);
    console.log(`✅ ${samplePayments.length} pagamentos de exemplo inseridos`);
    
    // Verificar dados inseridos
    const count = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    console.log(`📊 Total de pagamentos: ${count}`);
    console.log(`💰 Valor total: R$ ${(totalAmount[0]?.total / 100 || 0).toLocaleString('pt-BR')}`);
    
    // Fechar connexão
    await mongoose.disconnect();
    console.log('✨ Banco de dados populado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    process.exit(1);
  }
}

seedDatabase(); 