import { configurarApp } from './vite.config.base';

export default configurarApp({
  app: 'site',
  porta: 5176,
  nome: 'Diadeles',
  nomeCurto: 'Diadeles',
  descricao: 'A escola registra o dia. A família vê acontecer.',
  corTema: '#1F6F5C',
  corFundo: '#FFFFFF',
  atalhos: [],
  pwa: false,
});
