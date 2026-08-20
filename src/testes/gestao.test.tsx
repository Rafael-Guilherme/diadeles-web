import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { responderCom } from './preparo';

/**
 * As telas de escrita da gestão.
 *
 * Compilar não prova que a tela aparece, e estas são as que uma escola real usa
 * para se montar sozinha — até existirem, a demonstração só funcionava com o
 * conteúdo do seed.
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

const TURMA = {
  id: 't1',
  nome: 'Berçário II',
  grupoEtario: 'CRIANCAS_BEM_PEQUENAS',
  turno: 'integral',
  cor: '#6BA292',
  capacidade: 12,
  anoLetivoId: 'a1',
  ano: 2026,
  criancasAtivas: 7,
  educadores: [{ usuarioId: 'u1', nome: 'Ana Souza', principal: true }],
};

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

describe('turmas', () => {
  it('mostra a turma com a equipe e quem a rege', async () => {
    responderCom({
      '/v1/turmas': [TURMA],
      '/v1/anos-letivos': [
        { id: 'a1', ano: 2026, inicio: '2026-02-02', fim: '2026-12-18', encerrado: false, turmas: 2, corrente: true },
      ],
      '/v1/equipe': [
        { id: 'u1', nome: 'Ana Souza', email: null, papeis: ['EDUCADOR'], ativo: true, ultimoAcesso: null, turmas: [] },
        { id: 'u2', nome: 'Daniel Rocha', email: null, papeis: ['AUXILIAR'], ativo: true, ultimoAcesso: null, turmas: [] },
      ],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/turmas'));

    expect(await screen.findByText('Berçário II')).toBeDefined();
    expect(screen.getByText('regente')).toBeDefined();
    expect(screen.getByText(/7 crianças matriculadas de 12/)).toBeDefined();

    // Quem já está na turma não é oferecido de novo no seletor.
    expect(screen.getByText('Daniel Rocha')).toBeDefined();
  });

  /**
   * Sem ano letivo aberto a turma não tem onde existir. A tela precisa dizer
   * isso antes do clique, e não deixar a secretaria descobrir por um 409.
   */
  it('avisa e bloqueia a criação quando não há ano letivo aberto', async () => {
    responderCom({ '/v1/turmas': [], '/v1/anos-letivos': [], '/v1/equipe': [] });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/turmas'));

    expect(await screen.findByText(/Nenhum ano letivo aberto/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Nova turma/ })).toHaveProperty('disabled', true);
  });
});

