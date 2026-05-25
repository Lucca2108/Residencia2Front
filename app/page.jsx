'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const API_BASE_URL = '/api/backend';

const DASHBOARD_CATEGORIES = ['EletrÃ´nicos', 'Lazer', 'AlimentaÃ§Ã£o', 'Moradia'];
const DASHBOARD_VALUES = [10518, 450, 213, 5277];
const FRAUD_LABELS = ['Normais', 'Fraudes'];
const FRAUD_VALUES = [2, 8];
const TIME_LABELS = ['00h', '02h', '04h', '06h', '08h', '10h'];
const TIME_VALUES = [2500, 8000, 900, 5300, 450, 95];

const FORM_FIELDS = [
  ['valor', 'number', 'Valor', '0.01'],
  ['data', 'date', 'Data'],
  ['hora', 'time', 'Hora'],
  ['dia_semana', 'text', 'Dia da semana'],
  ['categoria', 'text', 'Categoria'],
  ['conta', 'text', 'Conta'],
  ['cidade', 'text', 'Cidade'],
  ['estado', 'text', 'Estado'],
  ['pais', 'text', 'PaÃ­s'],
  ['latitude', 'number', 'Latitude', 'any'],
  ['longitude', 'number', 'Longitude', 'any'],
  ['tipo_transacao', 'text', 'Tipo da transaÃ§Ã£o'],
  ['dispositivo', 'text', 'Dispositivo'],
  ['estabelecimento', 'text', 'Estabelecimento'],
  ['tentativas', 'number', 'Tentativas'],
  ['ip_origem', 'text', 'IP de origem'],
];

const ANALYSIS_FIELDS = [
  ['valor', 'number', 'Valor', '0.01'],
  ['data', 'date', 'Data'],
  ['hora', 'time', 'Hora'],
  ['conta', 'text', 'Conta'],
  ['pais', 'text', 'PaÃ­s'],
  ['tipo_transacao', 'text', 'Tipo da transaÃ§Ã£o'],
  ['dispositivo', 'text', 'Dispositivo'],
  ['tentativas', 'number', 'Tentativas'],
  ['categoria', 'text', 'Categoria'],
  ['cidade', 'text', 'Cidade'],
  ['estado', 'text', 'Estado'],
  ['estabelecimento', 'text', 'Estabelecimento'],
  ['dia_semana', 'text', 'Dia da semana'],
  ['latitude', 'number', 'Latitude', 'any'],
  ['longitude', 'number', 'Longitude', 'any'],
  ['ip_origem', 'text', 'IP de origem'],
];

function emptyForm() {
  return {
    valor: '',
    data: '',
    hora: '',
    dia_semana: '',
    categoria: '',
    conta: '',
    cidade: '',
    estado: '',
    pais: '',
    latitude: '',
    longitude: '',
    tipo_transacao: '',
    dispositivo: '',
    estabelecimento: '',
    tentativas: '',
    ip_origem: '',
  };
}

function toNumberOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toTextOrUndefined(value) {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  return trimmed ? trimmed : undefined;
}

function buildPayload(form) {
  return {
    valor: toNumberOrUndefined(form.valor),
    data: toTextOrUndefined(form.data),
    hora: toTextOrUndefined(form.hora),
    dia_semana: toTextOrUndefined(form.dia_semana),
    categoria: toTextOrUndefined(form.categoria),
    conta: toTextOrUndefined(form.conta),
    cidade: toTextOrUndefined(form.cidade),
    estado: toTextOrUndefined(form.estado),
    pais: toTextOrUndefined(form.pais),
    latitude: toNumberOrUndefined(form.latitude),
    longitude: toNumberOrUndefined(form.longitude),
    tipo_transacao: toTextOrUndefined(form.tipo_transacao),
    dispositivo: toTextOrUndefined(form.dispositivo),
    estabelecimento: toTextOrUndefined(form.estabelecimento),
    tentativas: toNumberOrUndefined(form.tentativas),
    ip_origem: toTextOrUndefined(form.ip_origem),
  };
}

function compactPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function aggregateTransactions(transactions) {
  const byCategory = new Map();
  const fraudCount = { Normais: 0, Fraudes: 0 };
  const byHour = new Map();

  for (const tx of transactions) {
    const categoria = tx.categoria || 'Sem categoria';
    byCategory.set(categoria, (byCategory.get(categoria) || 0) + Number(tx.valor || 0));

    const labelFraude = tx.is_fraude ? 'Fraudes' : 'Normais';
    fraudCount[labelFraude] += 1;

    const hourLabel = typeof tx.hora === 'string' ? tx.hora.slice(0, 2) + 'h' : 'Sem hora';
    byHour.set(hourLabel, (byHour.get(hourLabel) || 0) + Number(tx.valor || 0));
  }

  const categoriasOrdenadas = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const horasOrdenadas = [...byHour.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]));

  return {
    categorias: categoriasOrdenadas.map(([categoria]) => categoria),
    valores: categoriasOrdenadas.map(([, valor]) => valor),
    fraudeLabels: ['Normais', 'Fraudes'],
    fraudeValues: [fraudCount.Normais, fraudCount.Fraudes],
    linhaLabels: horasOrdenadas.map(([hora]) => hora),
    linhaValues: horasOrdenadas.map(([, valor]) => valor),
  };
}

