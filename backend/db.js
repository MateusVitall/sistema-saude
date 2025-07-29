const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistema_saude',
  password: 'mateusdb',
  port: 5432,
});

module.exports = pool;
