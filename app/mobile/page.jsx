'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = '/api/backend';

const MENU_ITEMS = [
  { label: 'Pix', icon: '▣' },
  { label: 'Cartões', icon: '▤' },
  { label: 'Pagamentos', icon: '▥', badge: '1' },
  { label: 'Empréstimos', icon: '▦' },
  { label: 'Investimentos', icon: '▧' },
];

const MORE_ITEMS = [
  'Programar Viagem',
  'Solicitar limite',
  'Seguros',
  'Comprovantes',
  'Atualizar dados',
];

function MobileHome() {
  const [screen, setScreen] = useState('inicio');
  const [moreOpen, setMoreOpen] = useState(true);
  const accountNumber = '12345-6';
  const [travelStatus, setTravelStatus] = useState('');
  const [travelForm, setTravelForm] = useState({
    cidade_destino: '',
    estado_destino: '',
    pais_destino: '',
    data_inicio: '',
    data_fim: '',
  });
  function updateTravel(field, value) {
    setTravelForm((current) => ({ ...current, [field]: value }));
  }

  async function enviarViagem() {
    const bodyData = {
      conta: accountNumber,
      cidade_destino: travelForm.cidade_destino,
      estado_destino: travelForm.estado_destino,
      pais_destino: travelForm.pais_destino,
      data_inicio: travelForm.data_inicio,
      data_fim: travelForm.data_fim,
    };

    try {
      setTravelStatus('Enviando recurso para a API...');
      const response = await fetch(`${API_BASE_URL}/viagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
      setTravelStatus(text || 'Viagem criada com sucesso.');
      setScreen('menu');
    } catch (error) {
      setTravelStatus(`Falha ao criar viagem: ${error.message}`);
    }
  }

  return (
    <div className="mobile-shell">
      <div className="app-screen">
        <header className="bb-search-header">
          <div className="bb-search-bar">
            <span className="bb-search-icon">⌕</span>
            <input className="bb-search-input" placeholder="Pesquisar..." />
            <span className="bb-search-mic">🎤</span>
          </div>
        </header>

        <main className="mobile-content mobile-menu-content">
          {screen === 'inicio' ? (
            <>
              <header className="bb-mobile-header">
                <div className="bb-mobile-greeting">
                  <span className="bb-mini-logo" />
                  <strong>Olá, Ricardo</strong>
                </div>
                <div className="bb-mobile-actions" aria-hidden="true">
                  <span>◔</span>
                  <span>▣</span>
                  <span>⇥</span>
                </div>
              </header>

              <div className="mobile-summary-card">
                <div className="mobile-summary-top">
                  <div>
                    <div className="mobile-subtitle">Conta Corrente</div>
                    <div className="mobile-branch">Ag. 1234-5 - Cc. {accountNumber}</div>
                  </div>
                  <div className="mobile-chevron">›</div>
                </div>

                <div className="mobile-balance-row">
                  <div className="mobile-balance-col">
                    <span>Saldo disponível</span>
                    <strong>R$ 7.857,66</strong>
                  </div>
                  <div className="mobile-balance-divider" />
                  <div className="mobile-balance-col mobile-balance-negative">
                    <span>Lançamentos futuros</span>
                    <strong>- R$ 448,55</strong>
                  </div>
                </div>
              </div>

              <div className="mobile-shortcuts">
                {[
                  ['Extrato', '📄'],
                  ['Pagamento', '▦'],
                  ['Transferência', '⇄'],
                  ['Pix', '▣'],
                  ['Boleto', '▤'],
                  ['Empréstimo', '💰'],
                  ['Antecipação', '💳'],
                  ['Seguro', '☂'],
                ].map(([label, icon]) => (
                  <button key={label} type="button" className="shortcut-item" onClick={() => setScreen('menu')}>
                    <span className="shortcut-icon">{icon}</span>
                    <span className="shortcut-label">{label}</span>
                  </button>
                ))}
              </div>

              <div className="mobile-pending-card">
                <div className="mobile-pending-title">
                  <span>⚠️</span>
                  <strong>Pendências de confirmação</strong>
                  <span className="mobile-chevron">›</span>
                </div>
                <div className="mobile-pending-subtitle">Consulte aqui suas pendências</div>
              </div>
            </>
          ) : null}

          {screen === 'menu' ? (
            <>
              <section className="mobile-profile-card">
                <div className="mobile-profile-avatar">R</div>
                <div>
                  <strong>Ricardo</strong>
                  <span>Conta Premium</span>
                </div>
              </section>

              <section className="mobile-menu-list">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-menu-row ${screen === item.label ? 'active' : ''}`}
                    onClick={() => setScreen(item.label)}
                  >
                    <span className="mobile-menu-left">
                      <span className="mobile-menu-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.badge ? <span className="mobile-badge">{item.badge}</span> : null}
                    </span>
                    <span className="mobile-menu-arrow">›</span>
                  </button>
                ))}

                <div className={`mobile-more-block ${moreOpen ? 'open' : ''}`}>
                  <button type="button" className="mobile-menu-row mobile-more-row" onClick={() => setMoreOpen((open) => !open)}>
                    <span className="mobile-menu-left">
                      <span className="mobile-menu-icon">▦</span>
                      <span>Mais</span>
                    </span>
                    <span className="mobile-menu-arrow">{moreOpen ? '⌄' : '›'}</span>
                  </button>

                  {moreOpen ? (
                    <div className="mobile-more-panel">
                      <div className="mobile-more-title">Recursos de Viagem:</div>
                      <button type="button" className="mobile-select" onClick={() => setScreen('travel')}>
                        <span>✈ Programar Viagem</span>
                        <span>⌄</span>
                      </button>
                      <button type="button" className="mobile-open-resource" onClick={() => setScreen('travel')}>
                        Abrir Recurso
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}

          {screen === 'travel' ? (
            <section className="mobile-travel-card">
              <button type="button" className="mobile-back mobile-back-inline" onClick={() => setScreen('menu')}>
                ← Voltar ao Menu
              </button>
              <div className="mobile-travel-panel">
                <h3>Programar Nova Viagem</h3>
                <p>Planeje o uso de cartões no exterior com segurança.</p>

                <label className="mobile-label">Cidade de Destino</label>
                <input
                  className="form-control mobile-input"
                  placeholder="Ex: Paris"
                  value={travelForm.cidade_destino}
                  onChange={(e) => updateTravel('cidade_destino', e.target.value)}
                />

                <div className="mobile-two-cols">
                  <div>
                    <label className="mobile-label">Estado/Região</label>
                    <input
                      className="form-control mobile-input"
                      placeholder="Ex: Île-de-France"
                      value={travelForm.estado_destino}
                      onChange={(e) => updateTravel('estado_destino', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mobile-label">País</label>
                    <input
                      className="form-control mobile-input"
                      placeholder="Ex: França"
                      value={travelForm.pais_destino}
                      onChange={(e) => updateTravel('pais_destino', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mobile-two-cols">
                  <div>
                    <label className="mobile-label">Data de Início</label>
                    <input
                      type="date"
                      className="form-control mobile-input"
                      value={travelForm.data_inicio}
                      onChange={(e) => updateTravel('data_inicio', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mobile-label">Data de Fim</label>
                    <input
                      type="date"
                      className="form-control mobile-input"
                      value={travelForm.data_fim}
                      onChange={(e) => updateTravel('data_fim', e.target.value)}
                    />
                  </div>
                </div>

                {travelStatus ? <div className="mobile-travel-status">{travelStatus}</div> : null}

                <button type="button" className="btn btn-bb-yellow w-100 mt-3" onClick={enviarViagem}>
                  Abrir Recurso
                </button>
              </div>
            </section>
          ) : null}

          {screen === 'service' ? (
            <section className="mobile-chat-card">
              <button type="button" className="mobile-menu-row mobile-chat-row">
                <span className="mobile-menu-left">
                  <span className="mobile-menu-icon">💬</span>
                  <span>Chat de Atendimento</span>
                </span>
                <span className="mobile-menu-arrow">⌄</span>
              </button>
            </section>
          ) : null}
        </main>

        <footer className="bb-bottom-nav bb-bottom-nav-5">
          <button type="button" className={`nav-tab ${screen === 'menu' ? 'active' : ''}`} onClick={() => setScreen('menu')}>
            <i>≡</i>
            <span>Menu</span>
          </button>
          <button type="button" className={`nav-tab ${screen === 'inicio' ? 'active' : ''}`} onClick={() => setScreen('inicio')}>
            <i>⌂</i>
            <span>Início</span>
          </button>
          <button type="button" className="nav-tab" onClick={() => setScreen('busca')}>
            <i>⌕</i>
            <span>Busca</span>
          </button>
          <button type="button" className="nav-tab" onClick={() => setScreen('notificacoes')}>
            <i>◔</i>
            <span>Notificações</span>
            <span className="nav-tab-badge">99+</span>
          </button>
          <button type="button" className="nav-tab" onClick={() => setScreen('perfil')}>
            <i>☺</i>
            <span>Perfil</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function MobilePage() {
  const router = useRouter();
  return (
    <div onDoubleClick={() => router.push('/')}>
      <MobileHome />
    </div>
  );
}
