const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistema_saude',
  password: 'mateusdb',
  port: 5432,
});

// Testar a conexão imediatamente ao iniciar
pool.connect()
  .then(client => {
    console.log('Conectado ao banco de dados PostgreSQL com sucesso!');
    client.release(); // libera o cliente de volta para o pool
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
  });

module.exports = pool;