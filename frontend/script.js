// Funções auxiliares
function exibirMensagem(texto, tipo) {
  let msg = document.querySelector('.mensagem');
  if (msg) msg.remove();
  msg = document.createElement('div');
  msg.textContent = texto;
  msg.className = `mensagem ${tipo}`;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}

function aplicarMascaraCPF(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;
  });
}

function aplicarMascaraTelefone(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
  });
}

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

async function inserirPaciente() {
  const nome = document.getElementById('nome').value.trim();
  const data_nasc = document.getElementById('data').value;
  let cpf = document.getElementById('cpf').value.trim();
  const tel = document.getElementById('tel').value.trim();

  if (!nome || !data_nasc || !cpf || !tel) {
    exibirMensagem('Todos os campos são obrigatórios.', 'erro');
    return;
  }

  const hoje = new Date().toISOString().split('T')[0];
  if (data_nasc > hoje) {
    exibirMensagem('Data de nascimento inválida.', 'erro');
    return;
  }

  cpf = cpf.replace(/[^\d]+/g, '');

    try {
    const res = await fetch('http://localhost:3000/api/pacientes', {  // Adicionado /api
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, data_nascimento: data_nasc, cpf, telefone: tel })
    });

    if (res.ok) {
      exibirMensagem('Paciente cadastrado com sucesso!', 'sucesso');
      listarPacientes();
      document.getElementById('nome').value = '';
      document.getElementById('data').value = '';
      document.getElementById('cpf').value = '';
      document.getElementById('tel').value = '';
    } else {
      exibirMensagem('Erro ao cadastrar paciente.', 'erro');
    }
  } catch (error) {
    exibirMensagem('Falha na conexão com o servidor.', 'erro');
  }
}

async function listarPacientes() {
  const res = await fetch('http://localhost:3000/api/pacientes'); 
  const data = await res.json();
  const lista = document.getElementById('lista');
  lista.innerHTML = '';
  data.forEach(p => {
    lista.innerHTML += `<li><strong>${p.nome}</strong> - ${p.cpf} - ${p.telefone} - ${p.data_nascimento} <button onclick="deletarPaciente(${p.id})">Excluir</button> <button onclick="preencherFormularioPaciente(${p.id}, '${p.nome}', '${p.data_nascimento}', '${p.cpf}', '${p.telefone}')">Editar</button></li>`;
  });
}

function preencherFormularioPaciente(id, nome, data_nascimento, cpf, telefone) {
  document.getElementById('nome').value = nome;
  document.getElementById('data').value = data_nascimento;
  document.getElementById('cpf').value = cpf;
  document.getElementById('tel').value = telefone;
  document.getElementById('pacienteId').value = id;
  mostrarTela('pacientes');
  // Altera o botão para atualizar
  const btnSalvar = document.getElementById('btnSalvarPaciente');
  if (btnSalvar) {
    btnSalvar.onclick = atualizarPaciente;
    btnSalvar.textContent = 'Atualizar';
  }
}

async function atualizarPaciente() {
  const id = document.getElementById('pacienteId').value;
  const nome = document.getElementById('nome').value.trim();
  const data_nasc = document.getElementById('data').value;
  let cpf = document.getElementById('cpf').value.trim();
  const tel = document.getElementById('tel').value.trim();

  if (!id || !nome || !data_nasc || !cpf || !tel) {
    exibirMensagem('Todos os campos são obrigatórios.', 'erro');
    return;
  }

  cpf = cpf.replace(/[^\d]+/g, '');

  try {
    const res = await fetch('http://localhost:3000/api/pacientes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nome, data_nascimento: data_nasc, cpf, telefone: tel })
    });
    const data = await res.json();
    if (res.ok) {
      exibirMensagem(data.mensagem || 'Paciente atualizado com sucesso!', 'sucesso');
      listarPacientes();
      document.getElementById('pacienteId').value = '';
      document.getElementById('nome').value = '';
      document.getElementById('data').value = '';
      document.getElementById('cpf').value = '';
      document.getElementById('tel').value = '';
    } else {
      exibirMensagem(data.erro || 'Erro ao atualizar paciente.', 'erro');
    }
  } catch (err) {
    exibirMensagem('Erro de conexão.', 'erro');
  }
}


async function deletarPaciente(id) {
  if (!confirm('Tem certeza que deseja excluir este paciente? Todos os dados vinculados serão removidos.')) return;
  try {
    const res = await fetch('http://localhost:3000/api/pacientes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (res.ok) {
      exibirMensagem(data.mensagem || 'Paciente excluído com sucesso!', 'sucesso');
      listarPacientes();
      listarConsultas();
      listarProntuarios();
    } else {
      exibirMensagem(data.erro || 'Erro ao excluir paciente.', 'erro');
    }
  } catch (err) {
    exibirMensagem('Erro de conexão.', 'erro');
  }
}

