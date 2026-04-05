// js/pages/dashboard.js — Renderização da página Dashboard

import { getState } from '../state.js';
import { fmt, fmtSign, clamp } from '../utils/format.js';
import { san } from '../utils/security.js';
import { sh, st, setStyle, toggleClass } from '../utils/dom.js';
import { STATUS } from '../config.js';
import { renderCharts } from '../components/charts.js';

export function renderDashboard() {
  renderKPIs();
  renderMeta();
  renderTableMain();
  renderCharts();
}

function renderKPIs() {
  const { sales } = getState();
  const rec  = sales.reduce((a, s) => a + +s.venda, 0);
  const luc  = sales.reduce((a, s) => a + +s.lucro, 0);
  const marg = sales.length ? sales.reduce((a, s) => a + +s.margem, 0) / sales.length : 0;

  st('k-rec',   fmt(rec));
  st('k-rec-s', sales.length + ' vendas');
  st('k-luc',   fmtSign(luc));
  st('k-luc-s', (luc >= 0 ? '↑ ' : '↓ ') + fmt(luc));
  const badge = document.getElementById('k-luc-s');
  if (badge) badge.className = 'kbadge ' + (luc >= 0 ? 'up' : 'dn');
  st('k-marg', marg.toFixed(1) + '%');
  st('k-tot',  String(sales.length));
  st('sb-lucro', fmtSign(luc));
}

export function renderMeta() {
  const { sales, meta } = getState();
  const luc = sales.reduce((a, s) => a + +s.lucro, 0);
  const pct = clamp((luc / meta) * 100, 0, 100);
  setStyle('meta-bar',  'width', pct + '%');
  setStyle('meta-bar2', 'width', pct + '%');
  st('meta-pct-lbl', pct.toFixed(0) + '%');
  st('meta-pct2',    pct.toFixed(0) + '%');
  st('meta-luc-lbl', fmtSign(luc) + ' conquistado');
  st('meta-goal-lbl', fmt(meta));
}

export function renderTableMain() {
  const q = (document.getElementById('search')?.value ?? '').toLowerCase();
  const d = getState().sales.filter(s => s.produto.toLowerCase().includes(q));
  sh('tbody-main', d.length
    ? d.map(rowHTML).join('')
    : emptyRow(9, 'Nenhuma venda registrada. Clique em "+ Nova Venda".'));
}

export function rowHTML(s) {
  const { cls, label } = STATUS[s.status] || STATUS.pendente;
  const img = s.foto_url
    ? `<img class="pthumb" src="${san(s.foto_url)}" alt="" loading="lazy">`
    : thumbPH();
  return `<tr>
    <td class="tdm">${san(s.data || '—')}</td>
    <td><div class="pcell">${img}<span class="tdn">${san(s.produto)}</span></div></td>
    <td>${fmt(+s.custo)}</td>
    <td>${fmt(+s.venda)}</td>
    <td class="${+s.lucro >= 0 ? 'tdg' : 'tdr'}">${fmtSign(+s.lucro)}</td>
    <td>${(+s.margem || 0).toFixed(1)}%</td>
    <td class="tdm">${san(s.marketplace || '')}</td>
    <td><span class="pill ${cls}"><span class="dot"></span>${label}</span></td>
    <td><button class="icon-btn danger" data-action="deleteVenda" data-id="${s.id}" title="Remover">
      <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
    </button></td>
  </tr>`;
}

export function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="td-empty">${msg}</td></tr>`;
}

export function thumbPH() {
  return `<div class="pthumb pthumb-ph"><svg viewBox="0 0 24 24" fill="none" stroke="var(--white3)" stroke-width="1.5" style="width:13px;height:13px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
}
