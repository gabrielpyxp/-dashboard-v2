// js/config.js — Cliente Supabase e constantes globais
// window.supabase é injetado pelo CDN UMD no index.html

export const SUPABASE_URL = 'https://cdsvcvknoticxpwvhrmi.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_v7V78T_wzWtu3ZXXIzPOpw_ZdlN1joW';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// URL da Edge Function de IA (atualizada após deploy)
// supabase functions deploy ai-titles
export const AI_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-titles`;

export const MARKETPLACES = [
  'Mercado Livre', 'Shopee', 'Americanas',
  'OLX', 'Instagram', 'WhatsApp', 'Outro',
];

export const CATEGORIAS = [
  'Eletrônicos', 'Moda', 'Casa e Jardim',
  'Beleza', 'Esporte', 'Brinquedos',
  'Roupas', 'Calçados', 'Automóveis', 'Outro',
];

export const STATUS = {
  lucro:    { cls: 'pill-ok',   dot: 'dot-ok',   label: 'Concluída' },
  pendente: { cls: 'pill-warn', dot: 'dot-warn',  label: 'Pendente'  },
  prejuizo: { cls: 'pill-bad',  dot: 'dot-bad',   label: 'Prejuízo'  },
};
