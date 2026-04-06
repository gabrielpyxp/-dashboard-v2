// js/app.js — Ponto de entrada da aplicação

import { sb, MARKETPLACES, CATEGORIAS, AI_FUNCTION_URL } from './config.js';
import { getState, setState, subscribe } from './state.js';
import { initAuthListener, login, signup, forgotPassword, logout } from './services/auth.service.js';
import { loadVendas, createVenda, updateVenda, deleteVenda } from './services/vendas.service.js';
import { loadProdutos, saveProduto, deleteProduto, ajustarEstoque } from './services/produtos.service.js';
import { loadHistorico } from './services/historico.service.js';
import { loadConfig, saveMeta } from './services/config.service.js';
import { initRealtime } from './services/realtime.service.js';
import { generateTitles } from './services/ai.service.js';
import { renderDashboard, renderTableMain, renderMeta } from './pages/dashboard.js';
import { renderCatalogo } from './pages/catalogo.js';
import { renderAnalise, renderMetas, renderHistorico, renderVendasPage, resetVendasFilter } from './pages/other.js';
import { initAgenteImgArea, renderAgenteResults, removeAgenteImg } from './pages/agente.js';
import { renderImgArea, handleFotoChange, removeImg, showAiPanel } from './components/imageUpload.js';
import { renderCharts } from './components/charts.js';
import { toast, toastOk, toastErr } from './components/toast.js';
import { $, $$, gv, sv, sh, st, show, hide, toggle, setMsg, clearMsg, btnLoading, clearInputs } from './utils/dom.js';
import { todayISO, todayLong, fmt } from './utils/format.js';
import { san, cap } from './utils/security.js';
import { toBase64 } from './utils/security.js';
import { saveDraft, loadDraft, clearDraft, hasDraft } from './utils/draft.js';

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  initAuthListener(onLogin, onLogout);
  initEvents();
  initKeyboard();
});

// ── Reage a mudanças de dados ─────────────────────────────
subscribe('sales', () => {
  renderDashboard();
  renderVendasPage();
  renderAnalise();
  renderMetas();
});
subscribe('produtos', () => {
  renderCatalogo();
});
subscribe('hist', () => {
  renderHistorico();
});
subscribe('meta', () => {
  renderMeta();
  renderMetas();
});

// ── Auth ──────────────────────────────────────────────────
async function onLogin(user) {
  $('auth-page')?.classList.remove('show');
  $('sidebar').style.display  = 'flex';
  $('main').style.display     = 'block';
  $('mob-hdr').style.display  = '';
  $('ls')?.classList.add('hide');

  // Usuário na sidebar
  const email    = user.email || '';
  const initials = email.charAt(0).toUpperCase();
  st('u-av',    initials);
  st('u-name',  email.split('@')[0]);
  st('u-email', email);
  st('today-lbl', todayLong());

  // Carrega todos os dados em paralelo
  await Promise.all([loadVendas(), loadProdutos(), loadHistorico(), loadConfig()]);
  initRealtime();
}

function onLogout() {
  $('ls')?.classList.add('hide');
  $('auth-page')?.classList.add('show');
  $('sidebar').style.display  = 'none';
  $('main').style.display     = 'none';
  $('mob-hdr').style.display  = 'none';
  setState({ sales: [], produtos: [], hist: [], meta: 500 });
}

// ── Navegação ─────────────────────────────────────────────
function navTo(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  $('page-' + page)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  if (window.innerWidth <= 768) toggleSidebar(false);

  // Render sob demanda
  const renders = {
    dashboard: renderDashboard,
    vendas:    renderVendasPage,
    produtos:  renderCatalogo,
    analise:   renderAnalise,
    metas:     renderMetas,
    historico: renderHistorico,
    agente:    () => { initAgenteImgArea(); },
  };
  renders[page]?.();
}

function toggleSidebar(force) {
  const sb2 = $('sidebar'), ov = $('overlay');
  const open = force !== undefined ? force : !sb2.classList.contains('open');
  sb2.classList.toggle('open', open);
  ov?.classList.toggle('open', open);
}

