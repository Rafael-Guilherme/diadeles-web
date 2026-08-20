import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { responderCom } from './preparo';

/**
 * O registro em lote e os tipos que a API cobra.
 *
 * A grade oferecia quatro tipos e a API esperava sete: uma turma de crianças
 * pequenas carregava uma pendência de `ATIVIDADE` que não existia botão para
 * fechar, e a tela de fechamento do turno cobrava isso todo dia. Pendência
 * impossível de resolver ensina a equipe a ignorar o indicador inteiro.
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

const GRADE = {
  turma: {
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
  },
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
      // O que a API cobra desta faixa etária, e que a grade precisa saber registrar.
      pendencias: ['ALIMENTACAO', 'HUMOR', 'ATIVIDADE'],
      temMedicacaoHoje: false,
    },
  ],
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

async function abrirLoteDe(tipo: string) {
  responderCom({ '/v1/turmas/t2/grade': GRADE, '/v1/recados': [] });
  useSessao.getState().definir(EDUCADORA);
  render(envolver('/turma/t2'));

  fireEvent.click(await screen.findByText('Arthur Vieira'));
  fireEvent.click(screen.getByRole('button', { name: tipo }));
}

beforeEach(() => {
  useSessao.getState().encerrar();
});

describe('registro em lote', () => {
  it('oferece os sete tipos que o painel sabe preencher', async () => {
    responderCom({ '/v1/turmas/t2/grade': GRADE, '/v1/recados': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/turma/t2'));

    fireEvent.click(await screen.findByText('Arthur Vieira'));

    for (const tipo of ['Refeição', 'Sono', 'Fralda', 'Humor', 'Atividade', 'Água', 'Recado']) {
      expect(screen.getByRole('button', { name: tipo })).toBeDefined();
    }
  });

  /*
   * A API monta a frase da linha do tempo a partir do título (`timeline.ts`).
   * Sem ele, a família receberia um item em branco no dia da criança — pior
   * que registro nenhum, porque parece defeito do app.
   */
  it('não deixa registrar atividade sem dizer qual foi', async () => {
    await abrirLoteDe('Atividade');

    const registrar = await screen.findByRole('button', { name: /Registrar para 1/ });
    expect((registrar as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Qual foi a atividade'), {
      target: { value: 'Pintura com guache' },
    });
    expect((registrar as HTMLButtonElement).disabled).toBe(false);
  });

  it('não deixa registrar recado vazio', async () => {
    await abrirLoteDe('Recado');

    const registrar = await screen.findByRole('button', { name: /Registrar para 1/ });
    expect((registrar as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('O recado'), {
      target: { value: 'Levou a touca para casa' },
    });
    expect((registrar as HTMLButtonElement).disabled).toBe(false);
  });

  it('registra água por toque, sem teclado', async () => {
    await abrirLoteDe('Água');

    expect(await screen.findByRole('button', { name: '150 ml' })).toBeDefined();
    expect((screen.getByRole('button', { name: /Registrar para 1/ }) as HTMLButtonElement).disabled)
      .toBe(false);
  });
});
