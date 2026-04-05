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

  const payload = {
    base64, mimeType, categoria, fornecedor, nomeAtual, quantidade, descricao,
  };

  const res = await fetch(AI_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token ?? ''}`,
      'apikey': 'sb_publishable_v7V78T_wzWtu3ZXXIzPOpw_ZdlN1joW',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erro na função de IA: ${res.status}`);
  }

  const json = await res.json();

  // Suporta resposta em formato {results: [...]} ou array direto
  const data = Array.isArray(json) ? json : json.results || json.data || null;
  if (!data || !Array.isArray(data)) {
    // Tenta encontrar JSON no texto
    const text = json.choices?.[0]?.message?.content || json.response || json.text || '';
    if (text) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try { return JSON.parse(match[0]).slice(0, quantidade); } catch { /* */ }
      }
    }
    throw new Error('Resposta inesperada da IA. Tente novamente.');
  }
  return data.slice(0, quantidade);
}
