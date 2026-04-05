// js/services/ai.service.js — Geração de títulos via Supabase Edge Function
// A Edge Function (supabase/functions/ai-titles/index.ts) age como
// proxy seguro para a API do Claude, evitando exposição da chave no frontend.

import { sb, AI_FUNCTION_URL } from '../config.js';
import { getState } from '../state.js';

/**
 * Gera sugestões de título e descrição para um produto.
 * @param {{ base64, mimeType, categoria, fornecedor, nomeAtual, quantidade, descricao }} opts
 * @returns {Promise<Array<{titulo: string, descricao: string}>>}
 */
export async function generateTitles({ base64, mimeType, categoria, fornecedor, nomeAtual, quantidade = 3, descricao }) {
  // Obtém token de sessão para autenticar na Edge Function
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(AI_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token ?? ''}`,
      'apikey': 'sb_publishable_v7V78T_wzWtu3ZXXIzPOpw_ZdlN1joW',
    },
    body: JSON.stringify({ base64, mimeType, categoria, fornecedor, nomeAtual, quantidade, descricao }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erro na função de IA: ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Resposta inesperada da IA.');
  return data.slice(0, quantidade);
}
