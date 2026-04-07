// js/pages/catalogo.js — Página do Catálogo de Produtos

import { getState } from '../state.js';
import { fmt, fmtSign } from '../utils/format.js';
import { san } from '../utils/security.js';
import { sh, st } from '../utils/dom.js';

export function renderCatalogo() {
  const { produtos } = getState();
  const q   = (document.getElementById('cat-search')?.value ?? '').toLowerCase();
  const cat = document.getElementById('cat-cat')?.value ?? '';
  const d   = produtos.filter(p =>
    p.nome.toLowerCase().includes(q) && (!cat || p.categoria === cat)
  );

  // KPIs do catálogo
  st('cat-tot', String(produtos.length));
  st('cat-est', String(produtos.filter(p => p.estoque > 0).length));
  st('cat-zer', String(produtos.filter(p => p.estoque <= 0).length));
  st('cat-val', fmt(produtos.reduce((a, p) => a + (+p.custo * (+p.estoque || 0)), 0)));

  const grid = document.getElementById('prod-grid');
  if (!grid) return;

  if (!d.length) {
    grid.innerHTML = `
      <div class="empty-full">
        <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <p>Nenhum produto cadastrado.<br>Clique em "+ Novo Produto" para começar.</p>
      </div>`;
    return;
  }

  grid.innerHTML = d.map(prodCard).join('');
}

function prodCard(p) {
  const al = +p.estoque <= +p.estoque_min;
  const ze = +p.estoque === 0;
  const sc = ze ? 'pill-bad' : al ? 'pill-warn' : 'pill-ok';
  const st_ = ze ? 'Sem estoque' : al ? 'Estoque baixo' : 'Em estoque';
  const lucroUnit = (+p.venda) - (+p.custo);
  const margemCalc = +p.venda > 0 ? ((lucroUnit / +p.venda) * 100) : 0;
  const mc = margemCalc >= 20 ? 'var(--green)' : margemCalc >= 0 ? 'var(--white2)' : 'var(--red)';

  const imgEl = p.foto_url && p.foto_url.length > 5
    ? `<img src="${san(p.foto_url)}" alt="${san(p.nome)}" class="pcard-img" loading="lazy">`
    : `<div class="pcard-img-ph"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

  return `
  <article class="pcard" style="${al && !ze ? 'border-color:rgba(255,200,0,.3)' : ''}">
    ${imgEl}
    <div class="pcbody">
      <div class="pcname" title="${san(p.nome)}">${san(p.nome)}</div>
      <div class="pctags">
        <span class="tag-cat">${san(p.categoria || '')}</span>
        <span class="pill ${sc}"><span class="dot"></span>${st_}</span>
      </div>
      ${p.descricao ? `<p class="pcdesc">${san(p.descricao)}</p>` : ''}
      <div class="pcgrid">
        <div class="pmini"><div class="pmlbl">Custo</div><div class="pmval">${fmt(+p.custo)}</div></div>
        <div class="pmini"><div class="pmlbl">Venda</div><div class="pmval">${fmt(+p.venda)}</div></div>
        <div class="pmini"><div class="pmlbl">Lucro</div><div class="pmval" style="color:${mc}">${fmtSign(+p.lucro_unit)}</div></div>
        <div class="pmini"><div class="pmlbl">Margem</div><div class="pmval" style="color:${mc}">${(+p.margem || 0).toFixed(1)}%</div></div>
      </div>
      ${p.fornecedor ? `<p class="pcforn"><span>Fornecedor:</span> ${san(p.fornecedor)}</p>` : ''}
      <div class="pcfoot">
        <div class="sctrl">
          <button class="scbtn" data-action="ajustarEstoque" data-id="${p.id}" data-delta="-1" aria-label="Diminuir estoque">−</button>
          <span class="scnum" style="color:${ze ? 'var(--red)' : al ? '#ffc800' : 'var(--white)'}">${p.estoque}</span>
          <button class="scbtn plus" data-action="ajustarEstoque" data-id="${p.id}" data-delta="1" aria-label="Aumentar estoque">+</button>
        </div>
        <div class="pcactions">
          <button class="icon-btn" data-action="openProdModal" data-id="${p.id}" title="Editar produto">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-action="deleteProd" data-id="${p.id}" title="Remover produto">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  </article>`;
}