// ── Modal Venda ───────────────────────────────────────────
function openVendaModal(editId) {
  // Limpa modo de edição
  sv('fv-id', editId || '');

  if (editId) {
    // Modo edição: preenche campos com dados existentes
    const venda = getState().sales.find(s => s.id === editId);
    if (!venda) return;
    $('mv-title').textContent = 'Editar Venda';
    sv('fv-prod', venda.produto);
    sv('fv-custo', venda.custo);
    sv('fv-venda', venda.venda);
    sv('fv-data', venda.data || todayISO());
    sv('fv-mkt', venda.marketplace || '');
    sv('fv-status', venda.status || 'lucro');
    onProdSel();
    calcLucro();
    $('draft-note')?.classList.remove('show');
  } else {
    // Modo criação
    $('mv-title').textContent = 'Registrar Venda';
    sv('fv-data', todayISO());
    clearInputs('fv-prod', 'fv-custo', 'fv-venda');
    $('lucro-prev').style.display = 'none';
    $('sale-prev')?.classList.remove('show');

    // Preenche datalist com produtos do catálogo
    $('prod-list').innerHTML = getState().produtos
      .map(p => `<option value="${san(p.nome)}">`)
      .join('');

    // Restaura rascunho
    const uid = getState().user?.id;
    const draft = loadDraft(uid);
    const hasDr = !!(draft?.prod || draft?.custo || draft?.venda);
    if (hasDr && draft) {
      if (draft.prod)   sv('fv-prod',   draft.prod);
      if (draft.custo)  sv('fv-custo',  draft.custo);
      if (draft.venda)  sv('fv-venda',  draft.venda);
      if (draft.mkt)    sv('fv-mkt',    draft.mkt);
      if (draft.status) sv('fv-status', draft.status);
      onProdSel();
      calcLucro();
    }
    $('draft-note')?.classList.toggle('show', hasDr);
  }
  openModal('modal-venda');
  setTimeout(() => $('fv-prod')?.focus(), 120);
}

function closeVendaModal() { closeModal('modal-venda'); }

function onProdSel() {
  draftVenda();
  const name = gv('fv-prod').trim();
  const p    = getState().produtos.find(x => x.nome === name);
  if (p) {
    if (!gv('fv-custo')) sv('fv-custo', p.custo);
    if (!gv('fv-venda')) sv('fv-venda', p.venda);
    calcLucro();
    st('sp-name', p.nome);
    st('sp-info', p.categoria + (p.fornecedor ? ' · ' + p.fornecedor : ''));
    const img = $('sp-img');
    if (img) { img.src = p.foto_url || ''; img.style.display = p.foto_url ? 'block' : 'none'; }
    $('sale-prev')?.classList.add('show');
  } else {
    $('sale-prev')?.classList.remove('show');
  }
}

function calcLucro() {
  draftVenda();
  const c = parseFloat(gv('fv-custo')) || 0;
  const v = parseFloat(gv('fv-venda')) || 0;
  const el = $('lucro-prev');
  if (c > 0 && v > 0) {
    const l = v - c, m = ((l / v) * 100).toFixed(1);
    const sign = l < 0 ? '-' : '';
    el.innerHTML = `Lucro: <strong>${sign}R$ ${Math.abs(l).toFixed(2).replace('.', ',')}</strong> &nbsp;·&nbsp; Margem: <strong>${m}%</strong>`;
    el.style.display = 'block';
    el.classList.toggle('loss', l < 0);
  } else {
    el.style.display = 'none';
  }
}

function draftVenda() {
  const uid = getState().user?.id;
  saveDraft(uid, {
    prod: gv('fv-prod'), custo: gv('fv-custo'),
    venda: gv('fv-venda'), mkt: gv('fv-mkt'), status: gv('fv-status'),
  });
}

async function handleSaveVenda() {
  const editId   = gv('fv-id') || null;           // Define se é edição
  const produto  = cap(san(gv('fv-prod').trim()), 150);
  const custo    = parseFloat(gv('fv-custo'));
  const vendaVal = parseFloat(gv('fv-venda'));
  if (!produto || isNaN(custo) || isNaN(vendaVal) || custo < 0 || vendaVal < 0) {
    toastErr('Preencha todos os campos obrigatórios.'); return;
  }
  const p = getState().produtos.find(x => x.nome === produto);
  const fields = {
    data: gv('fv-data'), produto, custo, venda: vendaVal,
    marketplace: gv('fv-mkt'), status: gv('fv-status'),
    foto_url: p?.foto_url || null,
  };

  let error;
  if (editId) {
    // Modo edição: atualiza venda existente
    btnLoading('btn-sv', true, 'Salvando...');
    ({ error } = await updateVenda(editId, fields));
  } else {
    // Modo criação
    btnLoading('btn-sv', true, 'Salvando...');
    ({ error } = await createVenda(fields));
  }

  btnLoading('btn-sv', false, 'Salvar');
  if (error) { toastErr('Erro: ' + error.message); return; }
  clearDraft(getState().user?.id);
  closeVendaModal();
  toastOk(editId ? 'Venda atualizada!' : 'Venda registrada!');
}

