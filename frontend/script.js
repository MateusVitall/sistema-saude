
// Funções auxiliares
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

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
  if (!validarCPF(cpf)) {
    exibirMensagem('CPF inválido.', 'erro');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/pacientes', {
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
  const res = await fetch('http://localhost:3000/pacientes');
  const data = await res.json();
  const lista = document.getElementById('lista');
  lista.innerHTML = '';
  data.forEach(p => {
    lista.innerHTML += `<li><strong>${p.nome}</strong> - ${p.cpf} - ${p.telefone} - ${p.data_nascimento}</li>`;
  });
}

async function carregarSelects() {
  const [resPacientes, resMedicos] = await Promise.all([
    fetch('http://localhost:3000/pacientes'),
    fetch('http://localhost:3000/medicos')
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
  const valor = parseFloat(document.getElementById('valorConsulta').value);

  if (!paciente_id || !medico_id || !data || isNaN(valor)) {
    exibirMensagem('Preencha todos os campos da consulta.', 'erro');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paciente_id, medico_id, data_consulta: data, valor })
    });

    if (res.ok) {
      exibirMensagem('Consulta registrada com sucesso!', 'sucesso');
      listarConsultas();
    } else {
      exibirMensagem('Erro ao registrar consulta.', 'erro');
    }
  } catch (err) {
    exibirMensagem('Erro de conexão.', 'erro');
  }
}

async function listarConsultas() {
  const res = await fetch('http://localhost:3000/consultas');
  const consultas = await res.json();
  const lista = document.getElementById('listaConsultas');
  lista.innerHTML = '';
  consultas.forEach(c => {
    lista.innerHTML += `<li>${c.nome_paciente} com ${c.nome_medico} (${c.especialidade}) - R$ ${c.valor.toFixed(2)}</li>`;
  });
}

async function inserirProntuario() {
  const paciente_id = document.getElementById('pacienteProntuario').value;
  const descricao = document.getElementById('descricaoProntuario').value.trim();

  if (!paciente_id || !descricao) {
    exibirMensagem('Informe paciente e descrição.', 'erro');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/prontuarios', {
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
  const res = await fetch('http://localhost:3000/prontuarios');
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
});
