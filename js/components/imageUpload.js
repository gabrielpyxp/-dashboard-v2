// js/components/imageUpload.js — Upload e preview de imagem

import { $ } from '../utils/dom.js';
import { toBase64 } from '../utils/security.js';
import { setState } from '../state.js';
import { toastErr } from './toast.js';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export function renderImgArea(previewUrl) {
  const area = $('img-area');
  if (!area) return;

  if (previewUrl) {
    area.classList.add('hasimg');
    area.innerHTML = `
      <img class="iprev" src="${previewUrl}" alt="preview">
      <button class="iremove" data-action="removeImg" type="button">× Remover</button>
      <input type="file" accept="${ACCEPT}" data-action="fotoChange" class="hidden-input" aria-label="Trocar foto">`;
  } else {
    area.classList.remove('hasimg');
    area.innerHTML = `
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <div class="itxt">Clique para adicionar foto</div>
      <div class="isub">JPG, JPEG, PNG ou WebP — máx 3MB</div>
      <input type="file" id="fp-foto" accept="${ACCEPT}" data-action="fotoChange" class="hidden-input" aria-label="Selecionar foto">`;
  }
}

export async function handleFotoChange(input) {
  const file = input?.files?.[0];
  if (!file) return;

  // Validacao simples: tipo e tamanho
  const ok = file.type.startsWith('image/');
  if (!ok) { toastErr('Formato inválido. Use JPG, PNG ou WebP.'); input.value = ''; return; }
  if (file.size > 3 * 1024 * 1024) { toastErr('Imagem maior que 3MB.'); input.value = ''; return; }

  // Converte para base64 para a IA
  let base64 = null, mimeType = null;
  try {
    base64    = await toBase64(file);
    mimeType  = file.type;
  } catch { /* não bloqueia */ }

  setState({ fotoFile: file, fotoBase64: base64, fotoMimeType: mimeType });

  const url = URL.createObjectURL(file);
  renderImgArea(url);

  // Mostra painel de IA
  const panel = $('ai-panel');
  if (panel) panel.style.display = 'block';
}

export function removeImg() {
  setState({ fotoFile: null, editImgUrl: null, fotoBase64: null, fotoMimeType: null, aiResults: [] });
  renderImgArea(null);
  const panel = $('ai-panel');
  if (panel) panel.style.display = 'none';
  const res = $('ai-results');
  if (res) res.innerHTML = '';
}

/** Mostra o painel de IA mesmo sem imagem (geração por dados textuais) */
export function showAiPanel() {
  const panel = $('ai-panel');
  if (panel) panel.style.display = 'block';
}