// ── Modal Produto ─────────────────────────────────────────
function openProdModal(editId) {
  setState({ fotoFile: null, editImgUrl: null, fotoBase64: null, fotoMimeType: null, aiResults: [] });
  renderImgArea(null);
  sh('ai-results', '');
  $('ai-panel').style.display  = 'none';
  $('prod-mprev').style.display = 'none';

  $('prod-mtitle').textContent = editId ? 'Editar Produto' : 'Cadastrar Produto';
  sv('fp-id', editId || '');

  if (editId) {
    const p = getState().produtos.find(x => x.id === editId);
    if (p) {
      sv('fp-nome',  p.nome);
      sv('fp-desc',  p.descricao || '');
      sv('fp-cat',   p.categoria || '');
      sv('fp-forn',  p.fornecedor || '');
      sv('fp-custo', p.custo);
      sv('fp-venda', p.venda);
      sv('fp-est',   p.estoque);
      sv('fp-min',   p.estoque_min);
      sv('fp-obs',   p.obs || '');
      if (p.foto_url) {
        setState({ editImgUrl: p.foto_url });
        renderImgArea(p.foto_url);
        $('ai-panel').style.display = 'block';
      }
      calcMargemProd();
    }
  } else {
    clearInputs('fp-nome','fp-desc','fp-forn','fp-obs','fp-custo','fp-venda');
    sv('fp-est', '0'); sv('fp-min', '2');
  }
  openModal('modal-prod');
  setTimeout(() => $('fp-nome')?.focus(), 120);
}

function closeProdModal() { closeModal('modal-prod'); }

function calcMargemProd() {
  const c  = parseFloat(gv('fp-custo')) || 0;
  const v  = parseFloat(gv('fp-venda')) || 0;
  const el = $('prod-mprev');
  if (!el) return;
  if (c > 0 && v > 0) {
    const l = v - c, m = ((l / v) * 100).toFixed(1);
    const sign = l < 0 ? '-' : '';
    el.innerHTML = `Lucro unit.: <strong>${sign}R$ ${Math.abs(l).toFixed(2).replace('.', ',')}</strong> &nbsp;·&nbsp; Margem: <strong>${m}%</strong>`;
    el.style.display = 'block';
    el.classList.toggle('loss', l < 0);
  } else {
    el.style.display = 'none';
  }
}

async function handleSaveProd() {
  const nome  = cap(san(gv('fp-nome').trim()), 150);
  const custo = parseFloat(gv('fp-custo'));
  const venda = parseFloat(gv('fp-venda'));
  if (!nome || isNaN(custo) || isNaN(venda)) {
    toastErr('Preencha nome, custo e preço de venda.'); return;
  }
  const editId = gv('fp-id') || null;
  const { fotoFile, editImgUrl } = getState();

  btnLoading('btn-sp', true, 'Salvando...');
  $('uprog').style.display = fotoFile ? 'flex' : 'none';

  const { error } = await saveProduto(
    { nome, descricao: gv('fp-desc'), categoria: gv('fp-cat'),
      fornecedor: gv('fp-forn'), custo, venda,
      estoque: parseInt(gv('fp-est')) || 0,
      estoqueMin: parseInt(gv('fp-min')) || 0,
      obs: gv('fp-obs') },
    fotoFile, editImgUrl, editId
  );

  $('uprog').style.display = 'none';
  btnLoading('btn-sp', false, 'Salvar Produto');

  if (error) { toastErr(typeof error === 'string' ? error : 'Erro ao salvar produto.'); return; }
  toastOk(editId ? 'Produto atualizado!' : 'Produto cadastrado!');
  closeProdModal();
}

