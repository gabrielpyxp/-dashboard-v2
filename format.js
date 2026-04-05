// js/utils/format.js — Formatação de números, datas e strings

export const fmt = v =>
  'R$ ' + Math.abs(+v || 0).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const fmtSign = v => (v < 0 ? '-' : '') + fmt(v);

export const fmtPct = v => (+v || 0).toFixed(1) + '%';

export const fmtDate = iso => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const fmtDatetime = ts => {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

export const fmtRelative = ts => {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'agora mesmo';
  if (m < 60)  return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `há ${h}h`;
  return fmtDatetime(ts);
};

export const clamp = (v, a, b) => Math.min(Math.max(+v || 0, a), b);

export const todayISO = () => new Date().toISOString().split('T')[0];

export const todayLong = () =>
  new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
