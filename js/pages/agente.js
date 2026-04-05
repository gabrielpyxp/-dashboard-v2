// js/pages/agente.js — Página do Agente de IA

import { getState, setState } from '../state.js';
import { san } from '../utils/security.js';
import { $, $$, gv, st } from '../utils/dom.js';

import { validateImage, toBase64 } from '../utils/security.js';
import { toast, toastOk, toastErr } from '../components/toast.js';

let agenteFotoBase64 = null;
let agenteFotoMime = null;
let agenteQtd = 3;
let agenteImgUrl = null;

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
      <button class="iremove" data-action="removeAgenteImg" type="button">×</button>
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

/** Renderiza os resultados com botão "Salvar" por opção */
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
      </div>
      <div class="ai-result-title">${san(r.titulo || r.title || '')}</div>
      ${r.descricao || r.description ? `<div class="ai-result-desc">${san(r.descricao || r.description || '')}</div>` : ''}
      <button data-action="saveAgenteResult" data-index="${i}" class="ai-save-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Salvar no catálogo
      </button>
    </div>
  `).join('');
}