// ── IA — geração de títulos ───────────────────────────────
async function handleGenerateAI() {
  const { fotoBase64, fotoMimeType, aiQtd } = getState();
  const btn = $('btn-generate-ai');
  const hasImage = !!(fotoBase64 && fotoMimeType);

  // Validação mínima: ou tem foto ou tem categoria ou tem nome
  const categoria = gv('fp-cat');
  const nomeAtual = gv('fp-nome').trim();
  if (!hasImage && !categoria && !nomeAtual) {
    toastErr('Adicione uma foto ou preencha o nome e categoria para usar a IA.');
    return;
  }

  // Mostra loading
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> Gerando com IA...'; }
  sh('ai-results', '<div class="ai-loading" style="text-align:center;padding:20px"><div class="spinner" style="width:24px;height:24px;display:inline-block;animation:pulse .8s ease-in-out infinite"></div><p style="margin-top:10px;color:var(--w3);font-size:13px">Gerando com IA...</p></div>');

  try {
    const results = await generateTitles({
      base64:     fotoBase64  || null,
      mimeType:   fotoMimeType || null,
      categoria,
      fornecedor: gv('fp-forn'),
      nomeAtual,
      quantidade: aiQtd,
    });

    setState({ aiResults: results });

    // Renderiza com badge de quantidade e cards de preview
    sh('ai-results', `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:12px;color:var(--w3)">${results.length} sugestão(ões) gerada(s)</span>
        <span class="ai-badge">${results.length}</span>
      </div>
    ` + results.map((r, i) => `
      <div class="ai-card" data-action="applyAITitle" data-index="${i}">
        <div class="ai-card-num">Opção ${i + 1}</div>
        <div class="ai-card-title">${san(r.titulo)}</div>
        ${r.descricao
          ? `<div class="ai-card-desc">${san(r.descricao)}</div>
             <button class="ai-apply" data-action="applyAIDesc" data-index="${i}" title="Usar esta descrição">↩ Usar esta</button>`
          : `<div class="ai-apply">↩ Usar este título</div>`
        }
      </div>
    `).join(''));
  } catch (err) {
    sh('ai-results', `<div class="ai-error">Erro: ${san(err.message)}</div>`);
    toastErr('Não foi possível gerar os títulos.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> ✦ Gerar com IA'; }
  }
}

/** Aplica descrição IA ao campo */
function applyAIDesc(index) {
  const r = getState().aiResults[index];
  if (!r || !r.descricao) return;
  sv('fp-desc', r.descricao);
  toastOk('Descrição aplicada!');
}

function applyAITitle(index) {
  const r = getState().aiResults[index];
  if (!r) return;
  sv('fp-nome', r.titulo);
  if (r.descricao) sv('fp-desc', r.descricao);
  toastOk('Título aplicado!');
}

// ── Agente IA — página dedicada ─────────────────────────────
let agenteQtd = 3;
let agenteFotoBase64 = null;
let agenteFotoMime = null;

async function handleGenerateAgente() {
  const instrucoes = gv('agente-instrucoes').trim();

  if (!instrucoes && !agenteFotoBase64) {
    toastErr('Adicione uma foto ou descreva o que deseja gerar.');
    return;
  }

  const btn = $('btn-agente-gerar');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> Gerando com IA...'; }

  const container = $('agente-results');
  container.innerHTML = '<div class="ai-loading" style="text-align:center;padding:40px"><div class="spinner" style="width:24px;height:24px;display:inline-block;animation:pulse .8s ease-in-out infinite"></div><p style="margin-top:12px;color:var(--w3);font-size:13px">Gerando títulos e descrições otimizados...</p></div>';
  st('agente-status', 'Gerando...');

  try {
    const payload = {
      base64:     agenteFotoBase64 || null,
      mimeType:   agenteFotoMime || null,
      instrucoes,
      quantidade: agenteQtd,
    };

    // Envia para a Edge Function
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(AI_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token ?? ''}`,
        'apikey': 'sb_publishable_v7V78T_wzWtu3ZXXIzPOpw_ZdlN1joW',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Erro: ${res.status}`);
    }

    const json = await res.json();
    const results = json.results || [];
    if (!results.length) throw new Error('A IA não retornou resultados.');

    setState({ aiResults: results });
    renderAgenteResults(results);
    toastOk(`${results.length} sugestão(ões) gerada(s)!`);
  } catch (err) {
    container.innerHTML = `<div class="ai-error" style="text-align:center;padding:40px;color:var(--red)"><p style="font-size:14px;font-weight:600">Erro ao gerar</p><p style="font-size:13px;margin-top:8px">${san(err.message)}</p></div>`;
    st('agente-status', 'Erro');
    toastErr('Falha na geração com IA.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Gerar com IA'; }
  }
}

