// js/utils/draft.js — Rascunho automático do formulário de venda

const KEY = uid => `rv_draft_${uid}`;

export function saveDraft(uid, data) {
  if (!uid) return;
  try { localStorage.setItem(KEY(uid), JSON.stringify(data)); } catch { /* quota */ }
}

export function loadDraft(uid) {
  if (!uid) return null;
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || 'null'); } catch { return null; }
}

export function clearDraft(uid) {
  if (!uid) return;
  localStorage.removeItem(KEY(uid));
}

export function hasDraft(uid) {
  return !!loadDraft(uid);
}
