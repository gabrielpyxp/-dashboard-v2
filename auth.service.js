// js/services/auth.service.js — Autenticação

import { sb } from '../config.js';
import { setState } from '../state.js';
import { authErr, isEmail } from '../utils/security.js';

export function initAuthListener(onLogin, onLogout) {
  sb.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    setState({ user });
    if (user) onLogin(user);
    else onLogout();
  });
}

export async function login(email, password) {
  if (!email || !password) return { error: 'Preencha email e senha.' };
  if (!isEmail(email))     return { error: 'Email inválido.' };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { error: error ? authErr(error.message) : null };
}

export async function signup(email, password, confirm) {
  if (!email || !password || !confirm) return { error: 'Preencha todos os campos.' };
  if (!isEmail(email))      return { error: 'Email inválido.' };
  if (password.length < 6)  return { error: 'A senha deve ter pelo menos 6 caracteres.' };
  if (password !== confirm)  return { error: 'As senhas não coincidem.' };
  const { error } = await sb.auth.signUp({ email, password });
  return { error: error ? authErr(error.message) : null };
}

export async function forgotPassword(email) {
  if (!email)          return { error: 'Digite seu email.' };
  if (!isEmail(email)) return { error: 'Email inválido.' };
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href,
  });
  return { error: error ? authErr(error.message) : null };
}

export async function logout(rtsubs) {
  rtsubs?.forEach(s => sb.removeChannel(s));
  setState({ rtsubs: [] });
  await sb.auth.signOut();
}
