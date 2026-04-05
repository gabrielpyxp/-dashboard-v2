// js/components/charts.js — Wrappers do Chart.js

import { getState, setState } from '../state.js';
import { fmt } from '../utils/format.js';

export function renderCharts() {
  renderBar();
  renderDoughnut();
  renderRevenueLine();
}

function renderBar() {
  const { sales, chartBar } = getState();
  if (chartBar) { chartBar.destroy(); setState({ chartBar: null }); }

  const ctx = document.getElementById('chartBar');
  if (!ctx) return;

  const recent = [...sales].slice(0, 10).reverse();

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: recent.map(s => s.produto.length > 10 ? s.produto.slice(0, 10) + '…' : s.produto),
      datasets: [{
        data: recent.map(s => parseFloat((+s.lucro).toFixed(2))),
        backgroundColor: recent.map(s => +s.lucro >= 0 ? 'rgba(26,255,110,.7)' : 'rgba(255,77,77,.65)'),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => ' R$ ' + (+ctx.raw).toFixed(2).replace('.', ',') },
      }},
      scales: {
        x: { ticks: { color: '#767670', font: { size: 10 } }, grid: { display: false }, border: { display: false } },
        y: { ticks: { color: '#767670', font: { size: 10 }, callback: v => 'R$' + v }, grid: { color: 'rgba(255,255,255,.03)' }, border: { display: false } },
      },
    },
  });
  setState({ chartBar: chart });
}

function renderDoughnut() {
  const { sales, chartDoughnut } = getState();
  if (chartDoughnut) { chartDoughnut.destroy(); setState({ chartDoughnut: null }); }

  const ctx = document.getElementById('chartDoughnut');
  if (!ctx) return;

  const b10 = sales.filter(s => +s.margem < 10).length;
  const m30 = sales.filter(s => +s.margem >= 10 && +s.margem < 30).length;
  const a30 = sales.filter(s => +s.margem >= 30).length;

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['< 10%', '10–30%', '> 30%'],
      datasets: [{ data: [b10, m30, a30], backgroundColor: ['#ff4d4d', '#ffc800', '#1aff6e'], borderWidth: 0, hoverOffset: 6 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: { legend: { position: 'bottom', labels: { color: '#767670', font: { size: 11 }, padding: 14, boxWidth: 10 } } },
    },
  });
  setState({ chartDoughnut: chart });
}

/**
 * Gráfico de linha — evolução da receita acumulada nos últimos 30 dias.
 */
function renderRevenueLine() {
  const { sales, chartRevLine } = getState();
  if (chartRevLine) { chartRevLine.destroy(); setState({ chartRevLine: null }); }

  const ctx = document.getElementById('chartRevLine');
  if (!ctx) return;

  // Constrói os últimos 30 dias a partir de hoje
  const now = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Mapeia vendas por dia
  const dailySales = {};
  sales.forEach(s => {
    const dia = s.data || '';
    if (dailySales[dia]) dailySales[dia] += +s.venda;
    else dailySales[dia] = +s.venda;
  });

  // Receita acumulada ao longo dos 30 dias
  let cumulative = 0;
  const labels = [];
  const data   = [];
  days.forEach(d => {
    cumulative += (dailySales[d] || 0);
    data.push(parseFloat(cumulative.toFixed(2)));
    labels.push(d.slice(5).replace('-', '/')); // "MM/DD" curto
  });

  // só monta se houver dado
  if (cumulative === 0) {
    const blank = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ data: Array(30).fill(0), borderColor: 'rgba(26,255,110,.4)', borderWidth: 2, pointRadius: 0, tension: .4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { ticks: { color: '#767670', font: { size: 9 }, maxTicksLimit: 10 }, grid: { display: false }, border: { display: false } },
          y: { ticks: { color: '#767670', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.03)' }, border: { display: false } },
        },
      },
    });
    setState({ chartRevLine: blank });
    return;
  }

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: 'rgba(26,255,110,.7)',
        backgroundColor: 'rgba(26,255,110,.06)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
        tension: .4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: c => 'Acumulado: ' + fmt(+c.raw) },
      }},
      scales: {
        x: { ticks: { color: '#767670', font: { size: 9 }, maxTicksLimit: 10 }, grid: { display: false }, border: { display: false } },
        y: { ticks: { color: '#767670', font: { size: 9 }, callback: v => fmt(v) }, grid: { color: 'rgba(255,255,255,.03)' }, border: { display: false } },
      },
    },
  });
  setState({ chartRevLine: chart });
}

