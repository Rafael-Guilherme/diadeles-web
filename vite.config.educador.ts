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
  // Sem a escola no caminho: o atalho abre a página inicial, que leva à última
  // escola usada (shared/escola/escola.ts). O antigo `/chamada` nunca existiu
  // como rota — a chamada é por turma.
  atalhos: [{ name: 'Minhas turmas', url: '/' }],
});
