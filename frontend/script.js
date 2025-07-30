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
  const msg = document.createElement('div');
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

async function inserirPaciente() {
  const nome = document.getElementById('nome').value.trim();
  const data_nasc = document.getElementById('data').value;
  let cpf = document.getElementById('cpf').value.trim(); // Use let para reatribuir
  const tel = document.getElementById('tel').value.trim();

  if (!nome || !data_nasc || !cpf || !tel) {
    exibirMensagem('Todos os campos são obrigatórios.', 'erro');
    return;
  }

  // Remove caracteres não numéricos antes de validar
  cpf = cpf.replace(/[^\d]+/g, ''); 

  if (!validarCPF(cpf)) {
    exibirMensagem('CPF inválido.', 'erro');
    return;
  }

  // ... (o restante da sua função inserirPaciente permanece o mesmo)
  try {
    const res = await fetch('http://localhost:3000/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        data_nascimento: data_nasc,
        cpf, // Aqui o CPF já está sem máscara
        telefone: tel
      })
    });

    if (res.ok) {
      exibirMensagem('Paciente cadastrado com sucesso!', 'sucesso');
      listarPacientes();
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
    lista.innerHTML += `<li>${p.nome} - ${p.cpf}</li>`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarMascaraCPF(document.getElementById('cpf'));
  aplicarMascaraTelefone(document.getElementById('tel'));
  listarPacientes();
});
