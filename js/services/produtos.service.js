// js/services/produtos.service.js — CRUD de produtos + storage

import { sb } from '../config.js';
import { getState, setState } from '../state.js';
import { cap, san, safeName, validateImage, toBase64 } from '../utils/security.js';
import { logHistory } from './historico.service.js';

export async function loadProdutos() {
  const { user } = getState();
  if (!user) return;
  const { data, error } = await sb
    .from('produtos')
    .select('*')
    .eq('user_id', user.id)
    .order('criado_em', { ascending: false });
  if (!error) setState({ produtos: data || [] });
}

export async function saveProduto(fields, fotoFile, editImgUrl, editId) {
  const { user } = getState();
  let foto_url = editImgUrl || null;

  // Upload de imagem
  if (fotoFile) {
    const maxSize = 3 * 1024 * 1024;
    if (fotoFile.size > maxSize) return { error: 'Imagem maior que 3MB.' };
    if (!fotoFile.type.startsWith('image/')) return { error: 'Arquivo deve ser uma imagem.' };

    const name = safeName(fotoFile.name);
    const path = `${user.id}/${Date.now()}_${name}`;

    let uploadResult;
    try {
      const { data: up, error: upErr } = await sb.storage
        .from('produtos')
        .upload(path, fotoFile, { upsert: true, contentType: fotoFile.type });

      uploadResult = { data: up, error: upErr };
    } catch (uploadError) {
      return { error: 'Falha no upload: ' + (uploadError.message || 'Erro desconhecido') };
    }

    if (uploadResult.error) return { error: 'Erro no upload: ' + uploadResult.error.message };

    const { data: publicUrl } = sb.storage.from('produtos').getPublicUrl(uploadResult.data.path);
    if (publicUrl && publicUrl.publicUrl) {
      foto_url = publicUrl.publicUrl;
    }
  }

  const now = Date.now();
  const obj = {
    user_id:       user.id,
    nome:          cap(san(fields.nome), 150),
    descricao:     cap(san(fields.descricao || ''), 2000),
    categoria:     fields.categoria || '',
    fornecedor:    cap(san(fields.fornecedor || ''), 100),
    custo:         +fields.custo,
    venda:         +fields.venda,
    estoque:       +fields.estoque || 0,
    estoque_min:   +fields.estoqueMin || 0,
    obs:           cap(san(fields.obs || ''), 300),
    foto_url,
    atualizado_em: now,
  };

  // Debug
  console.log('[saveProduto] obj:', JSON.stringify(obj).substring(0, 300));
  console.log('[saveProduto] editId:', editId, 'hasFoto:', !!fotoFile);

  let error, data;

  if (editId) {
    ({ error, data } = await sb
      .from('produtos').update(obj).eq('id', editId).eq('user_id', user.id)
      .select().single());
    if (!error && data) {
      setState({ produtos: getState().produtos.map(p => p.id === editId ? data : p) });
      await logHistory('editado', 'produto', `Produto "${fields.nome}" atualizado`);
    }
  } else {
    obj.criado_em = now;
    ({ error, data } = await sb.from('produtos').insert(obj).select().single());
    if (!error && data) {
      setState({ produtos: [data, ...getState().produtos] });
      await logHistory('criado', 'produto', `Produto "${fields.nome}" cadastrado`);
    }
  }

  return { error, data };
}

export async function deleteProduto(id) {
  const { user, produtos } = getState();
  const prod = produtos.find(p => p.id === id);

  // Remove foto do storage
  if (prod?.foto_url) {
    try {
      const m = prod.foto_url.match(/\/produtos\/(.+)$/);
      if (m) await sb.storage.from('produtos').remove([decodeURIComponent(m[1])]);
    } catch { /* não bloqueia */ }
  }

  const { error } = await sb.from('produtos').delete().eq('id', id).eq('user_id', user.id);
  if (!error) {
    setState({ produtos: produtos.filter(p => p.id !== id) });
    if (prod) await logHistory('removido', 'produto', `Produto "${prod.nome}" removido`);
  }
  return { error };
}

export async function ajustarEstoque(id, delta) {
  const { user, produtos } = getState();
  const prod = produtos.find(p => p.id === id);
  if (!prod) return;
  const novo = Math.max(0, (prod.estoque || 0) + delta);
  const { error } = await sb.from('produtos')
    .update({ estoque: novo, atualizado_em: Date.now() })
    .eq('id', id).eq('user_id', user.id);
  if (!error) {
    setState({ produtos: produtos.map(p => p.id === id ? { ...p, estoque: novo } : p) });
  }
}
