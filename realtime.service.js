// js/services/realtime.service.js — Sincronização em tempo real

import { sb } from '../config.js';
import { getState, setState } from '../state.js';
import { loadVendas } from './vendas.service.js';
import { loadProdutos } from './produtos.service.js';
import { loadHistorico } from './historico.service.js';

export function initRealtime() {
  const { user } = getState();
  if (!user) return;

  // Cancela subs anteriores
  getState().rtsubs.forEach(s => sb.removeChannel(s));

  const uid = user.id;

  const c1 = sb.channel('rt-vendas')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas', filter: `user_id=eq.${uid}` },
      () => loadVendas())
    .subscribe();

  const c2 = sb.channel('rt-produtos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos', filter: `user_id=eq.${uid}` },
      () => loadProdutos())
    .subscribe();

  const c3 = sb.channel('rt-hist')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'historico', filter: `user_id=eq.${uid}` },
      () => loadHistorico())
    .subscribe();

  setState({ rtsubs: [c1, c2, c3] });
}

export function destroyRealtime() {
  getState().rtsubs.forEach(s => sb.removeChannel(s));
  setState({ rtsubs: [] });
}
