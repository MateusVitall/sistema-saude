const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes');

app.use(cors());
app.use(express.json());

// Prefixo /api para todas as rotas
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}/api`)
);
