// js/utils/security.js — Sanitização e validação de entradas

const ESC = { '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'": '&#39;', '`':'&#96;' };

/** Sanitiza string para uso seguro em HTML */
export const san = s => String(s ?? '').replace(/[<>&"'`]/g, c => ESC[c]);

/** Limita string ao tamanho máximo */
export const cap = (s, max = 200) => String(s ?? '').slice(0, max).trim();

/** Valida formato de email */
export const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s ?? '');

/** Tipos MIME aceitos para imagens */
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * Valida um arquivo de imagem por MIME type, tamanho e magic bytes.
 * @returns {{ ok: boolean, err?: string }}
 */
export async function validateImage(file) {
  if (!file) return { ok: false, err: 'Nenhum arquivo selecionado.' };
  if (file.size > MAX_BYTES) return { ok: false, err: 'Imagem maior que 3MB.' };
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, err: 'Formato inválido. Use JPG, JPEG, PNG ou WebP.' };
  }
  // Verifica magic bytes (primeiros 4 bytes)
  try {
    const buf   = await file.slice(0, 4).arrayBuffer();
    const b     = new Uint8Array(buf);
    const isJPEG = b[0] === 0xFF && b[1] === 0xD8;
    const isPNG  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    const isWebP = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
    if (!isJPEG && !isPNG && !isWebP) {
      return { ok: false, err: 'Arquivo corrompido ou formato não suportado.' };
    }
  } catch {
    return { ok: false, err: 'Não foi possível validar o arquivo.' };
  }
  return { ok: true };
}

/** Converte File para base64 (sem prefixo data:...) */
export const toBase64 = file => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload  = e => res(e.target.result.split(',')[1]);
  r.onerror = () => rej(new Error('Falha ao ler arquivo.'));
  r.readAsDataURL(file);
});

/** Remove caracteres inválidos de nome de arquivo */
export const safeName = name =>
  name.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);

/** Traduz erros do Supabase Auth para português */
export const authErr = (msg = '') => {
  if (msg.includes('Invalid login credentials'))  return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed'))         return 'Confirme seu email antes de entrar.';
  if (msg.includes('User already registered'))     return 'Este email já está cadastrado.';
  if (msg.includes('Password should be'))          return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate'))          return 'Email inválido.';
  if (msg.includes('rate limit') || msg.includes('security purposes')) return 'Muitas tentativas. Aguarde alguns segundos.';
  if (msg.includes('Email rate limit'))            return 'Muitos emails enviados. Aguarde antes de tentar novamente.';
  return msg || 'Ocorreu um erro inesperado.';
};
