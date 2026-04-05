// js/services/config.service.js — Configurações do usuário

import { sb } from '../config.js';
import { getState, setState } from '../state.js';

export async function loadConfig() {
  const { user } = getState();
  if (!user) return;
  const { data } = await sb.from('config').select('*').eq('user_id', user.id).single();
  if (data?.meta_mensal) setState({ meta: data.meta_mensal });
}

export async function saveMeta(valor) {
  const { user } = getState();
  if (!user || isNaN(valor) || valor <= 0) return;
  await sb.from('config').upsert(
    { user_id: user.id, meta_mensal: valor, atualizado_em: Date.now() },
    { onConflict: 'user_id' }
  );
  setState({ meta: valor });
}