/** Copia conteúdo para clipboard */
function copyToClipboard(index, descOnly = false) {
  const results = getState().aiResults;
  const r = results[index];
  if (!r) return;
  const text = descOnly ? (r.descricao || r.description || '') : (r.titulo || r.title || '');
  navigator.clipboard.writeText(text).then(() => toastOk(descOnly ? 'Descrição copiada!' : 'Título copiado!')).catch(() => toastErr('Falha ao copiar.'));
}

/** Salva resultado da IA direto no catálogo */
async function handleSaveAgenteResult(index) {
  const results = getState().aiResults;
  const r = results[index];
  if (!r) return;

  const nome = r.titulo?.trim() || 'Produto sem nome';
  const descricao = [r.descricaoCurta, r.descricaoLonga].filter(Boolean).join('\n\n');

  btnLoading('btn-agente-gerar', true, 'Salvando...');
  const { error } = await saveProduto(
    { nome, descricao, categoria: '', fornecedor: '', custo: 0, venda: 0, estoque: 0, estoqueMin: 0 },
    null, null, null
  );

  if (error) {
    toastErr(typeof error === 'string' ? error : 'Erro ao salvar produto.');
    btnLoading('btn-agente-gerar', false, 'Gerar com IA');
    return;
  }
  toastOk('Produto salvo no catálogo!');
  btnLoading('btn-agente-gerar', false, 'Gerar com IA');
}

// ── Exportar CSV (Vendas) ──────────────────────────────────
function exportCSV() {
  const { sales } = getState();
  if (!sales.length) { toastErr('Nenhuma venda para exportar.'); return; }
  const h = 'Data,Produto,Custo,Venda,Lucro,Margem,Marketplace,Status\n';
  const r = sales.map(s =>
    [s.data, s.produto, s.custo, s.venda,
     (+s.lucro).toFixed(2), (+s.margem || 0).toFixed(1) + '%',
     s.marketplace, s.status].join(',')
  ).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\uFEFF' + h + r], { type: 'text/csv;charset=utf-8;' })),
    download: `revendas_${todayISO()}.csv`,
  });
  a.click();
  toastOk('CSV exportado!');
}

// ── Exportar CSV (Produtos) ────────────────────────────────
function exportProdCSV() {
  const { produtos } = getState();
  if (!produtos.length) { toastErr('Nenhum produto para exportar.'); return; }
  const h = 'Nome,Descrição,Categoria,Custo,Venda,Lucro,Margem,Estoque,Fornecedor\n';
  const r = produtos.map(p => {
    const lucro = (+p.venda - +p.custo).toFixed(2);
    const margem = (+p.venda > 0 ? (((+p.venda - +p.custo) / +p.venda) * 100).toFixed(1) : '0.0');
    return [
      `"${(p.nome || '').replace(/"/g, '""')}"`,
      `"${(p.descricao || '').replace(/"/g, '""')}"`,
      p.categoria || '',
      +p.custo,
      +p.venda,
      lucro,
      margem + '%',
      +p.estoque || 0,
      `"${(p.fornecedor || '').replace(/"/g, '""')}"`,
    ].join(',');
  }).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\uFEFF' + h + r], { type: 'text/csv;charset=utf-8;' })),
    download: `produtos_${todayISO()}.csv`,
  });
  a.click();
  toastOk('Produtos exportados!');
}

// ── Auth forms ────────────────────────────────────────────
function switchTab(tab) {
  const isFg = tab === 'forgot';
  $('form-login').style.display  = tab === 'login'  ? '' : 'none';
  $('form-signup').style.display = tab === 'signup' ? '' : 'none';
  $('form-forgot').style.display = isFg ? '' : 'none';
  $('auth-tabs').style.display   = isFg ? 'none' : '';
  $('tab-login')?.classList.toggle('active',  tab === 'login');
  $('tab-signup')?.classList.toggle('active', tab === 'signup');
  const titles = {
    login:  ['Bem-vindo de volta',  'Entre na sua conta para continuar'],
    signup: ['Criar conta',         'Cadastre-se e comece agora'],
    forgot: ['Recuperar senha',     ''],
  };
  const [t, s] = titles[tab] || [];
  if (t) st('auth-title', t);
  if (s !== undefined) st('auth-sub', s);
  clearMsg('l-err', 's-err', 'f-err', 's-ok', 'f-ok');
}

