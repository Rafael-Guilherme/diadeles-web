import { configurarApp } from './vite.config.base';

export default configurarApp({
  app: 'responsavel',
  porta: 5174,
  nome: 'Diadeles — o dia deles',
  nomeCurto: 'Diadeles',
  descricao: 'Acompanhe o dia do seu filho na escola, em tempo real.',
  corTema: '#FFB05C',
  corFundo: '#FFFFFF',
  atalhos: [
    { name: 'O dia de hoje', url: '/' },
    { name: 'Comunicados', url: '/comunicados' },
  ],
});
