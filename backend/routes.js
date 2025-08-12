const express = require('express');
const router = express.Router();
const pool = require('./db');

// ==========================
// PACIENTES
// ==========================

// 1.1 Listar todos os pacientes (GET /pacientes)
router.get('/pacientes', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pacientes ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar pacientes:', err);
    res.status(500).json({ erro: 'Erro ao buscar pacientes.' });
  }
});

// 1.2 Inserir paciente (POST /pacientes)
router.post('/pacientes', async (req, res) => {
  const { nome, data_nascimento, cpf, telefone } = req.body;
  try {
    await pool.query('CALL inserir_paciente($1, $2, $3, $4)', [
      nome,
      data_nascimento,
      cpf,
      telefone,
    ]);
    res.status(201).json({ mensagem: 'Paciente inserido com sucesso!' });
  } catch (err) {
    console.error('Erro ao inserir paciente:', err);
    if (err.code === '23505') {
      // Unique_violation (CPF duplicado)
      return res.status(400).json({ erro: 'CPF já cadastrado.' });
    }
    res.status(500).json({ erro: 'Erro ao inserir paciente.' });
  }
});


router.put('/pacientes', async (req, res) => {
  const { id, nome, data_nascimento, cpf, telefone } = req.body;
  if (!id || !nome || !data_nascimento || !cpf || !telefone) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }
  try {
    // Remove formatação do CPF antes de salvar
    const cpfLimpo = cpf.replace(/[^\d]+/g, '');
    
    // Verifica se já existe outro paciente com este CPF
    const cpfCheck = await pool.query('SELECT id FROM pacientes WHERE cpf = $1 AND id != $2', [cpfLimpo, id]);
    if (cpfCheck.rows.length > 0) {
      return res.status(400).json({ erro: 'CPF já cadastrado para outro paciente.' });
    }
    
    // Atualiza o paciente
    const result = await pool.query(
      'UPDATE pacientes SET nome = $1, data_nascimento = $2, cpf = $3, telefone = $4 WHERE id = $5 RETURNING *',
      [nome, data_nascimento, cpfLimpo, telefone, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }
    
    res.json({ mensagem: 'Paciente atualizado com sucesso!', paciente: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err);
    res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
    res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
  }
});

router.delete('/pacientes', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ erro: 'ID do paciente é obrigatório.' });
  }
  try {
    // Exclui consultas vinculadas ao paciente
    await pool.query('DELETE FROM consultas WHERE paciente_id = $1', [id]);
    // Exclui prontuários vinculados ao paciente
    await pool.query('DELETE FROM prontuarios WHERE paciente_id = $1', [id]);
    // Exclui o paciente
    const result = await pool.query('DELETE FROM pacientes WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }
    res.json({ mensagem: 'Paciente excluído com sucesso!', paciente: result.rows[0] });
  } catch (err) {
    console.error('Erro ao excluir paciente:', err);
    res.status(500).json({ erro: 'Erro ao excluir paciente.' });
  }
})
// ==========================
// MÉDICOS
// ==========================

// 2.1 Listar médicos (GET /medicos)
router.get('/medicos', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar médicos:', err);
    res.status(500).json({ erro: 'Erro ao buscar médicos.' });
  }
});

// ==========================
// CONSULTAS
// ==========================

// 3.1 Listar consultas (GET /consultas)
// Retorna JOIN com paciente e médico para exibição
router.get('/consultas', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.data_consulta, c.valor,
             p.nome AS nome_paciente,
             m.nome AS nome_medico, m.especialidade
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      JOIN medicos m ON c.medico_id = m.id
      ORDER BY c.data_consulta DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar consultas:', err);
    res.status(500).json({ erro: 'Erro ao buscar consultas.' });
  }
});

// 3.2 Inserir consulta (POST /consultas)
router.post('/consultas', async (req, res) => {
  console.log('[DEBUG] Dados recebidos:', req.body); // Log para depuração
  
  const { paciente_id, medico_id, data_consulta, valor } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO consultas (paciente_id, medico_id, data_consulta, valor) VALUES ($1, $2, $3, $4) RETURNING *',
      [paciente_id, medico_id, data_consulta, valor]
    );
    
    console.log('[DEBUG] Consulta inserida:', result.rows[0]); // Log da inserção
    res.status(201).json(result.rows[0]);
    
  } catch (err) {
    console.error('[ERRO] Falha ao inserir:', err);
    res.status(500).json({ 
      erro: 'Erro ao inserir consulta',
      detalhes: err.message 
    });
  }
});

// ==========================
// PRONTUÁRIOS
// ==========================

// 4.1 Listar prontuários (GET /prontuarios)
router.get('/prontuarios', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.id,
             pr.paciente_id,
             p.nome AS nome_paciente,
             pr.data_atendimento,
             pr.descricao
      FROM prontuarios pr
      JOIN pacientes p ON pr.paciente_id = p.id
      ORDER BY pr.data_atendimento DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar prontuários:', err);
    res.status(500).json({ erro: 'Erro ao buscar prontuários.' });
  }
});

// 4.2 Inserir prontuário (POST /prontuarios)
router.post('/prontuarios', async (req, res) => {
  const { paciente_id, descricao } = req.body;
  try {
    await pool.query(
      'INSERT INTO prontuarios (paciente_id, descricao) VALUES ($1, $2)',
      [paciente_id, descricao]
    );
    res.status(201).json({ mensagem: 'Prontuário registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao inserir prontuário:', err);
    res.status(500).json({ erro: 'Erro ao inserir prontuário.' });
  }
});

// ==========================
// ATENDIMENTOS POR CPF
// ==========================

// 5.1 Quantidade de atendimentos (GET /atendimentos/:cpf)
router.get('/atendimentos/:cpf', async (req, res) => {
  const { cpf } = req.params;
  try {
    const resultado = await pool.query(
      'SELECT quantidade_atendimentos_por_cpf($1) AS total',
      [cpf]
    );
    res.json({ cpf, total: resultado.rows[0].total });
  } catch (err) {
    console.error('Erro ao buscar atendimentos:', err);
    res.status(500).json({ erro: 'Erro ao buscar atendimentos.' });
  }
});

module.exports = router;