function togglePass(inputId, btn) {
  const inp = $(inputId);
  if (!inp) return;
  const show_ = inp.type === 'password';
  inp.type = show_ ? 'text' : 'password';
  btn.innerHTML = show_
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

// ── Event delegation central ──────────────────────────────
function initEvents() {
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id, page, tab, input, delta, index, qty, modal } = el.dataset;

    switch (action) {
      // Auth
      case 'doLogin':    { const { error } = await login(gv('l-email').trim().toLowerCase(), gv('l-senha')); if (error) setMsg('l-err', error); break; }
      case 'doSignup':   { const { error } = await signup(gv('s-email').trim().toLowerCase(), gv('s-senha'), gv('s-conf')); if (error) setMsg('s-err', error); else setMsg('s-ok', 'Conta criada! Verifique seu email.', 'ok'); break; }
      case 'doForgot':   { const { error } = await forgotPassword(gv('f-email').trim().toLowerCase()); if (error) setMsg('f-err', error); else setMsg('f-ok', 'Link enviado! Verifique seu email.', 'ok'); break; }
      case 'doSignOut':  logout(getState().rtsubs); break;
      case 'switchTab':  switchTab(tab); break;
      case 'showForgot': switchTab('forgot'); break;
      case 'togglePass': togglePass(input, el); break;

      // Nav
      case 'navTo':        navTo(page); break;
      case 'toggleSidebar': toggleSidebar(); break;

      // Vendas
      case 'openVendaModal':  openVendaModal(); break;
      case 'closeVendaModal': closeVendaModal(); break;
      case 'saveVenda':       handleSaveVenda(); break;
      case 'deleteVenda': {
        if (!confirm('Remover esta venda?')) break;
        const { error } = await deleteVenda(id);
        if (error) toastErr('Erro ao remover venda.');
        else toastOk('Venda removida.');
        break;
      }
      case 'editVenda': {
        // Abre modal em modo edição com dados preenchidos
        openVendaModal(id);
        break;
      }
      case 'resetVendasFilter': {
        resetVendasFilter();
        break;
      }

      // Produto
      case 'openProdModal':  openProdModal(id || null); break;
      case 'closeProdModal': closeProdModal(); break;
      case 'saveProd':       handleSaveProd(); break;
      case 'removeImg':      removeImg(); break;
      case 'deleteProd': {
        if (!confirm('Remover este produto do catálogo?')) break;
        const { error } = await deleteProduto(id);
        if (error) toastErr('Erro ao remover produto.');
        else toastOk('Produto removido.');
        break;
      }
      case 'ajustarEstoque': ajustarEstoque(id, parseInt(delta)); break;

      // IA
      case 'showIA': {
        // Mostra painel de IA e foca no nome se vazio
        showAiPanel();
        if (!gv('fp-nome').trim()) {
          $('fp-nome')?.focus();
          toastErr('Preencha o nome ou categoria do produto.');
        }
        break;
      }
      case 'generateAI':    handleGenerateAI(); break;
      case 'applyAITitle':  applyAITitle(parseInt(index)); break;
      case 'applyAIDesc': {
        e.stopPropagation();
        applyAIDesc(parseInt(index));
        break;
      }
      case 'setAiQtd': {
        setState({ aiQtd: parseInt(qty) });
        $$('.ai-qty-btn').forEach(b => b.classList.toggle('active', b.dataset.qty === qty));
        break;
      }

      // Agente IA
      case 'generateAgente':       handleGenerateAgente(); break;
      case 'removeAgenteImg':      removeAgenteImg(); break;
      case 'saveAgenteResult':     handleSaveAgenteResult(parseInt(index)); break;
      case 'setAgenteQtd': {
        agenteQtd = parseInt(qty);
        $$('.ai-qty-btn').forEach(b => {
          if (b.closest('#agente-qty')) b.classList.toggle('active', b.dataset.qty === qty);
        });
        break;
      }

      // Meta
      case 'promptMeta': {
        const v = prompt('Nova meta de lucro mensal (R$):', getState().meta);
        const n = parseFloat(v);
        if (!isNaN(n) && n > 0) { await saveMeta(n); toastOk('Meta atualizada!'); }
        break;
      }
      case 'saveMeta2': {
        const n = parseFloat($('meta-inp')?.value);
        if (!isNaN(n) && n > 0) { await saveMeta(n); toastOk('Meta atualizada!'); }
        break;
      }

      // Misc
      case 'exportCSV':     exportCSV(); break;
      case 'exportProdCSV': exportProdCSV(); break;
      case 'closeModal':    closeModal(modal); break;
    }
  });

  // change — file input e selects
  document.addEventListener('change', async e => {
    const { action } = e.target.dataset;
    if (action === 'fotoChange') await handleFotoChange(e.target);
  });

  // input — cálculos em tempo real
  document.addEventListener('input', e => {
    const id = e.target.id;
    if (['fv-custo','fv-venda'].includes(id))  calcLucro();
    if (['fp-custo','fp-venda'].includes(id))  calcMargemProd();
    if (id === 'fv-prod')                      onProdSel();
    if (['fv-custo','fv-venda','fv-mkt','fv-status'].includes(id)) draftVenda();
    // Mostra painel de IA quando nome tem conteúdo (mínimo 3 chars)
    if (id === 'fp-nome' && e.target.value.trim().length >= 3) showAiPanel();
    if (['cat-search','cat-cat'].includes(id)) renderCatalogo();
  });

  // change — filtros de data/mkt da página Vendas
  document.addEventListener('change', e => {
    if (['filter-date-start','filter-date-end','filter-mkt'].includes(e.target.id)) {
      renderVendasPage();
    }
  });

  // Fecha modal ao clicar no overlay
  $$('.movl').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

