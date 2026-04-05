// js/state.js — Estado global com pub/sub simples

const _state = {
  user:     null,
  sales:    [],
  produtos: [],
  hist:     [],
  meta:     500,
  rtsubs:   [],

  // Modal produto
  fotoFile:     null,
  editImgUrl:   null,
  fotoBase64:   null,
  fotoMimeType: null,
  aiResults:    [],
  aiQtd:        3,

  // Charts
  chartBar:      null,
  chartDoughnut: null,
};

const _listeners = {};

/** Acessa o estado atual */
export const getState = () => _state;

/** Atualiza campos do estado e notifica listeners */
export function setState(patch) {
  Object.assign(_state, patch);
  // notifica listeners de cada chave alterada
  Object.keys(patch).forEach(key => {
    (_listeners[key] || []).forEach(fn => fn(_state[key], _state));
  });
  // sempre notifica '*' (qualquer mudança)
  (_listeners['*'] || []).forEach(fn => fn(_state));
}

/** Registra listener para uma chave específica ou '*' para qualquer mudança */
export function subscribe(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
  return () => { _listeners[key] = _listeners[key].filter(f => f !== fn); };
}

/** Atalhos para leitura */
export const getUser     = () => _state.user;
export const getSales    = () => _state.sales;
export const getProdutos = () => _state.produtos;
export const getHist     = () => _state.hist;
export const getMeta     = () => _state.meta;
