// js/pages/agente.js — Página do Agente de IA

import { CATEGORIAS } from '../config.js';
import { getState, setState } from '../state.js';
import { san } from '../utils/security.js';
import { $, $$, gv } from '../utils/dom.js';
import { validateImage, toBase64 } from '../utils/security.js';
import { toast, toastOk, toastErr } from '../components/toast.js';

let agenteFotoBase64 = null;
let agenteFotoMime = null;
let agenteQtd = 3;
let agenteImgUrl = null;

/** Popula o select de categorias da página agente */
export function initAgenteSelects() {
  const cat = $('agente-cat');
  if (cat) cat.innerHTML = CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('');
}

/** Setup click handlers for the image area */
export function initAgenteImgArea() {
  const area = $('agente-img-area');
  const input = $('agente-foto');
  if (!area || !input) return;

  area.addEventListener('click', () => input.click());
  input.addEventListener('change', handleAgenteFoto);

  // Drag and drop
  area.addEventListener('dragover', e => { e.preventDefault(); area.style.borderColor = 'var(--yellow)'; });
  area.addEventListener('dragleave', () => { area.style.borderColor = ''; });
  area.addEventListener('drop', async e => {
    e.preventDefault(); area.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) await processAgenteFile(file);
  });
}

async function handleAgenteFoto(e) {
  const file = e.target?.files?.[0];
  if (file) await processAgenteFile(file);
}

async function processAgenteFile(file) {
  const { ok, err } = await validateImage(file);
  if (!ok) { toastErr(err); return; }

  try {
    agenteFotoBase64 = await toBase64(file);
    agenteFotoMime = file.type;
  } catch { /* not blocking */ }

  agenteImgUrl = URL.createObjectURL(file);
  renderAgenteImgArea();
}

function renderAgenteImgArea() {
  const area = $('agente-img-area');
  if (!area) return;
  if (agenteImgUrl) {
    area.classList.add('hasimg');
    area.innerHTML = `
      <img class="iprev" src="${agenteImgUrl}" alt="preview">
      <button class="iremove" data-action="removeAgenteImg" type="button">× Remover</button>
      <input type="file" id="agente-foto" accept="image/jpeg,image/jpg,image/png,image/webp" class="hidden-input" aria-label="Trocar foto">`;
    const newInput = area.querySelector('input');
    if (newInput) newInput.addEventListener('change', handleAgenteFoto);
  } else {
    area.classList.remove('hasimg');
    area.innerHTML = `
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <div class="itxt">Clique ou arraste uma foto</div>
      <div class="isub">JPG, PNG ou WebP — máx 3MB</div>
      <input type="file" id="agente-foto" accept="image/jpeg,image/jpg,image/png,image/webp" class="hidden-input" aria-label="Selecionar foto">`;
    const newInput = area.querySelector('input');
    if (newInput) newInput.addEventListener('change', handleAgenteFoto);
  }
}

export function removeAgenteImg() {
  agenteFotoBase64 = null;
  agenteFotoMime = null;
  agenteImgUrl = null;
  renderAgenteImgArea();
}

/** Renderiza os resultados da IA */
export function renderAgenteResults(results) {
  const container = $('agente-results');
  if (!results || !results.length) {
    container.innerHTML = `
      <div class="ai-agent-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <p>Nenhum resultado gerado.</p>
      </div>`;
    return;
  }

  st('agente-status', `${results.length} gerada(s)`);
  container.innerHTML = results.map((r, i) => `
    <div class="ai-agent-result">
      <div class="ai-result-header">
        <span class="ai-result-num">Opção ${i + 1}</span>
        <div class="ai-result-actions">
          <button data-action="copyAITitle" data-index="${i}" title="Copiar título" class="ai-copy-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button data-action="copyAIDesc" data-index="${i}" title="Copiar descrição" class="ai-copy-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="ai-result-title">${san(r.titulo || r.title || '')}</div>
      ${r.descricao || r.description ? `<div class="ai-result-desc">${san(r.descricao || r.description || '')}</div>` : ''}
    </div>
  `).join('');
}
