const { Client } = require('pg');
const fs = require('fs');

console.log('🔄 Migração para PostgreSQL do Render');
console.log('=====================================');

// Configuração do Supabase (origem)
const supabaseConfig = {
  host: 'db.llrcdfutvjrrccgytbjh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '.7K8.PfQWJH@#-d',
  ssl: {
    rejectUnauthorized: false
  }
};

// Configuração do Render PostgreSQL (destino)
const renderConfig = {
  host: process.env.RENDER_POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.RENDER_POSTGRES_PORT || '5432', 10),
  database: process.env.RENDER_POSTGRES_DB || 'paygator',
  user: process.env.RENDER_POSTGRES_USER || 'paygator_user',
  password: process.env.RENDER_POSTGRES_PASSWORD || 'postgres123',
  ssl: {
    rejectUnauthorized: false
  }
};

async function migrateData() {
  const supabaseClient = new Client(supabaseConfig);
  const renderClient = new Client(renderConfig);

  try {
    console.log('📡 Conectando ao Supabase...');
    await supabaseClient.connect();
    console.log('✅ Conectado ao Supabase');

    console.log('📡 Conectando ao Render PostgreSQL...');
    await renderClient.connect();
    console.log('✅ Conectado ao Render PostgreSQL');

    // Migrar tabelas
    const tables = [
      { name: 'payments', query: 'SELECT * FROM payments' },
      { name: 'api_logs', query: 'SELECT * FROM api_logs' },
      { name: 'payment_logs', query: 'SELECT * FROM payment_logs' },
      { name: 'auth_logs', query: 'SELECT * FROM auth_logs' }
    ];

    for (const table of tables) {
      console.log(`\n📊 Migrando tabela: ${table.name}`);
      
      try {
        // Verificar se tabela existe no Supabase
        const checkResult = await supabaseClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${table.name}'
          );
        `);
        
        if (!checkResult.rows[0].exists) {
          console.log(`⚠️  Tabela ${table.name} não existe no Supabase`);
          continue;
        }

        // Contar registros
        const countResult = await supabaseClient.query(`SELECT COUNT(*) FROM ${table.name}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`📈 ${count} registros encontrados`);

        if (count === 0) {
          console.log(`ℹ️  Tabela ${table.name} está vazia`);
          continue;
        }

        // Buscar dados
        const dataResult = await supabaseClient.query(table.query);
        const data = dataResult.rows;
        console.log(`📥 ${data.length} registros carregados`);

        // Inserir no Render PostgreSQL
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
          const insertQuery = `
            INSERT INTO ${table.name} (${columns.join(', ')}) 
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;

          let inserted = 0;
          for (const row of data) {
            try {
              const values = columns.map(col => row[col]);
              await renderClient.query(insertQuery, values);
              inserted++;
            } catch (error) {
              console.log(`⚠️  Erro ao inserir registro: ${error.message}`);
            }
          }
          console.log(`✅ ${inserted} registros migrados`);
        }

      } catch (error) {
        console.log(`❌ Erro ao migrar ${table.name}: ${error.message}`);
      }
    }

    console.log('\n🎉 Migração concluída!');
    
    // Mostrar estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    for (const table of tables) {
      try {
        const result = await renderClient.query(`SELECT COUNT(*) FROM ${table.name}`);
        console.log(`📈 ${table.name}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ ${table.name}: erro ao contar`);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
  } finally {
    await supabaseClient.end();
    await renderClient.end();
  }
}

// Função para testar conexões
async function testConnections() {
  console.log('🧪 Testando conexões...\n');

  // Testar Supabase
  const supabaseClient = new Client(supabaseConfig);
  try {
    await supabaseClient.connect();
    const result = await supabaseClient.query('SELECT NOW() as time, COUNT(*) as total FROM payments');
    console.log('✅ Supabase:', {
      time: result.rows[0].time,
      payments: result.rows[0].total
    });
  } catch (error) {
    console.log('❌ Supabase:', error.message);
  } finally {
    await supabaseClient.end();
  }

  // Testar Render PostgreSQL
  const renderClient = new Client(renderConfig);
  try {
    await renderClient.connect();
    const result = await renderClient.query('SELECT NOW() as time, COUNT(*) as total FROM payments');
    console.log('✅ Render PostgreSQL:', {
      time: result.rows[0].time,
      payments: result.rows[0].total
    });
  } catch (error) {
    console.log('❌ Render PostgreSQL:', error.message);
  } finally {
    await renderClient.end();
  }
}

// Executar baseado no argumento
const command = process.argv[2];

if (command === 'test') {
  testConnections();
} else {
  migrateData();
} 