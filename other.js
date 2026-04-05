// js/pages/other.js — Páginas Análise, Metas, Histórico e Vendas

import { getState } from '../state.js';
import { fmt, fmtSign, fmtDatetime } from '../utils/format.js';
import { san } from '../utils/security.js';
import { sh, st, setStyle } from '../utils/dom.js';
import { clamp } from '../utils/format.js';
import { rowHTML, emptyRow } from './dashboard.js';

// ── Análise ──────────────────────────────────────────────
export function renderAnalise() {
  const { sales } = getState();
  const map = {};
  sales.forEach(s => {
    if (!map[s.produto]) map[s.produto] = { n: 0, custo: 0, venda: 0, lucro: 0 };
    map[s.produto].n++;
    map[s.produto].custo += +s.custo;
    map[s.produto].venda += +s.venda;
    map[s.produto].lucro += +s.lucro;
  });

  const rows = Object.entries(map)
    .sort((a, b) => b[1].lucro - a[1].lucro)
    .map(([nome, d]) => `
      <tr>
        <td class="tdn">${san(nome)}</td>
        <td>${d.n}</td>
        <td>${fmt(d.custo / d.n)}</td>
        <td>${fmt(d.venda / d.n)}</td>
        <td class="${d.lucro >= 0 ? 'tdg' : 'tdr'}">${fmtSign(d.lucro)}</td>
        <td>${d.venda > 0 ? ((d.lucro / d.venda) * 100).toFixed(1) : '0.0'}%</td>
      </tr>`)
    .join('');

  sh('tbody-analise', rows || emptyRow(6, 'Nenhum dado. Registre vendas para ver a análise.'));
}

// ── Metas ─────────────────────────────────────────────────
export function renderMetas() {
  const { sales, meta } = getState();
  const luc  = sales.reduce((a, s) => a + +s.lucro, 0);
  const rec  = sales.reduce((a, s) => a + +s.venda, 0);
  const cus  = sales.reduce((a, s) => a + +s.custo, 0);
  const marg = sales.length ? sales.reduce((a, s) => a + +s.margem, 0) / sales.length : 0;
  const pct  = clamp((luc / meta) * 100, 0, 100);

  st('meta-goal-big', fmt(meta));
  setStyle('meta-bar2', 'width', pct + '%');
  st('meta-pct2', pct.toFixed(0) + '%');
  const inp = document.getElementById('meta-inp');
  if (inp) inp.value = meta;

  // Melhor marketplace
  const mktMap = {};
  sales.forEach(s => { mktMap[s.marketplace] = (mktMap[s.marketplace] || 0) + +s.lucro; });
  const bestMkt = Object.entries(mktMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  sh('metas-summ', `
    <div class="srow"><span>Receita total</span><span class="sval">${fmt(rec)}</span></div>
    <div class="srow"><span>Custo total</span><span class="sval">${fmt(cus)}</span></div>
    <div class="srow"><span>Lucro líquido</span><span class="sval g">${fmtSign(luc)}</span></div>
    <div class="srow"><span>Margem média</span><span class="sval">${marg.toFixed(1)}%</span></div>
    <div class="srow"><span>Total de vendas</span><span class="sval">${sales.length}</span></div>
    <div class="srow"><span>Melhor marketplace</span><span class="sval">${san(bestMkt)}</span></div>
  `);
}

// ── Histórico ─────────────────────────────────────────────
export function renderHistorico() {
  const { hist } = getState();
  st('hist-count', hist.length + ' registros');
  if (!hist.length) {
    sh('hist-list', '<div class="hist-empty">Nenhuma atividade ainda.</div>');
    return;
  }
  const COLORS = { criado: 'dot-ok', editado: 'dot-warn', removido: 'dot-bad' };
  sh('hist-list', hist.map(h => `
    <div class="hitem">
      <div class="hdot ${COLORS[h.acao] || 'dot-warn'}"></div>
      <div class="hitem-body">
        <div class="hacao">${san(h.detalhe || '')}</div>
        <div class="hmeta">${fmtDatetime(h.ts)} · ${san(h.usuario || '')} · ${san(h.entidade || '')}</div>
      </div>
    </div>
  `).join(''));
}

// ── Vendas page ────────────────────────────────────────────
export function renderVendasPage() {
  const mkt = document.getElementById('filter-mkt')?.value ?? '';
  const d   = mkt ? getState().sales.filter(s => s.marketplace === mkt) : getState().sales;
  sh('tbody-vendas', d.length
    ? d.map(rowHTML).join('')
    : emptyRow(9, 'Nenhuma venda registrada.'));
}
