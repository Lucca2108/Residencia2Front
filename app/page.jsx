'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const API_BASE_URL = '/api/backend';

const FORM_FIELDS = [
  ['valor', 'number', 'Valor', '0.01'],
  ['data', 'date', 'Data'],
  ['hora', 'time', 'Hora'],
  ['dia_semana', 'text', 'Dia da semana'],
  ['categoria', 'text', 'Categoria'],
  ['conta', 'text', 'Conta'],
  ['cidade', 'text', 'Cidade'],
  ['estado', 'text', 'Estado'],
  ['pais', 'text', 'Pais'],
  ['latitude', 'number', 'Latitude', 'any'],
  ['longitude', 'number', 'Longitude', 'any'],
  ['tipo_transacao', 'text', 'Tipo da transacao'],
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
  ['pais', 'text', 'Pais'],
  ['tipo_transacao', 'text', 'Tipo da transacao'],
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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'adicionarModal', label: 'Criar Transação' },
  { id: 'analisarModal', label: 'Analisar Transação' },
  { id: 'deletarModal', label: 'Excluir Transação' },
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

function renderMetricCard(title, value, foot, icon, variant = '') {
  return (
    <div className={`metric-card ${variant}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{foot}</div>
    </div>
  );
}

export default function Home() {
  const [tela, setTela] = useState('dashboard');
  const [form, setForm] = useState(emptyForm());
  const [analise, setAnalise] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [apiStatus, setApiStatus] = useState('Aguardando conexao com o backend');
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
  const isConnected = apiStatus.toLowerCase().includes('conectado');

  useEffect(() => {
    async function carregarTransacoes() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/transacoes/dashboard`);
        const resumo = await resposta.json();
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
        setApiStatus(`Conectado ao backend - ${resumo?.totais?.total_transacoes || 0} transacoes carregadas`);
      } catch (erro) {
        setApiStatus(`Falha ao carregar transacoes: ${erro.message}`);
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
      options: { responsive: true, maintainAspectRatio: false },
    });

    const chart2 = new Chart(fraudes, {
      type: 'doughnut',
      data: {
        labels: chartData.fraudeLabels,
        datasets: [{ data: chartData.fraudeValues, backgroundColor: ['#003DA5', '#D71920'] }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    const chart3 = new Chart(linha, {
      type: 'line',
      data: {
        labels: chartData.linhaLabels,
        datasets: [{ label: 'Valor Transacionado', data: chartData.linhaValues, tension: 0.4 }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    return () => {
      chart1.destroy();
      chart2.destroy();
      chart3.destroy();
    };
  }, [chartData]);

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
    const id = prompt('Digite o ID da transacao para excluir:');
    if (!id) return;
    try {
      setCarregando(true);
      await apiRequest(`/transacoes/${id}`, { method: 'DELETE' });
      alert('Transacao excluida com sucesso!');
    } catch (erro) {
      alert(`Erro ao excluir transacao: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  }

  async function analisar() {
    try {
      setCarregando(true);
      const dados = await analisarPayload(buildPayload(form));
      setAnalise(dados);
      setApiStatus('Analise concluida com sucesso. Nenhuma transacao foi gravada.');
    } catch (erro) {
      setApiStatus(`Falha na analise: ${erro.message}`);
      alert(`Nao foi possivel analisar a transacao: ${erro.message}`);
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
      setApiStatus('Analise concluida com sucesso. Gravando a transacao...');
      const salvar = confirm(`Analise concluida: ${analiseRetorno.decisao ?? 'normal'}. Deseja salvar a transacao?`);
      if (!salvar) return;
      await salvarTransacao(payload);
      alert('Transacao salva com sucesso.');
    } catch (erro) {
      setApiStatus(`Falha na operacao: ${erro.message}`);
      alert(`Nao foi possivel concluir a operacao: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  }

  const secaoVisivel = (nome) => (tela === nome ? '' : 'hidden');

  return (
    <>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">BB</div>
          <div className="brand-copy">
            <strong>BB Fraud Detection</strong>
            <span>Financial Risk Analytics</span>
          </div>
        </div>

        <div className="nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${tela === item.id ? 'active' : ''}`}
              onClick={() => setTela(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="support-box">
          <h4>Contato</h4>
          <label className="form-label">Envie sua solicitação:</label>
          <textarea className="form-control mb-3" rows="5" placeholder="Escreva sua mensagem..." />
          <button className="btn btn-support w-100" onClick={() => setMensagem('Recebemos sua solicitação.')}>Enviar</button>
          {mensagem ? <div className="mt-3 small">{mensagem}</div> : null}
        </div>
      </aside>

      <main className="main-content">
        <section className="hero">
          <div className="hero-top">
            <div>
              <div className="dashboard-title">Dashboard Financeiro</div>
              <div className="dashboard-subtitle">
                Monitoramento de transações e identificação de possíveis fraudes com leitura em tempo real dos dados da API.
              </div>
            </div>
            <div className="module-badge">Fraud Detection</div>
          </div>
          <div className="api-badge">
            <span className="api-dot" />
            {apiStatus}
          </div>
        </section>

        <div className="dashboard-nav-row">
          <div className={`mini-status ${isConnected ? 'is-online' : ''}`}>
            {isConnected ? 'Sistema online' : 'Aguardando conexão'}
          </div>
          <div className="form-help">Banco de dados e detecção antifraude integrados à API</div>
        </div>

        <section id="dashboard" className={secaoVisivel('dashboard')}>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Valor total transacionado',
                `R$ ${dashboard.totais.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'Volume acumulado carregado da API',
                '€',
                'metric-neutral',
              )}
            </div>
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Transações fraudulentas',
                dashboard.totais.total_fraudes,
                'Sinalizadas pelo motor antifraude',
                '!',
                'metric-danger',
              )}
            </div>
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Maior transação',
                `R$ ${dashboard.totais.maior_transacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'Maior valor identificado no histórico',
                '↑',
                'metric-warning',
              )}
            </div>
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Total carregado',
                dashboard.totais.total_transacoes,
                'Registros processados pela API',
                '≈',
                'metric-neutral',
              )}
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-main">
              <div className="chart-card">
                <div className="chart-title">Transações por Categoria</div>
                <div className="chart-subtitle">Volume financeiro acumulado por categoria.</div>
                <canvas id="graficoCategorias" />
              </div>

              <div className="chart-card">
                <div className="chart-title">Evolução das Transações</div>
                <div className="chart-subtitle">Distribuição do valor transacionado ao longo do período carregado.</div>
                <canvas id="graficoLinha" />
              </div>
            </div>

            <div className="analytics-side">
              <div className="chart-card">
                <div className="chart-title">Fraudes vs Normais</div>
                <div className="chart-subtitle">Comparativo percentual entre transações normais e suspeitas.</div>
                <canvas id="graficoFraudes" />
              </div>

              <div className="summary-card">
                <div className="chart-title">Resumo Operacional</div>
                <div className="analysis-result">
                  <strong>Estado atual</strong>
                  <div className="mt-2">Status: {apiStatus}</div>
                  <div className="mt-2 fraud-text">Fraudes: {dashboard.totais.total_fraudes}</div>
                  <div className="mt-2">Normais: {dashboard.totais.total_normais}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={secaoVisivel('adicionarModal')}>
          <div className="section-card">
            <h2 className="mb-4">Criar Transação</h2>
            <p className="text-muted mb-3">Este formulário envia os campos exigidos pelo contrato de <code>POST /transacoes</code>.</p>
            <div className="row g-3">{renderFieldGrid(FORM_FIELDS)}</div>
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
            <div className="row g-3">{renderFieldGrid(ANALYSIS_FIELDS)}</div>
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
