import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { chamadas, responderCom } from './preparo';

/**
 * Dois campos que existiam no banco e não existiam no produto.
 *
 * `escola.configuracoes.registrosHabilitados` era gravado pelo seed e lido por
 * ninguém; `PATCH /matriculas/{id}` não tinha quem o chamasse, então a única
 * saída para uma criança era arquivar — que deixava a matrícula ativa,
 * ocupando vaga e contando no painel.
 */

const GESTORA: Sessao = {
  accessToken: 'token-de-teste',
  refreshToken: 'refresh-de-teste',
  expiraEm: 900,
  usuario: {
    id: 'u9',
    nome: 'Carla Mendes',
    papeis: ['GESTOR'],
    escolaId: 'e1',
    escolaNome: 'Escola Modelo Cantinho Feliz',
    app: 'educador',
  },
};

const EDUCADORA: Sessao = {
  ...GESTORA,
  usuario: { ...GESTORA.usuario, id: 'u1', nome: 'Ana Souza', papeis: ['EDUCADOR'] },
};

const ESCOLA = {
  id: 'e1',
  nome: 'Escola Modelo Cantinho Feliz',
  slug: 'escola-modelo',
  cnpj: null,
  telefone: null,
  email: null,
  timezone: 'America/Sao_Paulo',
  configuracoes: {},
  // Uma pré-escola que não troca fralda nem oferece água em ml.
  registrosHabilitados: ['ALIMENTACAO', 'HUMOR', 'ATIVIDADE'],
};

const TURMA = {
  id: 't2',
  nome: 'Maternal I',
  grupoEtario: 'CRIANCAS_PEQUENAS',
  turno: 'integral',
  cor: '#C58B4A',
  capacidade: 12,
  anoLetivoId: 'a1',
  ano: 2026,
  criancasAtivas: 1,
  educadores: [{ usuarioId: 'u1', nome: 'Ana Souza', principal: true }],
};

const GRADE = {
  turma: TURMA,
  data: '2026-08-19',
  completas: 0,
  registrosHabilitados: ESCOLA.registrosHabilitados,
  criancas: [
    {
      id: 'c1',
      nome: 'Arthur Vieira',
      nomeSocial: null,
      idade: '3a 2m',
      alergias: [],
      restricoesAlimentares: [],
      semPresenca: false,
      presente: true,
      ausente: false,
      entradaEm: '2026-08-19T10:30:00.000Z',
      saidaEm: null,
      entreguePorNome: null,
      retiradoPorNome: null,
      justificativa: null,
      registros: [],
      pendencias: ['ALIMENTACAO'],
      temMedicacaoHoje: false,
    },
  ],
};

const FICHA = {
  id: 'c1',
  nome: 'Arthur Vieira',
  nomeSocial: null,
  dataNascimento: '2023-06-10',
  idade: '3a 2m',
  alergias: [],
  restricoesAlimentares: [],
  condicoesSaude: [],
  observacoesSaude: null,
  arquivada: false,
  matricula: { id: 'm2', turmaId: 't2', turmaNome: 'Maternal I', status: 'ATIVA' },
  responsaveis: [],
  autorizados: [],
  medicacoes: [],
};

const HISTORICO = [
  {
    id: 'm2',
    turmaId: 't2',
    turmaNome: 'Maternal I',
    status: 'ATIVA',
    inicio: '2026-07-01',
    fim: null,
  },
  {
    id: 'm1',
    turmaId: 't1',
    turmaNome: 'Berçário II',
    status: 'ENCERRADA',
    inicio: '2026-02-01',
    fim: '2026-06-30',
  },
];

function envolver(rota: string) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[rota]}>
        <AppEducador />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useSessao.getState().encerrar();
});