async function carregarSelects() {
  const [resPacientes, resMedicos] = await Promise.all([
    fetch('http://localhost:3000/api/pacientes'),
    fetch('http://localhost:3000/api/medicos')
  ]);

  const pacientes = await resPacientes.json();
  const medicos = await resMedicos.json();

  const selPacConsulta = document.getElementById('pacienteConsulta');
  const selPacPront = document.getElementById('pacienteProntuario');
  const selMed = document.getElementById('medicoConsulta');

  pacientes.forEach(p => {
    const op1 = new Option(p.nome, p.id);
    const op2 = new Option(p.nome, p.id);
    selPacConsulta.add(op1);
    selPacPront.add(op2);
  });

  medicos.forEach(m => {
    const op = new Option(m.nome + ' - ' + m.especialidade, m.id);
    selMed.add(op);
  });
}

async function inserirConsulta() {
  const paciente_id = document.getElementById('pacienteConsulta').value;
  const medico_id = document.getElementById('medicoConsulta').value;
  const data = document.getElementById('dataConsulta').value;
  const valor = document.getElementById('valorConsulta').value;

  console.log('Dados do formulário:', { paciente_id, medico_id, data, valor }); // Log dos dados

  try {
    const res = await fetch('http://localhost:3000/api/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paciente_id: parseInt(paciente_id),
        medico_id: parseInt(medico_id),
        data_consulta: data,
        valor: parseFloat(valor)
      })
    });

    const dataRes = await res.json();
    console.log('Resposta da API:', dataRes); // Log da resposta

    if (!res.ok) throw new Error(dataRes.erro || 'Erro desconhecido');

    exibirMensagem('Consulta registrada!', 'sucesso');
    await listarConsultas(); // Força atualização
    
    // Limpa os campos
    document.getElementById('dataConsulta').value = '';
    document.getElementById('valorConsulta').value = '';
    
  } catch (err) {
    console.error('Erro completo:', err);
    exibirMensagem(err.message, 'erro');
  }
}

async function listarConsultas() {
  try {
    const res = await fetch('http://localhost:3000/api/consultas');
    if (!res.ok) throw new Error('Erro ao carregar consultas');
    const consultas = await res.json();
    const lista = document.getElementById('listaConsultas');
    lista.innerHTML = '';
    
    consultas.forEach(c => {
      console.log(c.valor)
      lista.innerHTML += `
        <li>
          ${c.data_consulta} - 
          ${c.nome_paciente} com Dr. ${c.nome_medico} 
          (${c.especialidade}) - 
          R$ ${c.valor ? parseFloat(c.valor).toFixed(2) : '0,00'}
        </li>`;
    });
  } catch (err) {
    console.error('Erro:', err);
    exibirMensagem(err.message, 'erro');
  }
}

async function inserirProntuario() {
  const paciente_id = document.getElementById('pacienteProntuario').value;
  const descricao = document.getElementById('descricaoProntuario').value.trim();

  if (!paciente_id || !descricao) {
    exibirMensagem('Informe paciente e descrição.', 'erro');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/prontuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paciente_id, descricao })
    });

    if (res.ok) {
      exibirMensagem('Prontuário registrado!', 'sucesso');
      listarProntuarios();
    } else {
      exibirMensagem('Erro ao registrar prontuário.', 'erro');
    }
  } catch (err) {
    exibirMensagem('Erro de conexão.', 'erro');
  }
}

async function listarProntuarios() {
  const res = await fetch('http://localhost:3000/api/prontuarios');
  const prontuarios = await res.json();
  const lista = document.getElementById('listaProntuarios');
  lista.innerHTML = '';
  prontuarios.forEach(p => {
    lista.innerHTML += `<li><strong>${p.nome_paciente}</strong>: ${p.descricao} (${p.data_atendimento})</li>`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarMascaraCPF(document.getElementById('cpf'));
  aplicarMascaraTelefone(document.getElementById('tel'));
  listarPacientes();
  listarConsultas();
  listarProntuarios();
  carregarSelects();
  // Configura o botão para inserir por padrão
  const btnSalvar = document.getElementById('btnSalvarPaciente');
  if (btnSalvar) {
    btnSalvar.onclick = function() {
      const id = document.getElementById('pacienteId').value;
      if (id) {
        atualizarPaciente();
      } else {
        inserirPaciente();
      }
    };
    btnSalvar.textContent = 'Salvar';
  }
});