function initKeyboard() {
  document.addEventListener('keydown', e => {
    const inAuth = $('auth-page')?.classList.contains('show');
    const inModal = $$('.movl.open').length > 0;

    // Escape: fecha qualquer modal aberto
    if (e.key === 'Escape') {
      $$('.movl.open').forEach(m => m.classList.remove('open'));
      if (inAuth) clearMsg('l-err', 's-err', 'f-err', 's-ok', 'f-ok');
      return;
    }

    // Atalhos apenas dentro do app (não no auth)
    if (inAuth) {
      if (e.key === 'Enter') {
        if ($('form-login').style.display  !== 'none') document.querySelector('[data-action="doLogin"]')?.click();
        else if ($('form-signup').style.display !== 'none') document.querySelector('[data-action="doSignup"]')?.click();
        else if ($('form-forgot').style.display !== 'none') document.querySelector('[data-action="doForgot"]')?.click();
      }
      return;
    }

    // Ctrl+N: Nova venda
    if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      openVendaModal();
    }

    // Ctrl+P: Novo produto
    if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      openProdModal();
    }

    // Ctrl+/: abre busca (foca no campo de busca ativo)
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      const searchEl = document.querySelector('.page.active #search, .page.active #cat-search');
      if (searchEl) searchEl.focus();
      else $('search')?.focus();
    }
  });
}

// ── Helpers modais ────────────────────────────────────────
const openModal  = id => $(id)?.classList.add('open');
const closeModal = id => $(id)?.classList.remove('open');

// ── Popula selects dinamicamente ──────────────────────────
function populateSelects() {
  const mkts = ['', ...MARKETPLACES];
  const addOpts = (id, opts, withEmpty = false) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = (withEmpty ? ['<option value="">Todos marketplaces</option>'] : [])
      .concat(MARKETPLACES.map(m => `<option>${m}</option>`)).join('');
  };

  const addCatOpts = (id, withEmpty = false) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = (withEmpty ? ['<option value="">Todas categorias</option>'] : [])
      .concat(CATEGORIAS.map(c => `<option>${c}</option>`)).join('');
  };

  // Modal venda
  const mktSel = $('fv-mkt');
  if (mktSel) mktSel.innerHTML = MARKETPLACES.map(m => `<option>${m}</option>`).join('');

  // Filtro vendas
  const mktFilter = $('filter-mkt');
  if (mktFilter) mktFilter.innerHTML =
    '<option value="">Todos marketplaces</option>' +
    MARKETPLACES.map(m => `<option>${m}</option>`).join('');

  // Categoria produto
  const catSel = $('fp-cat');
  if (catSel) catSel.innerHTML = CATEGORIAS.map(c => `<option>${c}</option>`).join('');

  // Filtro catálogo
  const catFilter = $('cat-cat');
  if (catFilter) catFilter.innerHTML =
    '<option value="">Todas categorias</option>' +
    CATEGORIAS.map(c => `<option>${c}</option>`).join('');
}
