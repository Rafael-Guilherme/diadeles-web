import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { App as AppResponsavel } from '@/apps/responsavel/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { chamadas, comStatus, responderCom } from './preparo';

/**
 * O parecer descritivo — a funcionalidade que, sozinha, justifica a assinatura
 * (docs/plano-produto.md §1).
 *
 * O risco desta tela não é quebrar: é publicar. Depois de publicado o texto
 * chega à família e vira documento da escola, então o que estes testes travam
 * é o caminho até lá — quem pode publicar, com o quê, e o que acontece com o
 * texto depois.
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

const COORDENADORA: Sessao = {
  ...EDUCADORA,
  usuario: { ...EDUCADORA.usuario, id: 'u2', nome: 'Beatriz Lima', papeis: ['COORDENADOR'] },
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

const CAMPOS: [string, string][] = [
  ['EU_OUTRO_NOS', 'O eu, o outro e o nós'],
  ['CORPO_GESTOS_MOVIMENTOS', 'Corpo, gestos e movimentos'],
  ['TRACOS_SONS_CORES_FORMAS', 'Traços, sons, cores e formas'],
  ['ESCUTA_FALA_PENSAMENTO_IMAGINACAO', 'Escuta, fala, pensamento e imaginação'],
  ['ESPACOS_TEMPOS_QUANTIDADES', 'Espaços, tempos, quantidades, relações e transformações'],
];

function itens(preenchidos: number) {
  return CAMPOS.map(([campo, campoNome], indice) => ({
    campo,
    campoNome,
    texto: indice < preenchidos ? `Evidência do campo ${indice + 1}.` : '',
    nivel: null,
  }));
}

const PARECER = {
  id: 'r1',
  criancaId: 'c1',
  criancaNome: 'Sofia Prado',
  turmaId: 't1',
  turmaNome: 'Berçário II',
  periodo: '2026-2',
  periodoNome: '2º semestre de 2026',
  status: 'RASCUNHO',
  textoGeral: 'Sofia esteve presente em 29 dos 31 dias com registro de chamada no período.',
  autorNome: 'Ana Souza',
  revisorNome: null,
  publicadoEm: null,
  itens: itens(5),
};

const LISTA = [
  {
    criancaId: 'c1',
    criancaNome: 'Sofia Prado',
    relatorioId: 'r1',
    status: 'RASCUNHO',
    camposEscritos: 5,
  },
  {
    criancaId: 'c2',
    criancaNome: 'Miguel Antunes',
    relatorioId: null,
    status: null,
    camposEscritos: 0,
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

describe('lista do semestre', () => {
  it('mostra a turma inteira, inclusive quem ainda não tem parecer', async () => {
    responderCom({ '/v1/relatorios/turma/t1': LISTA });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/pareceres'));

    expect(await screen.findByText('Sofia Prado')).toBeDefined();
    expect(screen.getByText('5 de 5 campos escritos')).toBeDefined();
    // Quem não tem parecer não pode sumir da lista: é justamente quem falta.
    expect(screen.getByText('Miguel Antunes')).toBeDefined();
    expect(screen.getByRole('button', { name: /Gerar/ })).toBeDefined();
  });

  it('gera o rascunho a partir do período escolhido', async () => {
    responderCom({ '/v1/relatorios/turma/t1': LISTA, '/v1/relatorios/gerar': PARECER });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/pareceres'));

    fireEvent.click(await screen.findByRole('button', { name: /Gerar/ }));

    await waitFor(() => {
      const pedido = chamadas.find((c) => c.url.includes('/relatorios/gerar'));
      const corpo = pedido?.corpo as { criancaId: string; periodo: string };
      expect(corpo.criancaId).toBe('c2');
      expect(corpo.periodo).toMatch(/^\d{4}-[12]$/);
    });
  });
});

describe('escrever o parecer', () => {
  it('abre com os cinco campos da BNCC', async () => {
    responderCom({ '/v1/relatorios/r1': PARECER });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    for (const [, nome] of CAMPOS) {
      expect(await screen.findByLabelText(nome)).toBeDefined();
    }
  });

  /* O nível é a única avaliação do documento — e é do professor, não do gerador. */
  it('não traz nível preenchido no rascunho', async () => {
    responderCom({ '/v1/relatorios/r1': PARECER });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    const semAvaliacao = await screen.findAllByRole('button', { name: 'sem avaliação' });
    expect(semAvaliacao).toHaveLength(5);
    expect(semAvaliacao.every((b) => b.getAttribute('aria-pressed') === 'true')).toBe(true);
  });

  it('salva o texto editado com o campo a que pertence', async () => {
    responderCom({ '/v1/relatorios/r1': PARECER });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    fireEvent.change(await screen.findByLabelText('O eu, o outro e o nós'), {
      target: { value: 'Brincou com os colegas e dividiu os brinquedos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      const patch = chamadas.find((c) => c.url.includes('/relatorios/r1') && c.metodo === 'PATCH');
      const corpo = patch?.corpo as { itens: { campo: string; texto: string }[] };
      const campo = corpo.itens.find((i) => i.campo === 'EU_OUTRO_NOS');
      expect(campo?.texto).toBe('Brincou com os colegas e dividiu os brinquedos.');
    });
  });

  it('não deixa a educadora publicar', async () => {
    responderCom({ '/v1/relatorios/r1': PARECER });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    expect(await screen.findByRole('button', { name: /Mandar para a coordenação/ })).toBeDefined();
    // Quem escreve não assina sozinho.
    expect(screen.queryByRole('button', { name: /Publicar para a família/ })).toBeNull();
  });

  it('deixa a coordenação publicar, mas só com os cinco campos escritos', async () => {
    responderCom({ '/v1/relatorios/r1': { ...PARECER, status: 'EM_REVISAO', itens: itens(3) } });

    useSessao.getState().definir(COORDENADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    const publicar = await screen.findByRole('button', { name: /Publicar para a família/ });
    expect((publicar as HTMLButtonElement).disabled).toBe(true);
  });

  it('bloqueia a edição depois de publicado', async () => {
    responderCom({
      '/v1/relatorios/r1': {
        ...PARECER,
        status: 'PUBLICADO',
        revisorNome: 'Beatriz Lima',
        publicadoEm: '2026-08-19T12:00:00.000Z',
      },
    });

    useSessao.getState().definir(COORDENADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    const campo = await screen.findByLabelText('O eu, o outro e o nós');
    expect((campo as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
    expect(screen.getByText(/A família já recebeu este parecer/)).toBeDefined();
  });

  it('mostra o erro da API quando faltam campos para a revisão', async () => {
    responderCom({
      '/v1/relatorios/r1/revisao': comStatus(409, {
        codigo: 'CONFLITO',
        mensagem: 'Faltam 2 campos de experiência para escrever.',
      }),
      '/v1/relatorios/r1': PARECER,
    });

    useSessao.getState().definir(EDUCADORA);
    render(envolver(<AppEducador />, '/turma/t1/parecer/r1'));

    fireEvent.click(await screen.findByRole('button', { name: /Mandar para a coordenação/ }));

    expect(await screen.findByText('Faltam 2 campos de experiência para escrever.')).toBeDefined();
  });
});

describe('o parecer na mão da família', () => {
  const PUBLICADO = {
    ...PARECER,
    status: 'PUBLICADO',
    revisorNome: 'Beatriz Lima',
    publicadoEm: '2026-08-19T12:00:00.000Z',
    itens: CAMPOS.map(([campo, campoNome], indice) => ({
      campo,
      campoNome,
      texto: indice === 0 ? 'Brincou com os colegas e dividiu os brinquedos.' : '',
      nivel: indice === 0 ? 'EM_DESENVOLVIMENTO' : null,
    })),
  };

  it('lê o parecer com quem escreveu e quem revisou', async () => {
    responderCom({ '/v1/relatorios/meus': [PUBLICADO] });

    useSessao.getState().definir(FAMILIA);
    render(envolver(<AppResponsavel />, '/pareceres'));

    expect(await screen.findByText('Sofia Prado')).toBeDefined();
    expect(screen.getByText(/2º semestre de 2026/)).toBeDefined();
    expect(screen.getByText('Brincou com os colegas e dividiu os brinquedos.')).toBeDefined();
    // A assinatura dupla é o que separa um parecer de uma anotação.
    expect(screen.getByText(/Escrito por Ana Souza, revisado por Beatriz Lima/)).toBeDefined();
  });

  /* Campo em branco não vira seção vazia no documento da família. */
  it('omite os campos sem texto', async () => {
    responderCom({ '/v1/relatorios/meus': [PUBLICADO] });

    useSessao.getState().definir(FAMILIA);
    render(envolver(<AppResponsavel />, '/pareceres'));

    expect(await screen.findByText('O eu, o outro e o nós')).toBeDefined();
    expect(screen.queryByText('Corpo, gestos e movimentos')).toBeNull();
  });

  it('explica a ausência quando ainda não há parecer', async () => {
    responderCom({ '/v1/relatorios/meus': [] });

    useSessao.getState().definir(FAMILIA);
    render(envolver(<AppResponsavel />, '/pareceres'));

    expect(await screen.findByText('Nenhum parecer ainda')).toBeDefined();
  });
});
