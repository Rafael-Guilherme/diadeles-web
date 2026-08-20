import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { App as AppResponsavel } from '@/apps/responsavel/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { responderCom } from './preparo';

/**
 * As quatro frentes que faltavam do escopo da Fase 1: recado da família,
 * conferência da saída, quem entregou a criança e o relatório de adesão.
 *
 * Vale o mesmo que nas outras suítes — compilar não prova que a tela aparece —
 * com um agravante: a conferência da saída é a tela em que um engano significa
 * entregar uma criança a quem não podia buscá-la.
 */

const EDUCADORA: Sessao = {
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

const GESTORA: Sessao = {
  ...EDUCADORA,
  usuario: { ...EDUCADORA.usuario, id: 'u9', nome: 'Carla Mendes', papeis: ['GESTOR'] },
};

const FAMILIA: Sessao = {
  ...EDUCADORA,
  usuario: {
    ...EDUCADORA.usuario,
    id: 'u5',
    nome: 'Marina Prado',
    papeis: ['RESPONSAVEL'],
    app: 'responsavel',
  },
};

const TURMA = {
  id: 't1',
  nome: 'Berçário II',
  grupoEtario: 'CRIANCAS_BEM_PEQUENAS',
  turno: 'integral',
  cor: '#6BA292',
  capacidade: 12,
  anoLetivoId: 'a1',
  ano: 2026,
  criancasAtivas: 2,
  educadores: [{ usuarioId: 'u1', nome: 'Ana Souza', principal: true }],
};

/** Sofia está na escola; Helena faltou. */
const GRADE = {
  turma: TURMA,
  data: '2026-08-19',
  completas: 0,
  registrosHabilitados: [
    'ALIMENTACAO',
    'SONO',
    'HIGIENE',
    'HUMOR',
    'ATIVIDADE',
    'HIDRATACAO',
    'OBSERVACAO',
  ],
  criancas: [
    {
      id: 'c1',
      nome: 'Sofia Prado',
      nomeSocial: null,
      idade: '1a 8m',
      alergias: [],
      restricoesAlimentares: [],
      semPresenca: false,
      presente: true,
      ausente: false,
      entradaEm: '2026-08-19T10:40:00.000Z',
      saidaEm: null,
      entreguePorNome: 'Marina Prado',
      retiradoPorNome: null,
      justificativa: null,
      registros: [],
      pendencias: [],
      temMedicacaoHoje: false,
    },
    {
      id: 'c2',
      nome: 'Helena Dias',
      nomeSocial: null,
      idade: '1a 6m',
      alergias: [],
      restricoesAlimentares: [],
      semPresenca: false,
      presente: false,
      ausente: true,
      entradaEm: null,
      saidaEm: null,
      entreguePorNome: null,
      retiradoPorNome: null,
      justificativa: 'Consulta médica',
      registros: [],
      pendencias: [],
      temMedicacaoHoje: false,
    },
  ],
};

const RECADO_RETIRADA = {
  id: 'r1',
  criancaId: 'c1',
  criancaNome: 'Sofia Prado',
  turmaNome: 'Berçário II',
  categoria: 'retirada',
  corpo: 'Hoje quem busca a Sofia é a avó Marta, por volta das 17h.',
  referenteA: null,
  autorId: 'u5',
  autorNome: 'Marina Prado',
  criadoEm: '2026-08-19T12:12:00.000Z',
  lidoEm: null,
  lidoPorNome: null,
};

const QUEM_RETIRA = [
  {
    id: 'v1',
    origem: 'vinculo',
    nome: 'Marina Prado',
    papel: 'Mãe',
    documento: null,
    validoAte: null,
  },
  {
    id: 'a1',
    origem: 'autorizado',
    nome: 'Marta Prado',
    papel: 'Avó materna',
    documento: '123.456.789-00',
    validoAte: null,
  },
];

function envolver(no: React.ReactNode, rota: string) {
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

describe('saída da criança', () => {
  it('oferece registrar a saída de quem está na escola, e não de quem faltou', async () => {
    responderCom({ '/v1/turmas/t1/grade': GRADE, '/v1/recados': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/chamada'));

    expect(await screen.findByText('Sofia Prado')).toBeDefined();
    // Uma criança na escola, uma ausente: só a primeira pode sair.
    expect(screen.getAllByRole('button', { name: /Registrar saída/ })).toHaveLength(1);
  });

  it('confere quem retira contra a lista, com o recado da família à vista', async () => {
    responderCom({
      '/v1/turmas/t1/grade': GRADE,
      '/v1/presencas/quem-pode-retirar/c1': QUEM_RETIRA,
      '/v1/recados': [RECADO_RETIRADA],
    });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/chamada'));

    fireEvent.click(await screen.findByRole('button', { name: /Registrar saída/ }));

    // O recado da manhã aparece na hora da decisão, às 17h.
    expect(await screen.findByText(/avó Marta/)).toBeDefined();
    expect(await screen.findByText('Marta Prado')).toBeDefined();
    expect(screen.getByText(/123.456.789-00/)).toBeDefined();

    // Enquanto ninguém é escolhido, não há como registrar a saída.
    const confirmar = screen.getByRole('button', { name: /Confirmar saída/ });
    expect((confirmar as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Marta Prado/ }));
    expect((confirmar as HTMLButtonElement).disabled).toBe(false);
  });

  it('exige motivo quando quem busca não está na lista', async () => {
    responderCom({
      '/v1/turmas/t1/grade': GRADE,
      '/v1/presencas/quem-pode-retirar/c1': QUEM_RETIRA,
      '/v1/recados': [],
    });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/chamada'));

    fireEvent.click(await screen.findByRole('button', { name: /Registrar saída/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Outra pessoa/ }));

    expect(screen.getByLabelText(/Quem está levando/)).toBeDefined();
    expect(screen.getByLabelText(/Por que a saída foi liberada/)).toBeDefined();
    // Sem nome e sem motivo, continua bloqueado.
    const confirmar = screen.getByRole('button', { name: /Confirmar saída/ });
    expect((confirmar as HTMLButtonElement).disabled).toBe(true);
  });

  it('mostra quem entregou a criança e o motivo da falta', async () => {
    responderCom({ '/v1/turmas/t1/grade': GRADE, '/v1/recados': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/chamada'));

    expect(await screen.findByText('Quem entregou: Marina Prado')).toBeDefined();
    expect(screen.getByText('Motivo: Consulta médica')).toBeDefined();
  });
});

describe('recados', () => {
  it('põe os recados pendentes no topo da grade da turma', async () => {
    responderCom({ '/v1/turmas/t1/grade': GRADE, '/v1/recados': [RECADO_RETIRADA] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1'));

    expect(await screen.findByText(/avó Marta/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Li o recado/ })).toBeDefined();
  });

  it('deixa a família avisar a escola e ver quem leu', async () => {
    responderCom({
      '/v1/criancas/minhas': [
        { id: 'c1', nome: 'Sofia Prado', nomeSocial: null, idade: '1a 8m', turmaNome: 'Berçário II', alergias: [] },
      ],
      '/v1/recados/meus': [
        { ...RECADO_RETIRADA, lidoEm: '2026-08-19T12:30:00.000Z', lidoPorNome: 'Ana Souza' },
      ],
    });

    useSessao.getState().definir(FAMILIA);
    render(envolver(<AppResponsavel />, '/recado'));

    expect(await screen.findByText('Avisar a escola')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Quem busca' })).toBeDefined();
    expect(await screen.findByText(/Ana Souza leu/)).toBeDefined();
  });
});

describe('adesão', () => {
  const ADESAO = {
    dias: 7,
    desde: '2026-08-13',
    data: '2026-08-19',
    turmas: [
      {
        turmaId: 't1',
        nome: 'Berçário II',
        criancasAtivas: 7,
        chamadaHoje: 6,
        criancasComRegistroHoje: 5,
        registros: 27,
        diasComRegistro: 4,
        educadores: [
          { usuarioId: 'u1', nome: 'Ana Souza', registros: 27, ultimoRegistroEm: '2026-08-19T18:05:00.000Z' },
          { usuarioId: 'u2', nome: 'Daniel Rocha', registros: 0, ultimoRegistroEm: null },
        ],
        familiasComAcesso: 5,
        familiasAtivas: 3,
      },
    ],
    familiasParadas: [
      {
        criancaId: 'c9',
        crianca: 'Alice Fontes',
        turma: 'Berçário II',
        responsavelId: 'u7',
        responsavel: 'Responsável de Alice',
        ultimoAcessoEm: null,
      },
      {
        criancaId: 'c8',
        crianca: 'Theo Nogueira',
        turma: 'Berçário II',
        responsavelId: 'u8',
        responsavel: 'Responsável de Theo',
        ultimoAcessoEm: '2026-08-10T12:00:00.000Z',
      },
    ],
  };

  it('mostra quem registra e quem parou de registrar', async () => {
    responderCom({ '/v1/escola/adesao': ADESAO });

    useSessao.getState().definir(GESTORA);
    render(envolver(<AppEducador />, '/gestao/adesao'));

    expect(await screen.findByText('Berçário II')).toBeDefined();
    expect(screen.getByText('27 registros')).toBeDefined();
    // O educador que não lançou nada é o achado, não o que lançou muito.
    expect(screen.getByText('nada no período')).toBeDefined();
    expect(screen.getByText(/3 de 5/)).toBeDefined();
  });

  it('separa quem nunca entrou de quem parou de abrir', async () => {
    responderCom({ '/v1/escola/adesao': ADESAO });

    useSessao.getState().definir(GESTORA);
    render(envolver(<AppEducador />, '/gestao/adesao'));

    // São dois problemas diferentes: um pede convite, o outro pede telefonema.
    expect(await screen.findByText('Nunca entraram (1)')).toBeDefined();
    expect(screen.getByText('Pararam de abrir (1)')).toBeDefined();
    expect(screen.getByText('convite pendente')).toBeDefined();
  });

  it('não deixa a educadora entrar na adesão', async () => {
    responderCom({ '/v1/turmas': [TURMA] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/gestao/adesao'));

    expect(await screen.findByText('Olá, Ana')).toBeDefined();
  });
});
