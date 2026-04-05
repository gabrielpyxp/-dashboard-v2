// js/components/charts.js — Wrappers do Chart.js

import { getState, setState } from '../state.js';

export function renderCharts() {
  renderBar();
  renderDoughnut();
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
