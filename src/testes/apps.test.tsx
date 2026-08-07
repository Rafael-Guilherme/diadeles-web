import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { App as AppResponsavel } from '@/apps/responsavel/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { responderCom } from './preparo';

/**
 * Smoke de renderização: monta os dois apps de verdade, com o grafo de imports
 * inteiro. É o que substitui abrir o navegador — compilar não prova que a tela
 * aparece.
 */

const PERFIS = {
  perfis: [
    {
      chave: 'educadora',
      nome: 'Ana Souza',
      cargo: 'Educadora',
      descricao: 'Registra a rotina do Berçário II.',
      app: 'educador',
    },
    {
      chave: 'responsavel',
      nome: 'Marina Prado',
      cargo: 'Mãe da Sofia',
      descricao: 'Acompanha o dia da Sofia.',
      app: 'responsavel',
    },
  ],
};

const SESSAO: Sessao = {
  accessToken: 'token-de-teste',
  refreshToken: 'refresh-de-teste',
  expiraEm: 900,
  usuario: {
    id: 'u1',
    nome: 'Ana Souza',
    papeis: ['EDUCADOR'],
    escolaId: 'e1',
    escolaNome: 'Escola Modelo Cantinho Feliz',
    app: 'educador',
  },
};

function envolver(no: React.ReactNode, rota = '/') {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[rota]}>{no}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useSessao.getState().encerrar();
});

describe('app do educador', () => {
  it('mostra os perfis de demonstração quando não há sessão', async () => {
    responderCom({ '/v1/demo': PERFIS });

    render(envolver(<AppEducador />));

    expect(await screen.findByText('Ana Souza')).toBeDefined();
    expect(screen.getByText('Educadora')).toBeDefined();
    // O perfil da família não deve vazar para o app do educador.
    expect(screen.queryByText('Marina Prado')).toBeNull();
  });

  it('lista as turmas quando há sessão', async () => {
    responderCom({
      '/v1/turmas': [
        {
          id: 't1',
          nome: 'Berçário II',
          grupoEtario: 'CRIANCAS_BEM_PEQUENAS',
          turno: 'integral',
          cor: '#6BA292',
          criancasAtivas: 7,
          educadores: ['Ana Souza'],
        },
      ],
    });

    useSessao.getState().definir(SESSAO);
    render(envolver(<AppEducador />));

    expect(await screen.findByText('Berçário II')).toBeDefined();
    expect(screen.getByText('Olá, Ana')).toBeDefined();
    expect(screen.getByText(/7 crianças/)).toBeDefined();
  });
});

/**
 * A área de gestão existe para papéis que a API deixa entrar nela. Estes testes
 * guardam os dois lados: quem não pode não vê o caminho nem alcança a rota
 * digitando — do contrário a educadora encontraria três telas de erro 403.
 */
describe('área de gestão', () => {
  const TURMAS = {
    '/v1/turmas': [
      {
        id: 't1',
        nome: 'Berçário II',
        grupoEtario: 'CRIANCAS_BEM_PEQUENAS',
        turno: 'integral',
        cor: '#6BA292',
        criancasAtivas: 7,
        educadores: ['Ana Souza'],
      },
    ],
  };

  const RESUMO = {
    '/v1/escola/resumo': {
      escola: {
        id: 'e1',
        nome: 'Escola Modelo Cantinho Feliz',
        slug: 'escola-modelo',
        timezone: 'America/Sao_Paulo',
        configuracoes: {},
      },
      criancasAtivas: 12,
      turmas: 2,
      educadores: 2,
      familiasVinculadas: 12,
      presentesHoje: 10,
      ausentesHoje: 1,
      registrosHoje: 32,
    },
  };

  const gestora = {
    ...SESSAO,
    usuario: { ...SESSAO.usuario, nome: 'Carla Mendes', papeis: ['GESTOR'] },
  };

  it('não oferece o painel para quem só registra turma', async () => {
    responderCom(TURMAS);

    useSessao.getState().definir(SESSAO); // Ana, EDUCADOR
    render(envolver(<AppEducador />));

    expect(await screen.findByText('Berçário II')).toBeDefined();
    expect(screen.queryByText('A escola hoje')).toBeNull();
  });

  it('devolve a educadora para as turmas se ela abrir /gestao direto', async () => {
    responderCom(TURMAS);

    useSessao.getState().definir(SESSAO);
    render(envolver(<AppEducador />, '/gestao'));

    expect(await screen.findByText('Berçário II')).toBeDefined();
  });

  it('mostra o painel do dia para a gestão', async () => {
    responderCom(RESUMO);

    useSessao.getState().definir(gestora);
    render(envolver(<AppEducador />, '/gestao'));

    expect(await screen.findByText('10')).toBeDefined();
    expect(screen.getByText('presentes')).toBeDefined();

    // 12 crianças, 10 presentes e 1 ausente deixam uma sem chamada — é o número
    // que a tela calcula, e o único ali que pede providência.
    expect(screen.getByText('sem chamada')).toBeDefined();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
  });
});

