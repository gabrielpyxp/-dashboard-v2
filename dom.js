// js/utils/dom.js — Helpers de manipulação do DOM

export const $  = id  => document.getElementById(id);
export const $$ = sel => document.querySelectorAll(sel);

export const gv = id        => $(id)?.value ?? '';
export const sv = (id, v)   => { const el = $(id); if (el) el.value = v; };
export const gt = id        => $(id)?.textContent ?? '';
export const st = (id, t)   => { const el = $(id); if (el) el.textContent = t; };
export const sh = (id, h)   => { const el = $(id); if (el) el.innerHTML  = h; };
export const show = id      => { const el = $(id); if (el) el.style.display = ''; };
export const hide = id      => { const el = $(id); if (el) el.style.display = 'none'; };
export const toggle = (id, v) => { const el = $(id); if (el) el.style.display = v ? '' : 'none'; };
export const addClass    = (id, c) => $(id)?.classList.add(c);
export const removeClass = (id, c) => $(id)?.classList.remove(c);
export const toggleClass = (id, c, v) => $(id)?.classList.toggle(c, v);
export const setStyle = (id, prop, val) => { const el = $(id); if (el) el.style[prop] = val; };

export const clearInputs = (...ids) => ids.forEach(id => sv(id, ''));

/**
 * Cria elemento HTML a partir de template string.
 * @param {string} html
 * @returns {HTMLElement}
 */
export const html = str => {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
};

/** Bloqueia/desbloqueia botão com texto de loading */
export const btnLoading = (id, loading, text) => {
  const btn = $(id);
  if (!btn) return;
  btn.disabled = loading;
  if (text !== undefined) btn.textContent = text;
};

/** Seta mensagem de erro ou sucesso em elemento */
export const setMsg = (id, msg, type = 'err') => {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? '' : 'none';
  el.className = type === 'ok' ? 'auth-ok' : 'auth-err';
};

export const clearMsg = (...ids) => ids.forEach(id => setMsg(id, ''));
