// js/services/historico.service.js — Log de ações

import { sb } from '../config.js';
import { getState, setState } from '../state.js';
import { cap } from '../utils/security.js';

export async function loadHistorico() {
  const { user } = getState();
  if (!user) return;
  const { data } = await sb
    .from('historico')
    .select('*')
    .eq('user_id', user.id)
    .order('ts', { ascending: false })
    .limit(100);
  setState({ hist: data || [] });
}

export async function logHistory(acao, entidade, detalhe) {
  const { user } = getState();
  if (!user) return;
  try {
    await sb.from('historico').insert({
      user_id:  user.id,
      acao,
      entidade,
      detalhe: cap(detalhe, 200),
      usuario: user.email,
      ts:      Date.now(),
    });
  } catch { /* não bloqueia por falha de log */ }
}
