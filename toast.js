// js/components/toast.js — Notificações toast

import { $ } from '../utils/dom.js';

let _timer = null;

export function toast(msg, type = 'ok') {
  const el  = $('toast');
  const msg_el = $('toast-msg');
  const icon   = $('toast-icon');
  if (!el || !msg_el) return;

  msg_el.textContent = msg;

  if (icon) {
    icon.style.stroke = type === 'ok' ? 'var(--green)' : 'var(--red)';
    // Troca ícone
    if (type === 'ok') {
      icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    } else {
      icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    }
  }

  el.className = 'toast show';
  clearTimeout(_timer);
  _timer = setTimeout(() => el.classList.remove('show'), 3500);
}

export const toastOk  = msg => toast(msg, 'ok');
export const toastErr = msg => toast(msg, 'err');
