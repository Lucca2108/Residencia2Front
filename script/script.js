const API_BASE_URL = 'http://localhost:8000';

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function trocarTela() {
  const valor = document.getElementById('checkboxtransacoes').value;
  const telas = ['dashboard', 'adicionarModal', 'analisarModal', 'deletarModal'];

  telas.forEach((tela) => {
    document.getElementById(tela).classList.add('hidden');
  });

  document.getElementById(valor).classList.remove('hidden');
  document.getElementById('tituloLateral').innerText =
    document.getElementById('checkboxtransacoes').options[
      document.getElementById('checkboxtransacoes').selectedIndex
    ].text;
}

function enviarMensagem() {
  const modalEl = document.getElementById('modalConfirmacao');
  if (!modalEl || typeof bootstrap === 'undefined') {
    alert('Mensagem enviada.');
    return;
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function valorOuNull(selector) {
  const el = document.querySelector(selector);
  return el && el.value !== '' ? el.value : null;
}

function montarPayload(prefix) {
  return {
    valor: Number(valorOuNull(`.${prefix}-valor`)),
    data: valorOuNull(`.${prefix}-data`),
    hora: valorOuNull(`.${prefix}-hora`),
    conta: valorOuNull(`.${prefix}-conta`),
    pais: valorOuNull(`.${prefix}-pais`),
    tipo_transacao: valorOuNull(`.${prefix}-tipoTransacao`),
    dispositivo: valorOuNull(`.${prefix}-dispositivo`),
    tentativas: valorOuNull(`.${prefix}-tentativas`) !== null ? Number(valorOuNull(`.${prefix}-tentativas`)) : null,
    categoria: valorOuNull(`.${prefix}-categoria`),
    cidade: valorOuNull(`.${prefix}-cidade`),
    estado: valorOuNull(`.${prefix}-estado`),
    estabelecimento: valorOuNull(`.${prefix}-estabelecimento`),
    dia_semana: valorOuNull(`.${prefix}-diaSemana`),
    latitude: valorOuNull(`.${prefix}-latitude`) !== null ? Number(valorOuNull(`.${prefix}-latitude`)) : null,
    longitude: valorOuNull(`.${prefix}-longitude`) !== null ? Number(valorOuNull(`.${prefix}-longitude`)) : null,
    ip_origem: valorOuNull(`.${prefix}-ipOrigem`),
  };
}

function preencherExemplo() {
  const campos = {
    '.campo-valor': '120.5',
    '.campo-data': '2026-05-18',
    '.campo-hora': '14:30',
    '.campo-diaSemana': 'segunda-feira',
    '.campo-categoria': 'alimentacao',
    '.campo-conta': '12345-6',
    '.campo-cidade': 'Fortaleza',
    '.campo-estado': 'CE',
    '.campo-pais': 'Brasil',
    '.campo-latitude': '-3.731862',
    '.campo-longitude': '-38.52667',
    '.campo-tipoTransacao': 'debito',
    '.campo-dispositivo': 'android',
    '.campo-estabelecimento': 'Mercado Central',
    '.campo-tentativas': '1',
    '.campo-ipOrigem': '192.168.0.10',
    '.analise-valor': '120.5',
    '.analise-data': '2026-05-18',
    '.analise-hora': '14:30',
    '.analise-conta': '12345-6',
    '.analise-pais': 'Brasil',
    '.analise-tipoTransacao': 'debito',
    '.analise-dispositivo': 'android',
    '.analise-tentativas': '1',
    '.analise-categoria': 'alimentacao',
    '.analise-cidade': 'Fortaleza',
    '.analise-estado': 'CE',
    '.analise-estabelecimento': 'Mercado Central',
    '.analise-diaSemana': 'segunda-feira',
    '.analise-latitude': '-3.731862',
    '.analise-longitude': '-38.52667',
    '.analise-ipOrigem': '192.168.0.10',
  };

  Object.entries(campos).forEach(([selector, value]) => {
    const el = document.querySelector(selector);
    if (el) el.value = value;
  });
}

async function analisarTransacao() {
  const payload = montarPayload('analise');
  const resposta = await fetch(`${API_BASE_URL}/analisar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valor: payload.valor,
      data: payload.data,
      hora: payload.hora,
      conta: payload.conta,
      pais: payload.pais,
      tipo_transacao: payload.tipo_transacao,
      dispositivo: payload.dispositivo,
      tentativas: payload.tentativas,
      categoria: payload.categoria,
      cidade: payload.cidade,
      estado: payload.estado,
      estabelecimento: payload.estabelecimento,
      dia_semana: payload.dia_semana,
      latitude: payload.latitude,
      longitude: payload.longitude,
      ip_origem: payload.ip_origem,
    }),
  });

  const dados = await resposta.json();
  const box = document.getElementById('resultadoAnalise');
  box.classList.remove('hidden');
  box.innerHTML = `
    <strong>Resultado da análise</strong><br>
    Fraude: ${dados.is_fraude ? 'sim' : 'não'}<br>
    Risco: ${dados.classificacao_risco ?? '-'}<br>
    Decisão: ${dados.decisao ?? '-'}<br>
    Motivos: ${(dados.motivos || []).length ? dados.motivos.join(', ') : 'nenhum'}
  `;
}

async function analisarESalvar() {
  const payload = montarPayload('campo');

  const analise = await fetch(`${API_BASE_URL}/analisar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valor: payload.valor,
      data: payload.data,
      hora: payload.hora,
      conta: payload.conta,
      pais: payload.pais,
      tipo_transacao: payload.tipo_transacao,
      dispositivo: payload.dispositivo,
      tentativas: payload.tentativas,
      categoria: payload.categoria,
      cidade: payload.cidade,
      estado: payload.estado,
      estabelecimento: payload.estabelecimento,
      dia_semana: payload.dia_semana,
      latitude: payload.latitude,
      longitude: payload.longitude,
      ip_origem: payload.ip_origem,
    }),
  });

  const analiseJson = await analise.json();
  const salvar = confirm(`Análise concluída: ${analiseJson.decisao ?? 'normal'}. Deseja salvar a transação?`);
  if (!salvar) return;

  const criar = await fetch(`${API_BASE_URL}/transacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!criar.ok) {
    alert('Não foi possível salvar a transação.');
    return;
  }

  alert('Transação salva com sucesso.');
}

async function excluirTransacao() {
  const deleteId = document.getElementById('deleteId')?.value;
  const resposta = await fetch(`${API_BASE_URL}/transacoes/${deleteId}`, {
    method: 'DELETE',
  });

  if (resposta.status === 204) {
    alert('Transação excluída com sucesso!');
    return;
  }

  alert('Erro ao excluir transação.');
}

new Chart(document.getElementById('graficoCategorias'), {
  type: 'bar',
  data: {
    labels: ['Eletrônicos', 'Lazer', 'Alimentação', 'Moradia'],
    datasets: [{ label: 'Valores', data: [10518, 450, 213, 5277], borderWidth: 1 }],
  },
});

new Chart(document.getElementById('graficoFraudes'), {
  type: 'doughnut',
  data: {
    labels: ['Normais', 'Fraudes'],
    datasets: [{ data: [2, 8] }],
  },
});

new Chart(document.getElementById('graficoLinha'), {
  type: 'line',
  data: {
    labels: ['00h', '02h', '04h', '06h', '08h', '10h'],
    datasets: [{ label: 'Valor Transacionado', data: [2500, 8000, 900, 5300, 450, 95], tension: 0.4 }],
  },
});
