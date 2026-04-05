// js/services/vendas.service.js — CRUD de vendas

import { sb } from '../config.js';
import { getState, setState } from '../state.js';
import { cap, san } from '../utils/security.js';
import { logHistory } from './historico.service.js';

export async function loadVendas() {
  const { user } = getState();
  if (!user) return;
  const { data, error } = await sb
    .from('vendas')
    .select('*')
    .eq('user_id', user.id)
    .order('criado_em', { ascending: false });
  if (!error) setState({ sales: data || [] });
}

export async function createVenda(fields) {
  const { user } = getState();
  const payload = {
    user_id:     user.id,
    data:        fields.data,
    produto:     cap(san(fields.produto), 150),
    custo:       +fields.custo,
    venda:       +fields.venda,
    marketplace: fields.marketplace,
    status:      fields.status,
    foto_url:    fields.foto_url || null,
    notas:       cap(san(fields.notas || ''), 300),
    criado_em:   Date.now(),
  };
  const { data, error } = await sb.from('vendas').insert(payload).select().single();
  if (!error && data) {
    setState({ sales: [data, ...getState().sales] });
    await logHistory('criado', 'venda', `Venda de "${fields.produto}" — ${formatBRL(+fields.venda)}`);
  }
  return { data, error };
}

export async function updateVenda(id, fields) {
  const { user, sales } = getState();
  const payload = {
    data:        fields.data,
    produto:     cap(san(fields.produto), 150),
    custo:       +fields.custo,
    venda:       +fields.venda,
    marketplace: fields.marketplace,
    status:      fields.status,
    foto_url:    fields.foto_url || null,
    notas:       cap(san(fields.notas || ''), 300),
  };

  const { data, error } = await sb
    .from('vendas')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (!error && data) {
    setState({ sales: sales.map(s => s.id === id ? data : s) });
    await logHistory('editado', 'venda', `Venda de "${fields.produto}" atualizada`);
  }
  return { data, error };
}

export async function deleteVenda(id) {
  const { user, sales } = getState();
  const venda = sales.find(s => s.id === id);
  const { error } = await sb.from('vendas').delete().eq('id', id).eq('user_id', user.id);
  if (!error) {
    setState({ sales: sales.filter(s => s.id !== id) });
    if (venda) await logHistory('removido', 'venda', `Venda de "${venda.produto}" removida`);
  }
  return { error };
}

const formatBRL = v => 'R$ ' + (+v).toFixed(2).replace('.', ',');
