'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const API_BASE_URL = '/api/backend';

const TRANSACTION_TYPES = ['debito', 'credito', 'pix', 'transferencia', 'saque', 'pagamento'];
const COUNTRIES = ['Brasil', 'Argentina', 'Chile', 'Colombia', 'Estados Unidos', 'Mexico', 'Portugal', 'Espanha'];
const CATEGORIES = ['alimentacao', 'saude', 'viagem', 'compras', 'servicos', 'assinaturas', 'educacao', 'outros'];
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEVICES = ['app_mobile', 'web', 'caixa_eletronico', 'terminal_fisico'];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'adicionarModal', label: 'Criar Transacao', icon: '+' },
  { id: 'analisarModal', label: 'Analisar Transacao', icon: '↗' },
  { id: 'deletarModal', label: 'Excluir Transacao', icon: '×' },
];

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

const ANALYSIS_GROUPS = [
  {
    title: 'Dados da transacao',
    description: 'Campos principais para classificacao',
    fields: [
      ['valor', 'number', 'Valor', '0.01'],
      ['data', 'date', 'Data'],
      ['hora', 'time', 'Hora'],
      ['dia_semana', 'select', 'Dia da semana'],
      ['categoria', 'select', 'Categoria'],
      ['tipo_transacao', 'select', 'Tipo da transacao'],
    ],
  },
  {
    title: 'Localizacao',
    description: 'Contexto geografico e cadastral',
    fields: [
      ['conta', 'text', 'Conta'],
      ['cidade', 'text', 'Cidade'],
      ['estado', 'text', 'Estado'],
      ['pais', 'select', 'Pais'],
      ['latitude', 'number', 'Latitude', 'any'],
      ['longitude', 'number', 'Longitude', 'any'],
    ],
  },
  {
    title: 'Seguranca',
    description: 'Ambiente de acesso e rastreabilidade',
    fields: [
      ['dispositivo', 'select', 'Dispositivo'],
      ['ip_origem', 'text', 'IP de origem'],
      ['tentativas', 'number', 'Tentativas'],
      ['estabelecimento', 'text', 'Estabelecimento'],
    ],
  },
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

function emptyHistoryFilters() {
  return {
    id: '',
    fraude: '',
    risco: '',
    decisao: '',
    data_inicio: '',
    data_fim: '',
    valor_min: '',
    valor_max: '',
    pais: '',
    estado: '',
    cidade: '',
    categoria: '',
    tipo_transacao: '',
    conta: '',
    ip_origem: '',
    dispositivo: '',
  };
}

const REQUIRED_ANALYSIS_FIELDS = ['valor', 'data', 'hora', 'conta'];

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

function getRiskTone(risco, decisao) {
  const text = `${risco ?? ''} ${decisao ?? ''}`.toLowerCase();
  if (text.includes('alto') || text.includes('fraud')) return 'danger';
  if (text.includes('medio') || text.includes('médio')) return 'warning';
  return 'success';
}

function fieldLabel(label, required = false) {
  return required ? `${label} (obrigatorio)` : label;
}

function SelectField({ value, onChange, options, placeholder, className = 'form-control' }) {
  return (
    <select className={className} value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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

function MobileServiceScreen({ onScreenChange }) {
  return (
    <div className="mobile-shell">
      <div className="app-screen">
        <header className="bb-top-bar">
          <div className="bb-top-row">
            <div className="bb-mini-logo" />
            <div className="bb-top-title">Banco do Brasil</div>
          </div>
        </header>

        <main className="mobile-content">
          <section id="telaInicio" className="mobile-section">
            <div className="profile-card mobile-card">
              <div className="mobile-card-header">
                <div className="avatar-blue">BB</div>
                <div>
                  <h2>Inicio</h2>
                  <p>Atalhos e resumo da conta</p>
                </div>
              </div>
              <div className="shortcut-grid">
                {['Pix', 'Pagar', 'Transferir', 'Investir', 'Cartoes'].map((item) => (
                  <button key={item} type="button" className="shortcut-item" onClick={() => onScreenChange('menu')}>
                    <span className="shortcut-icon">•</span>
                    <span className="shortcut-label">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="telaMenu" className="mobile-section">
            <div className="menu-list">
              {[
                ['Cadastrar transacao', 'service'],
                ['Analisar historico', 'service'],
                ['Contato e suporte', 'service'],
              ].map(([label, target]) => (
                <button key={label} type="button" className="menu-item" onClick={() => onScreenChange(target)}>
                  <i>▸</i>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>

          <section id="telaServico" className="mobile-section">
            <div className="service-container">
              <button type="button" className="mobile-back" onClick={() => onScreenChange('menu')}>
                Voltar ao menu
              </button>
              <h3>Servico</h3>
              <label className="mobile-label">Cidade</label>
              <input className="form-control mobile-input" placeholder="Digite a cidade" />
              <label className="mobile-label">Estado</label>
              <input className="form-control mobile-input" placeholder="Digite o estado" />
              <label className="mobile-label">Mensagem</label>
              <textarea className="form-control mobile-input" rows="5" placeholder="Escreva aqui" />
              <button type="button" className="btn btn-bb-yellow w-100 mt-3" onClick={() => onScreenChange('inicio')}>
                Enviar
              </button>
            </div>
          </section>
        </main>

        <nav className="bb-bottom-nav">
          <button type="button" className="nav-tab" onClick={() => onScreenChange('inicio')}>
            <i>⌂</i>
            <span>Inicio</span>
          </button>
          <button type="button" className="nav-tab active" onClick={() => onScreenChange('menu')}>
            <i>≡</i>
            <span>Menu</span>
          </button>
          <button type="button" className="nav-tab" onClick={() => onScreenChange('service')}>
            <i>＋</i>
            <span>Servico</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [tela, setTela] = useState('dashboard');
  const [form, setForm] = useState(emptyForm());
  const [analise, setAnalise] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [apiStatus, setApiStatus] = useState('Aguardando conexao com o backend');
  const [carregando, setCarregando] = useState(false);
  const [histFilters, setHistFilters] = useState(emptyHistoryFilters());
  const [historico, setHistorico] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoUrl, setHistoricoUrl] = useState('');
  const [historicoResultado, setHistoricoResultado] = useState(null);
  const [historicoBusca, setHistoricoBusca] = useState('');
  const [historicoOrdenacao, setHistoricoOrdenacao] = useState({ key: 'data', direction: 'desc' });
  const [historicoPagina, setHistoricoPagina] = useState(1);
  const [historicoJsonAberto, setHistoricoJsonAberto] = useState(false);
  const [formErrors, setFormErrors] = useState({});
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
  const [screen, setScreenState] = useState('dashboard');

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

  async function carregarHistorico(filtros = histFilters) {
    try {
      setHistoricoLoading(true);
      const params = new URLSearchParams();
      if (filtros.id !== '' && filtros.id !== null && filtros.id !== undefined) {
        params.set('id', filtros.id);
      }
      if (filtros.conta !== '' && filtros.conta !== null && filtros.conta !== undefined) {
        params.set('conta', filtros.conta);
      }
      const query = params.toString();
      setHistoricoUrl(`${API_BASE_URL}/transacoes${query ? `?${query}` : ''}`);
      const dados = await apiRequest(`/transacoes${query ? `?${query}` : ''}`);
      const lista = Array.isArray(dados) ? dados : dados?.items || dados?.transacoes || [];
      const idFiltro = `${filtros.id ?? ''}`.trim();
      const contaFiltro = `${filtros.conta ?? ''}`.trim();
      const listaFiltrada = idFiltro
        ? lista.filter((item) => `${item?.id ?? ''}`.trim() === idFiltro)
        : contaFiltro
          ? lista.filter((item) => `${item?.conta ?? ''}`.trim() === contaFiltro)
        : lista;
      setHistorico(listaFiltrada);
      setHistoricoResultado(dados);
      setHistoricoPagina(1);
    } catch (erro) {
      setApiStatus(`Falha ao carregar historico: ${erro.message}`);
      setHistoricoResultado({ erro: erro.message });
    } finally {
      setHistoricoLoading(false);
    }
  }

  useEffect(() => {
    async function carregarTransacoes() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/transacoes/dashboard`);
        const resumo = await resposta.json();
        setDashboard({
          categorias: (resumo?.categorias || []).map((item) => item.categoria),
          valores: (resumo?.categorias || []).map((item) => item.valor_total),
          fraudeLabels: ['Normais', 'Fraudes'],
          fraudeValues: [resumo?.totais?.total_normais || 0, resumo?.totais?.total_fraudes || 0],
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
    if (tela === 'historicoModal') {
      carregarHistorico(histFilters);
    }
  }, [tela]);

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
    setFormErrors((atual) => {
      if (!atual[campo]) return atual;
      const next = { ...atual };
      delete next[campo];
      return next;
    });
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function selectOptionsFor(key) {
    if (key === 'tipo_transacao') return TRANSACTION_TYPES;
    if (key === 'categoria') return CATEGORIES;
    if (key === 'dia_semana') return WEEKDAYS;
    if (key === 'dispositivo') return DEVICES;
    if (key === 'pais') return COUNTRIES;
    if (key === 'fraude') return ['true', 'false'];
    if (key === 'risco') return ['baixo', 'medio', 'alto'];
    if (key === 'decisao') return ['aprovado', 'negado', 'revisar'];
    return ['sim', 'nao', 'baixo', 'medio', 'alto', 'normal', 'fraude', 'aprovado', 'negado'];
  }

  function renderFieldGrid(fields, formState = form, updater = atualizar) {
    return fields.map(([key, type, placeholder, step]) => (
      <div className="field-cell" key={key}>
        {type === 'select' ? (
          <SelectField
            className={`form-select form-input ${formErrors[key] ? 'is-invalid' : ''}`}
            value={formState[key]}
            placeholder={placeholder}
            options={selectOptionsFor(key)}
            onChange={(e) => updater(key, e.target.value)}
          />
        ) : (
          <input
            type={type}
            step={step === 'any' ? 'any' : step === '0.01' ? '0.01' : undefined}
            className={`form-control form-input ${formErrors[key] ? 'is-invalid' : ''}`}
            placeholder={placeholder}
            value={formState[key]}
            onChange={(e) => updater(key, e.target.value)}
          />
        )}
        {formErrors[key] ? <div className="invalid-feedback d-block">{formErrors[key]}</div> : null}
      </div>
    ));
  }

  function renderHistoryFieldGrid() {
    return (
      <div className="field-cell">
        <input
          type="text"
          className="form-control form-input"
          placeholder="ID da transação"
          value={histFilters.id}
          onChange={(e) => setHistFilters((atual) => ({ ...atual, id: e.target.value }))}
        />
        <input
          type="text"
          className="form-control form-input mt-3"
          placeholder="Conta"
          value={histFilters.conta}
          onChange={(e) => setHistFilters((atual) => ({ ...atual, conta: e.target.value }))}
        />
      </div>
    );
  }

  function formatMoney(value) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value ?? '-';
    return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
  }

  function normalizeText(value) {
    return `${value ?? ''}`.toLowerCase();
  }

  function isFraudeValue(item) {
    return item.fraude === true || item.is_fraude === true || normalizeText(item.fraude).includes('true') || normalizeText(item.classificacao_risco).includes('alto');
  }

  function sortHistoricoRows(rows) {
    const { key, direction } = historicoOrdenacao;
    const factor = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a?.[key];
      const bv = b?.[key];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1 * factor;
      if (bv === undefined || bv === null) return -1 * factor;
      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return (an - bn) * factor;
      return `${av}`.localeCompare(`${bv}`, 'pt-BR') * factor;
    });
  }

  const historicoFiltrado = sortHistoricoRows(
    historico.filter((item) => {
      if (!historicoBusca.trim()) return true;
      const search = normalizeText(historicoBusca);
      return [
        item.id,
        item.conta,
        item.valor,
        item.data,
        item.hora,
        item.categoria,
        item.cidade,
        item.estado,
        item.tipo_transacao,
        item.dispositivo,
        item.tentativas,
      ]
        .filter(Boolean)
        .some((value) => normalizeText(value).includes(search));
    })
  );

  const historicoPorPagina = 8;
  const totalHistoricoPaginas = Math.max(1, Math.ceil(historicoFiltrado.length / historicoPorPagina));
  const historicoPaginaAtual = Math.min(historicoPagina, totalHistoricoPaginas);
  const historicoVisivel = historicoFiltrado.slice((historicoPaginaAtual - 1) * historicoPorPagina, historicoPaginaAtual * historicoPorPagina);

  function preencherExemplo() {
    setForm({
      valor: '120.5',
      data: '2026-05-18',
      hora: '14:30',
      dia_semana: 'monday',
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

  function validarFormularioAnalise(payload) {
    const errors = {};
    REQUIRED_ANALYSIS_FIELDS.forEach((field) => {
      const value = payload[field];
      if (value === undefined || value === null || value === '') {
        errors[field] = 'Campo obrigatorio';
      }
    });

    if (payload.estado && typeof payload.estado === 'string' && payload.estado.trim().length < 2) {
      errors.estado = 'Informe um estado valido';
    }

    return errors;
  }

  async function analisar() {
    try {
      const payload = buildPayload(form);
      const errors = validarFormularioAnalise(payload);
      if (Object.keys(errors).length) {
        setFormErrors(errors);
        setApiStatus('Preencha os campos obrigatorios antes de analisar.');
        return;
      }

      setCarregando(true);
      const dados = await analisarPayload(payload);
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

  function limparFormulario() {
    setForm(emptyForm());
    setAnalise(null);
    setFormErrors({});
    setApiStatus('Formulario limpo.');
  }

  function limparFiltrosHistorico() {
    setHistFilters(emptyHistoryFilters());
    setHistoricoBusca('');
    setHistoricoOrdenacao({ key: 'data', direction: 'desc' });
    setHistoricoPagina(1);
  }

  function setScreen(nextScreen) {
    if (typeof window === 'undefined') return;
    if (nextScreen === 'menu' || nextScreen === 'service' || nextScreen === 'inicio') {
      router.push('/mobile');
      setScreenState(nextScreen);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.delete('screen');
    const query = params.toString();
    router.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname);
    setScreenState(nextScreen || 'dashboard');
  }

  const isMobileScreen = screen === 'inicio' || screen === 'menu' || screen === 'service';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setScreenState(params.get('screen') || 'dashboard');
  }, []);

  const secaoVisivel = (nome) => (tela === nome ? '' : 'hidden');

  return (
    <>
      {isMobileScreen ? <MobileServiceScreen onScreenChange={setScreen} /> : null}
      {!isMobileScreen ? (
        <>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark brand-mark-image" aria-label="Banco do Brasil">
            <img className="brand-logo-img" src="/BB-logo.jpg" alt="Banco do Brasil" />
          </div>
          <div className="brand-copy">
            <strong>BB Fraud Detection</strong>
            <span>Financial risk analytics</span>
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
              {item.icon ? (
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-support w-100 mb-3" onClick={() => setScreen('menu')}>
          Abrir tela adicional
        </button>

        <div className="support-box">
          <h4>Contato</h4>
          <label className="form-label">Envie sua solicitacao:</label>
          <textarea className="form-control mb-3 support-textarea" rows="6" placeholder="Escreva sua mensagem..." />
          <button className="btn btn-support w-100" onClick={() => setMensagem('Recebemos sua solicitacao.')}>
            Enviar
          </button>
          {mensagem ? <div className="mt-3 small">{mensagem}</div> : null}
        </div>
      </aside>

      <main className="main-content">
        <section className="hero">
          <div className="hero-top">
            <div>
              <div className="eyebrow">BB Fraud Detection</div>
              <div className="dashboard-title">Dashboard Financeiro</div>
              <div className="dashboard-subtitle">
                Monitoramento de transacoes e identificacao de possiveis fraudes com leitura em tempo real dos dados da API.
              </div>
            </div>
            <div className="module-badge">Fraud Detection</div>
          </div>
        </section>
        <div className="form-help dashboard-hint">Banco de dados e deteccao antifraude integrados a API</div>

        <section id="dashboard" className={secaoVisivel('dashboard')}>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Valor total transacionado',
                `R$ ${dashboard.totais.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'Volume acumulado carregado da API',
                '¤',
                'metric-neutral',
              )}
            </div>
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Transacoes fraudulentas',
                dashboard.totais.total_fraudes,
                'Sinalizadas pelo motor antifraude',
                '!',
                'metric-danger',
              )}
            </div>
            <div className="col-md-6 col-lg-3">
              {renderMetricCard(
                'Maior transacao',
                `R$ ${dashboard.totais.maior_transacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'Maior valor identificado no historico',
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
                <div className="chart-title">Transacoes por Categoria</div>
                <div className="chart-subtitle">Volume financeiro acumulado por categoria.</div>
                <canvas id="graficoCategorias" />
              </div>

              <div className="chart-card">
                <div className="chart-title">Evolucao das Transacoes</div>
                <div className="chart-subtitle">Distribuicao do valor transacionado ao longo do periodo carregado.</div>
                <canvas id="graficoLinha" />
              </div>
            </div>

            <div className="analytics-side">
              <div className="chart-card">
                <div className="chart-title">Fraudes vs Normais</div>
                <div className="chart-subtitle">Comparativo percentual entre transacoes normais e suspeitas.</div>
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
            <div className="section-heading">
              <div>
                <h2 className="mb-2">Criar Transacao</h2>
                <p className="text-muted mb-0">
                  Este formulario envia os campos exigidos pelo contrato de <code>POST /transacoes</code>.
                </p>
              </div>
            </div>
            <div className="form-grid">{renderFieldGrid(FORM_FIELDS)}</div>
            <div className="action-row">
              <button className="btn btn-primary btn-modern" onClick={analisarESalvar} disabled={carregando}>
                {carregando ? 'Processando...' : 'Analisar e salvar'}
              </button>
              <button className="btn btn-outline-secondary btn-modern" onClick={preencherExemplo}>
                Preencher exemplo
              </button>
            </div>
          </div>
        </section>

        <section className={secaoVisivel('analisarModal')}>
          <div className="section-card">
            <div className="section-heading">
              <div>
                <h2 className="mb-2">Analisar Transacao</h2>
                <p className="text-muted mb-0">Organize os dados por grupo para uma leitura mais clara e profissional.</p>
              </div>
              <div className="action-row action-row-tight">
                <button className="btn btn-outline-secondary btn-modern" onClick={limparFormulario}>
                  Limpar Campos
                </button>
                <button className="btn btn-primary btn-modern" onClick={analisar} disabled={carregando}>
                  {carregando ? 'Analisando...' : 'Analisar Transacao'}
                </button>
              </div>
            </div>

            <div className="analysis-card-grid">
              {ANALYSIS_GROUPS.map((group) => (
                <div className="analysis-group-card" key={group.title}>
                  <div className="card-header-lite">
                    <h5>{group.title}</h5>
                    <span>{group.description}</span>
                  </div>
                  <div className="form-grid form-grid-compact">{renderFieldGrid(group.fields)}</div>
                </div>
              ))}
            </div>

            <div className="analysis-group-card mt-4">
              <div className="card-header-lite">
                <h5>Historico filtrado</h5>
                <span>Filtre apenas pela conta e veja o retorno bruto da API</span>
              </div>
              <div className="action-row action-row-tight">
                <button className="btn btn-outline-secondary btn-modern" onClick={limparFiltrosHistorico}>
                  Limpar Filtros
                </button>
                <button className="btn btn-primary btn-modern" onClick={() => carregarHistorico(histFilters)} disabled={historicoLoading}>
                  {historicoLoading ? 'Carregando...' : 'Aplicar Filtros'}
                </button>
                <button className="btn btn-outline-secondary btn-modern" onClick={() => setHistoricoJsonAberto((open) => !open)} disabled={!historicoResultado}>
                  Visualizar JSON
                </button>
              </div>
              <div className="analysis-group-card mt-3">
                <div className="card-header-lite">
                  <h5>Busca local</h5>
                  <span>Pesquise por qualquer coluna da tabela</span>
                </div>
                <input
                  type="text"
                  className="form-control form-input"
                  placeholder="Buscar na tabela..."
                  value={historicoBusca}
                  onChange={(e) => {
                    setHistoricoBusca(e.target.value);
                    setHistoricoPagina(1);
                  }}
                />
              </div>
              <div className="form-grid form-grid-compact mt-3">{renderHistoryFieldGrid()}</div>
              <div className="table-responsive history-table-wrap mt-4">
                <table className="table align-middle history-table">
                  <thead>
                    <tr>
                      {[
                        ['id', 'ID'],
                        ['conta', 'Conta'],
                        ['valor', 'Valor'],
                        ['data', 'Data'],
                        ['hora', 'Hora'],
                        ['categoria', 'Categoria'],
                        ['cidade', 'Cidade'],
                        ['estado', 'Estado'],
                        ['tipo_transacao', 'Tipo da Transação'],
                        ['dispositivo', 'Dispositivo'],
                        ['tentativas', 'Tentativas'],
                        ['fraude', 'Status de Fraude'],
                      ].map(([key, label]) => (
                        <th key={key}>
                          <button
                            type="button"
                            className="history-sort-btn"
                            onClick={() =>
                              setHistoricoOrdenacao((atual) => ({
                                key,
                                direction: atual.key === key && atual.direction === 'asc' ? 'desc' : 'asc',
                              }))
                            }
                          >
                            {label}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historicoVisivel.length ? (
                      historicoVisivel.map((item, index) => {
                        const fraude = isFraudeValue(item);
                        return (
                          <tr key={item.id ?? index}>
                            <td>{item.id ?? '-'}</td>
                            <td>{item.conta ?? '-'}</td>
                            <td>{formatMoney(item.valor)}</td>
                            <td>{formatDate(item.data)}</td>
                            <td>{item.hora ?? '-'}</td>
                            <td>{item.categoria ?? '-'}</td>
                            <td>{item.cidade ?? '-'}</td>
                            <td>{item.estado ?? '-'}</td>
                            <td>{item.tipo_transacao ?? '-'}</td>
                            <td>{item.dispositivo ?? '-'}</td>
                            <td>{item.tentativas ?? '-'}</td>
                            <td>
                              <span className={`status-pill ${fraude ? 'status-danger' : 'status-success'}`}>
                                {fraude ? '🚨 Suspeita de Fraude' : '✅ Transação Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center py-5 text-muted">
                          Nenhum registro encontrado para este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="history-footer-actions">
                <div className="small text-muted">
                  Mostrando {historicoVisivel.length} de {historicoFiltrado.length} registros
                </div>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-modern btn-sm"
                    disabled={historicoPaginaAtual <= 1}
                    onClick={() => setHistoricoPagina((page) => Math.max(1, page - 1))}
                  >
                    Anterior
                  </button>
                  <span className="pagination-indicator">
                    Página {historicoPaginaAtual} de {totalHistoricoPaginas}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-modern btn-sm"
                    disabled={historicoPaginaAtual >= totalHistoricoPaginas}
                    onClick={() => setHistoricoPagina((page) => Math.min(totalHistoricoPaginas, page + 1))}
                  >
                    Próxima
                  </button>
                </div>
              </div>
              {historicoJsonAberto && historicoResultado ? (
                <div className="json-modal-card mt-3">
                  <div className="card-header-lite">
                    <h5>JSON original</h5>
                    <span>Resposta bruta da API formatada</span>
                  </div>
                  <pre className="json-viewer">{JSON.stringify(historicoResultado, null, 2)}</pre>
                </div>
              ) : null}
            </div>

            {analise ? (
              <div className={`analysis-result mt-4 analysis-result-${getRiskTone(analise.classificacao_risco, analise.decisao)}`}>
                <strong>Resultado da analise</strong>
                <div className="analysis-result-grid mt-3">
                  <div>
                    <span>Status da transacao</span>
                    <strong>{analise.is_fraude ? 'Fraude' : 'Normal'}</strong>
                  </div>
                  <div>
                    <span>Nivel de risco</span>
                    <strong>{analise.classificacao_risco ?? '-'}</strong>
                  </div>
                  <div>
                    <span>Decisao</span>
                    <strong>{analise.decisao ?? '-'}</strong>
                  </div>
                  <div>
                    <span>Motivos</span>
                    <strong>{(analise.motivos || []).length ? analise.motivos.join(', ') : 'nenhum'}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className={secaoVisivel('deletarModal')}>
          <div className="section-card">
            <h2 className="mb-4">Excluir Transacao</h2>
            <input type="number" id="deleteId" className="form-control form-input" placeholder="ID da Transacao" />
            <button className="btn btn-danger btn-modern mt-3" onClick={excluirTransacao}>
              Excluir
            </button>
          </div>
        </section>
      </main>
        </>
      ) : null}
    </>
  );
}