describe('comunicados', () => {
  it('separa rascunho de publicado e oferece a ação certa em cada um', async () => {
    responderCom({
      '/v1/comunicados': [
        {
          id: 'c1',
          titulo: 'Reunião de pais',
          corpo: 'Dia 22, às 19h.',
          publicadoEm: '2026-08-01T12:00:00.000Z',
          exigeCiencia: true,
          lido: false,
          totalLeituras: 4,
          alvoTurmas: [],
          rascunho: false,
        },
        {
          id: 'c2',
          titulo: 'Ainda escrevendo',
          corpo: 'Texto em elaboração.',
          publicadoEm: null,
          exigeCiencia: false,
          lido: false,
          totalLeituras: 0,
          alvoTurmas: ['t1'],
          rascunho: true,
        },
      ],
      '/v1/turmas': [TURMA],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/comunicados'));

    expect(await screen.findByText('Reunião de pais')).toBeDefined();
    expect(screen.getByText('rascunho')).toBeDefined();
    expect(screen.getByText('pede ciência')).toBeDefined();

    // Publicado não se republica; rascunho não mostra taxa de leitura que ainda
    // não existe.
    expect(screen.getByRole('button', { name: /Publicar/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ver quem leu/ })).toBeDefined();
  });

  /**
   * A taxa só serve se vier com o denominador: "12 leituras" não diz nada, e
   * "12 de 30" diz a quem a coordenação precisa ligar. Por isso quem não leu
   * aparece primeiro.
   */
  it('abre a taxa de leitura com o denominador e quem falta', async () => {
    responderCom({
      '/v1/comunicados/c1/leituras': {
        comunicadoId: 'c1',
        titulo: 'Reunião de pais',
        destinatarios: 3,
        leram: 1,
        percentual: 33,
        familias: [
          {
            criancaId: 'k1',
            crianca: 'Sofia Prado',
            turma: 'Berçário II',
            responsavelId: 'r1',
            responsavel: 'Marina Prado',
            lidoEm: null,
          },
          {
            criancaId: 'k2',
            crianca: 'Tomás Lima',
            turma: 'Berçário II',
            responsavelId: 'r2',
            responsavel: 'Bruno Lima',
            lidoEm: '2026-08-02T12:00:00.000Z',
          },
        ],
      },
      '/v1/comunicados': [
        {
          id: 'c1',
          titulo: 'Reunião de pais',
          corpo: 'Dia 22, às 19h.',
          publicadoEm: '2026-08-01T12:00:00.000Z',
          exigeCiencia: true,
          lido: false,
          totalLeituras: 1,
          alvoTurmas: [],
          rascunho: false,
        },
      ],
      '/v1/turmas': [TURMA],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/comunicados'));

    fireEvent.click(await screen.findByRole('button', { name: /Ver quem leu/ }));

    expect(await screen.findByText(/1 de 3 leram/)).toBeDefined();
    expect(screen.getByText('(33%)')).toBeDefined();
    expect(screen.getByText('não leu')).toBeDefined();
    expect(screen.getByText('leu')).toBeDefined();
  });
});

describe('cardápio', () => {
  it('abre a semana de segunda a sexta com o que já foi publicado', async () => {
    responderCom({ '/v1/cardapios/semana': [] });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/cardapio'));

    expect(await screen.findByText('Segunda')).toBeDefined();
    expect(screen.getByText('Sexta')).toBeDefined();
    expect(screen.getAllByText('Almoço').length).toBe(5);
  });
});

describe('quem vê e quem busca a criança', () => {
  const VINCULOS = {
    '/v1/criancas/c1/vinculos': [
      {
        id: 'v1',
        criancaId: 'c1',
        usuarioId: 'r1',
        nome: 'Marina Prado',
        celular: null,
        tipo: 'MAE',
        podeVisualizar: true,
        podeRetirar: true,
        podeAutorizar: true,
        bloqueado: false,
        motivoBloqueio: null,
      },
      {
        id: 'v2',
        criancaId: 'c1',
        usuarioId: 'r2',
        nome: 'Rogério Prado',
        celular: null,
        tipo: 'PAI',
        podeVisualizar: false,
        podeRetirar: false,
        podeAutorizar: false,
        bloqueado: true,
        motivoBloqueio: 'Medida protetiva 123/2026',
      },
    ],
    '/v1/criancas/c1/autorizados': [
      {
        id: 'x1',
        criancaId: 'c1',
        nome: 'Marta Prado',
        documento: '123.456.789-00',
        parentesco: 'Avó',
        validoAte: '2026-12-18',
        ativo: true,
      },
    ],
  };

  /**
   * O bloqueio é a decisão de maior consequência do produto. A tela tem que
   * mostrar o motivo — é o que sustenta a decisão quando o outro responsável
   * perguntar por que perdeu o acesso.
   */
  it('mostra o motivo do bloqueio e esconde as permissões de quem está bloqueado', async () => {
    responderCom(VINCULOS);

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/criancas/c1/acesso'));

    expect(await screen.findByText('Rogério Prado')).toBeDefined();
    expect(screen.getByText('bloqueado')).toBeDefined();
    expect(screen.getByText('Medida protetiva 123/2026')).toBeDefined();
    expect(screen.getByRole('button', { name: /Remover bloqueio/ })).toBeDefined();

    // Quem está bloqueado não expõe caixas de permissão para marcar por engano.
    expect(screen.getAllByText('Pode buscar a criança').length).toBe(1);
  });

  it('lista os autorizados a retirar com a validade', async () => {
    responderCom(VINCULOS);

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/criancas/c1/acesso'));

    expect(await screen.findByText('Marta Prado')).toBeDefined();
    expect(screen.getByText(/123.456.789-00/)).toBeDefined();
    expect(screen.getByText('vale hoje')).toBeDefined();
    expect(screen.getByText(/até 18\/12\/2026/)).toBeDefined();
  });
});

describe('equipe', () => {
  it('oferece o cadastro de uma nova pessoa para a gestão', async () => {
    responderCom({
      '/v1/equipe': [
        {
          id: 'u1',
          nome: 'Ana Souza',
          email: 'ana.souza@escolamodelo.com.br',
          papeis: ['EDUCADOR'],
          ativo: true,
          ultimoAcesso: null,
          turmas: ['Berçário II'],
        },
      ],
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/equipe'));

    expect(await screen.findByText('Ana Souza')).toBeDefined();
    expect(screen.getByRole('button', { name: /Nova pessoa/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Desativar acesso/ })).toBeDefined();
  });
});

/**
 * O outro lado da porta: a educadora não deve nem alcançar as telas novas
 * digitando a rota — ela veria uma sequência de 403.
 */
describe('quem não é da gestão', () => {
  it.each([
    ['/gestao/turmas'],
    ['/gestao/comunicados'],
    ['/gestao/cardapio'],
    ['/gestao/ano-letivo'],
    ['/gestao/criancas/c1/acesso'],
  ])('devolve a educadora para as turmas em %s', async (rota) => {
    responderCom({ '/v1/turmas': [TURMA] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(rota));

    expect(await screen.findByText('Olá, Ana')).toBeDefined();
  });
});
