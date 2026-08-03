import { configurarApp } from './vite.config.base';

export default configurarApp({
  app: 'educador',
  // 5173 já é usada por outro projeto local
  porta: 5175,
  nome: 'Diadeles — Educador',
  nomeCurto: 'Diadeles',
  descricao: 'Registre a rotina da turma em segundos, mesmo sem internet.',
  corTema: '#1F6F5C',
  corFundo: '#FFFFFF',
  atalhos: [
    { name: 'Fazer chamada', url: '/chamada' },
    { name: 'Grade da turma', url: '/' },
  ],
});