export default function Home() {
  const [tela, setTela] = useState('dashboard');
  const [form, setForm] = useState(emptyForm());
  const [analise, setAnalise] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [apiStatus, setApiStatus] = useState('Aguardando conexão com o backend');
  const [carregando, setCarregando] = useState(false);
  const [dashboard, setDashboard] = useState({
    categorias: [],
    valores: [],
    fraudeLabels: ['Normais', 'Fraudes'],
    fraudeValues: [0, 0],
    linhaLabels: [],
    linhaValues: [],
    totais: {
      total_transacoes: 0,
      valor_total: 0,
      maior_transacao: 0,
      total_fraudes: 0,
      total_normais: 0,
    },
  });

  const chartData = useMemo(() => dashboard, [dashboard]);

  useEffect(() => {
    async function carregarTransacoes() {
      try {
        const resumo = await apiRequest('/transacoes/dashboard');
        setDashboard({
          categorias: (resumo?.categorias || []).map((item) => item.categoria),
          valores: (resumo?.categorias || []).map((item) => item.valor_total),
          fraudeLabels: ['Normais', 'Fraudes'],
          fraudeValues: [
            resumo?.totais?.total_normais || 0,
            resumo?.totais?.total_fraudes || 0,
          ],
          linhaLabels: (resumo?.horas || []).map((item) => item.hora_label),
          linhaValues: (resumo?.horas || []).map((item) => item.valor_total),
          totais: resumo?.totais || {
            total_transacoes: 0,
            valor_total: 0,
            maior_transacao: 0,
            total_fraudes: 0,
            total_normais: 0,
          },
        });
        setApiStatus(`Conectado ao backend - ${resumo?.totais?.total_transacoes || 0} transações carregadas`);
      } catch (erro) {
        setApiStatus(`Falha ao carregar transações: ${erro.message}`);
      }
    }

    carregarTransacoes();
  }, []);

  useEffect(() => {
    const categorias = document.getElementById('graficoCategorias');
    const fraudes = document.getElementById('graficoFraudes');
    const linha = document.getElementById('graficoLinha');

    if (!categorias || !fraudes || !linha) return;

    const chart1 = new Chart(categorias, {
      type: 'bar',
      data: {
        labels: chartData.categorias,
        datasets: [{ label: 'Valores', data: chartData.valores, borderWidth: 1 }],
      },
    });

    const chart2 = new Chart(fraudes, {
      type: 'doughnut',
      data: {
        labels: chartData.fraudeLabels,
        datasets: [{ data: chartData.fraudeValues }],
      },
    });

    const chart3 = new Chart(linha, {
      type: 'line',
      data: {
        labels: chartData.linhaLabels,
        datasets: [{ label: 'Valor Transacionado', data: chartData.linhaValues, tension: 0.4 }],
      },
    });

    return () => {
      chart1.destroy();
      chart2.destroy();
      chart3.destroy();
    };
  }, [chartData]);

  async function enviarMensagem() {
    setMensagem('Recebemos sua solicitação.');
  }

  function atualizar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function renderFieldGrid(fields) {
    return fields.map(([key, type, placeholder, step]) => (
      <div className="col-md-4" key={key}>
        <input
          type={type}
          step={step === 'any' ? 'any' : step === '0.01' ? '0.01' : undefined}
          className="form-control"
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => atualizar(key, e.target.value)}
        />
      </div>
    ));
  }

  function preencherExemplo() {
    setForm({
      valor: '120.5',
      data: '2026-05-18',
      hora: '14:30',
      dia_semana: 'segunda-feira',
      categoria: 'alimentacao',
      conta: '12345-6',
      cidade: 'Fortaleza',
      estado: 'CE',
      pais: 'Brasil',
      latitude: '-3.731862',
      longitude: '-38.52667',
      tipo_transacao: 'debito',
      dispositivo: 'android',
      estabelecimento: 'Mercado Central',
      tentativas: '1',
      ip_origem: '192.168.0.10',
    });
  }

  async function apiRequest(path, options = {}) {
    const resposta = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const text = await resposta.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!resposta.ok) {
      const detalhe = typeof data === 'string' ? data : JSON.stringify(data);
      throw new Error(detalhe || `Erro HTTP ${resposta.status}`);
    }

    return data;
  }

  async function analisarPayload(payload) {
    return apiRequest('/analisar', {
      method: 'POST',
      body: JSON.stringify(compactPayload(payload)),
    });
  }

  async function salvarTransacao(payload) {
    return apiRequest('/transacoes', {
      method: 'POST',
      body: JSON.stringify(compactPayload(payload)),
    });
  }

  async function excluirTransacao() {
    const id = prompt('Digite o ID da transação para excluir:');
    if (!id) return;

    try {
      setCarregando(true);
      await apiRequest(`/transacoes/${id}`, { method: 'DELETE' });
      alert('Transação excluída com sucesso!');
    } catch (erro) {
      alert(`Erro ao excluir transação: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  }

  async function analisar() {
    try {
      setCarregando(true);
      const dados = await analisarPayload(buildPayload(form));
      setAnalise(dados);
      setApiStatus('Análise concluída com sucesso. Nenhuma transação foi gravada.');
    } catch (erro) {
      setApiStatus(`Falha na análise: ${erro.message}`);
      alert(`Não foi possível analisar a transação: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  }

  async function analisarESalvar() {
    try {
      setCarregando(true);
      const payload = buildPayload(form);
      const analiseRetorno = await analisarPayload(payload);

      setAnalise(analiseRetorno);
      setApiStatus('Análise concluída com sucesso. Gravando a transação...');

      const salvar = confirm(`Análise concluída: ${analiseRetorno.decisao ?? 'normal'}. Deseja salvar a transação?`);
      if (!salvar) return;

      await salvarTransacao(payload);
      alert('Transação salva com sucesso.');
    } catch (erro) {
      setApiStatus(`Falha na operação: ${erro.message}`);
      alert(`Não foi possível concluir a operação: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  }

  const secaoVisivel = (nome) => tela === nome ? '' : 'hidden';

  return (
    <>
      <aside className="sidebar">
        <h4 id="tituloLateral">
          {tela === 'dashboard' ? 'Dashboard' :
            tela === 'adicionarModal' ? 'Criar Transação' :
            tela === 'analisarModal' ? 'Analisar Transação' : 'Excluir Transação'}
        </h4>
        <div className="mb-4">
          <label className="form-label">Selecionar Tela</label>
          <select className="form-select" value={tela} onChange={(e) => setTela(e.target.value)}>
            <option value="dashboard">Dashboard</option>
            <option value="adicionarModal">Criar Transação</option>
            <option value="analisarModal">Analisar Transação</option>
            <option value="deletarModal">Excluir Transação</option>
          </select>
        </div>
        <div>
          <h4>Contato</h4>
          <label className="form-label">Envie sua solicitação:</label>
          <textarea className="form-control mb-3" rows="5" />
          <button className="btn btn-warning w-100" onClick={enviarMensagem}>Enviar</button>
          {mensagem ? <div className="mt-3">{mensagem}</div> : null}
        </div>
      </aside>

      <main className="main-content">
        <div className="top-header">
          <div className="dashboard-title">Dashboard Financeiro</div>
          <div className="logo-area">Fraud Detection</div>
        </div>

        <div className="analysis-result mb-4">
          <strong>Status da API</strong>
          <div>{apiStatus}</div>
        </div>

        <section id="dashboard" className={secaoVisivel('dashboard')}>
          <div className="row g-4">
            <div className="col-md-4"><div className="metric-card"><div className="metric-title">Valor Total Transacionado</div><div className="metric-value">R$ {dashboard.totais.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div></div>
            <div className="col-md-4"><div className="metric-card"><div className="metric-title">Transações Fraudulentas</div><div className="metric-value metric-danger">{dashboard.totais.total_fraudes}</div></div></div>
            <div className="col-md-4"><div className="metric-card"><div className="metric-title">Maior Transação</div><div className="metric-value">R$ {dashboard.totais.maior_transacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div></div>
          </div>

          <div className="row">
            <div className="col-md-6"><div className="chart-card"><div className="chart-title">Transações por Categoria</div><canvas id="graficoCategorias" /></div></div>
            <div className="col-md-6"><div className="chart-card"><div className="chart-title">Fraudes vs Normais</div><canvas id="graficoFraudes" /></div></div>
          </div>

          <div className="row">
            <div className="col-md-12"><div className="chart-card"><div className="chart-title">Evolução das Transações</div><canvas id="graficoLinha" /></div></div>
          </div>
        </section>

        <section className={secaoVisivel('adicionarModal')}>
          <div className="section-card">
            <h2 className="mb-4">Criar Transação</h2>
            <p className="text-muted mb-3">Este formulário envia os campos exigidos pelo contrato de <code>POST /transacoes</code>.</p>
            <div className="row g-3">
              {[
                ['valor', 'number', 'Valor', '0.01'],
                ['data', 'date', 'Data'],
                ['hora', 'time', 'Hora'],
                ['dia_semana', 'text', 'Dia da semana'],
                ['categoria', 'text', 'Categoria'],
                ['conta', 'text', 'Conta'],
                ['cidade', 'text', 'Cidade'],
                ['estado', 'text', 'Estado'],
                ['pais', 'text', 'País'],
                ['latitude', 'number', 'Latitude', 'any'],
                ['longitude', 'number', 'Longitude', 'any'],
                ['tipo_transacao', 'text', 'Tipo da transação'],
                ['dispositivo', 'text', 'Dispositivo'],
                ['estabelecimento', 'text', 'Estabelecimento'],
                ['tentativas', 'number', 'Tentativas'],
                ['ip_origem', 'text', 'IP de origem'],
              ].map(([key, type, placeholder, step]) => (
                <div className="col-md-4" key={key}>
                  <input
                    type={type}
                    step={step === 'any' ? 'any' : step === '0.01' ? '0.01' : undefined}
                    className="form-control"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => atualizar(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={analisarESalvar} disabled={carregando}>
                {carregando ? 'Processando...' : 'Analisar e salvar'}
              </button>
              <button className="btn btn-outline-secondary" onClick={preencherExemplo}>Preencher exemplo</button>
            </div>
          </div>
        </section>

        <section className={secaoVisivel('analisarModal')}>
          <div className="section-card">
            <h2 className="mb-4">Analisar Transação</h2>
            <p className="text-muted mb-3">Este envio usa o contrato de <code>POST /analisar</code> sem persistir no banco.</p>
            <div className="row g-3">
              {[
                ['valor', 'number', 'Valor', '0.01'],
                ['data', 'date', 'Data'],
                ['hora', 'time', 'Hora'],
                ['conta', 'text', 'Conta'],
                ['pais', 'text', 'País'],
                ['tipo_transacao', 'text', 'Tipo da transação'],
                ['dispositivo', 'text', 'Dispositivo'],
                ['tentativas', 'number', 'Tentativas'],
                ['categoria', 'text', 'Categoria'],
                ['cidade', 'text', 'Cidade'],
                ['estado', 'text', 'Estado'],
                ['estabelecimento', 'text', 'Estabelecimento'],
                ['dia_semana', 'text', 'Dia da semana'],
                ['latitude', 'number', 'Latitude', 'any'],
                ['longitude', 'number', 'Longitude', 'any'],
                ['ip_origem', 'text', 'IP de origem'],
              ].map(([key, type, placeholder, step]) => (
                <div className="col-md-4" key={key}>
                  <input
                    type={type}
                    step={step === 'any' ? 'any' : step === '0.01' ? '0.01' : undefined}
                    className="form-control"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => atualizar(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button className="btn btn-primary mt-4" onClick={analisar} disabled={carregando}>
              {carregando ? 'Analisando...' : 'Analisar'}
            </button>
            {analise ? (
              <div className="analysis-result mt-4">
                <strong>Resultado da análise</strong><br />
                Fraude: {analise.is_fraude ? 'sim' : 'não'}<br />
                Risco: {analise.classificacao_risco ?? '-'}<br />
                Decisão: {analise.decisao ?? '-'}<br />
                Motivos: {(analise.motivos || []).length ? analise.motivos.join(', ') : 'nenhum'}
              </div>
            ) : null}
          </div>
        </section>

        <section className={secaoVisivel('deletarModal')}>
          <div className="section-card">
            <h2 className="mb-4">Excluir Transação</h2>
            <input type="number" id="deleteId" className="form-control" placeholder="ID da Transação" />
            <button className="btn btn-danger mt-3" onClick={excluirTransacao}>Excluir</button>
          </div>
        </section>
      </main>
    </>
  );
}