describe('app da família', () => {
  it('mostra o resumo do dia e a linha do tempo', async () => {
    responderCom({
      '/v1/criancas/minhas': [
        { id: 'c1', nome: 'Sofia Prado', idade: '2a 4m', turmaNome: 'Berçário II', alergias: ['Amendoim'] },
      ],
      '/v1/criancas/c1/dia': {
        crianca: {
          id: 'c1',
          nome: 'Sofia Prado',
          idade: '2a 4m',
          turmaNome: 'Berçário II',
          alergias: ['Amendoim'],
        },
        data: '2026-08-02',
        presente: true,
        ausente: false,
        entradaEm: '2026-08-02T10:40:00.000Z',
        saidaEm: null,
        resumo: 'Sofia comeu bem, dormiu e estava alegre.',
        timeline: [
          {
            id: 'r1',
            categoria: 'REGISTRO',
            tipo: 'ALIMENTACAO',
            ocorridoEm: '2026-08-02T12:15:00.000Z',
            titulo: 'No lanche da manhã, comeu tudo',
            detalhe: 'Fruta da estação',
            dados: {},
          },
          {
            id: 'o1',
            categoria: 'OCORRENCIA',
            tipo: null,
            ocorridoEm: '2026-08-02T18:20:00.000Z',
            titulo: 'Queda',
            detalhe: 'Ralou o joelho no parque.',
            dados: { gravidade: 'LEVE', conduta: 'Higienizamos e aplicamos curativo.' },
          },
        ],
      },
    });

    useSessao.getState().definir({
      ...SESSAO,
      usuario: { ...SESSAO.usuario, nome: 'Marina Prado', papeis: ['RESPONSAVEL'], app: 'responsavel' },
    });

    render(envolver(<AppResponsavel />));

    expect(await screen.findByText('Sofia Prado')).toBeDefined();
    expect(screen.getByText('Sofia comeu bem, dormiu e estava alegre.')).toBeDefined();
    expect(screen.getByText('No lanche da manhã, comeu tudo')).toBeDefined();

    // A conduta da escola é o que transforma um aviso ruim em confiança.
    await waitFor(() =>
      expect(screen.getByText(/Higienizamos e aplicamos curativo/)).toBeDefined(),
    );
    expect(screen.getByText(/Alergia registrada: Amendoim/)).toBeDefined();
  });

  /**
   * A caixa de avisos é a fonte de verdade do que foi notificado: push não
   * chega em aparelho desligado e e-mail cai em spam, mas o que a escola
   * mandou tem que estar aqui de qualquer jeito.
   *
   * O jsdom não implementa `serviceWorker` nem `Notification` — o mesmo caso do
   * navegador sem Web Push. A tela precisa abrir assim mesmo, sem oferecer um
   * botão de ativar que não teria como funcionar.
   */
  it('lista os avisos recebidos mesmo sem suporte a push no navegador', async () => {
    responderCom({
      '/v1/notificacoes': {
        naoLidas: 1,
        itens: [
          {
            id: 'n1',
            tipo: 'RESUMO_DIARIO',
            titulo: 'O dia de Sofia',
            corpo: 'Sofia comeu bem, dormiu e estava alegre.',
            link: '/',
            gravidade: 'NORMAL',
            criadoEm: new Date().toISOString(),
            lida: false,
          },
        ],
      },
    });

    useSessao.getState().definir({
      ...SESSAO,
      usuario: { ...SESSAO.usuario, nome: 'Marina Prado', papeis: ['RESPONSAVEL'], app: 'responsavel' },
    });

    render(envolver(<AppResponsavel />, '/avisos'));

    expect(await screen.findByText('O dia de Sofia')).toBeDefined();
    expect(screen.getByText('Sofia comeu bem, dormiu e estava alegre.')).toBeDefined();
    expect(screen.queryByText(/Ativar avisos/)).toBeNull();
  });
});