describe('rotina da escola', () => {
  it('oferece ao educador só o que a escola registra', async () => {
    responderCom({ '/v1/turmas/t2/grade': GRADE, '/v1/recados': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/turma/t2'));

    fireEvent.click(await screen.findByText('Arthur Vieira'));

    for (const tipo of ['Refeição', 'Humor', 'Atividade']) {
      expect(screen.getByRole('button', { name: tipo })).toBeDefined();
    }
    // Esta escola desligou fralda, água e recado: os botões não existem.
    for (const tipo of ['Fralda', 'Água', 'Recado']) {
      expect(screen.queryByRole('button', { name: tipo })).toBeNull();
    }
  });

  it('deixa a gestão ligar e desligar tipos de registro', async () => {
    responderCom({ '/v1/escola': ESCOLA });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/rotina'));

    expect(await screen.findByText('Fralda')).toBeDefined();

    // Nada mudou ainda: não há o que salvar.
    const salvar = screen.getByRole('button', { name: 'Salvar' });
    expect((salvar as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Fralda/ }));
    expect((salvar as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(salvar);

    await waitFor(() => {
      const patch = chamadas.find((c) => c.url.includes('/v1/escola') && c.metodo === 'PATCH');
      expect((patch?.corpo as { registrosHabilitados: string[] })?.registrosHabilitados).toContain(
        'HIGIENE',
      );
    });
  });

  /* Escola sem nenhum registro é o produto sem função naquela creche. */
  it('não deixa desligar tudo', async () => {
    responderCom({ '/v1/escola': { ...ESCOLA, registrosHabilitados: ['HUMOR'] } });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/rotina'));

    fireEvent.click(await screen.findByRole('button', { name: /Humor/ }));

    expect(screen.getByText(/Deixe ao menos um tipo ligado/)).toBeDefined();
    expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('não deixa a educadora entrar na rotina', async () => {
    responderCom({ '/v1/turmas': [TURMA] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/gestao/rotina'));

    expect(await screen.findByText('Olá, Ana')).toBeDefined();
  });
});

describe('matrícula', () => {
  it('mostra a turma vigente e o histórico', async () => {
    responderCom({
      '/v1/criancas/c1': FICHA,
      '/v1/matriculas/crianca/c1': HISTORICO,
      '/v1/turmas': [TURMA],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/criancas/c1'));

    expect(await screen.findByText('ativa')).toBeDefined();
    expect(screen.getByText(/desde 01\/07\/2026/)).toBeDefined();
    // A turma anterior é a resposta de "onde ela estava no primeiro semestre".
    expect(screen.getByText('Berçário II')).toBeDefined();
    expect(screen.getByText(/01\/02\/2026 – 30\/06\/2026/)).toBeDefined();
  });

  it('tranca a matrícula sem encerrar a vaga', async () => {
    responderCom({
      '/v1/criancas/c1': FICHA,
      '/v1/matriculas/crianca/c1': HISTORICO,
      '/v1/turmas': [TURMA],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/criancas/c1'));

    fireEvent.click(await screen.findByRole('button', { name: /Trancar matrícula/ }));

    await waitFor(() => {
      const patch = chamadas.find((c) => c.url.includes('/v1/matriculas/m2'));
      expect((patch?.corpo as { status: string })?.status).toBe('TRANCADA');
    });
  });

  it('encerra a matrícula e libera a vaga', async () => {
    responderCom({
      '/v1/criancas/c1': FICHA,
      '/v1/matriculas/crianca/c1': HISTORICO,
      '/v1/turmas': [TURMA],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/criancas/c1'));

    fireEvent.click(await screen.findByRole('button', { name: /Encerrar matrícula/ }));

    await waitFor(() => {
      const patch = chamadas.find((c) => c.url.includes('/v1/matriculas/m2'));
      expect((patch?.corpo as { status: string })?.status).toBe('ENCERRADA');
    });
  });

  it('explica o que aconteceu quando a criança foi arquivada', async () => {
    responderCom({
      '/v1/criancas/c1': { ...FICHA, arquivada: true, matricula: null },
      '/v1/matriculas/crianca/c1': [
        { ...HISTORICO[1], id: 'm2', turmaNome: 'Maternal I', status: 'ENCERRADA' },
      ],
      '/v1/turmas': [TURMA],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/criancas/c1'));

    expect(
      await screen.findByText(/Matrícula encerrada quando a criança foi arquivada/),
    ).toBeDefined();
  });
});
