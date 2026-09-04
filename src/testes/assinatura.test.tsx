import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { chamadas, responderCom } from './preparo';

/**
 * A tela da assinatura.
 *
 * O modelo é por criança ativa/mês, então o valor muda todo mês e a escola
 * sempre pergunta "por que este número?". A tela responde antes de ser
 * perguntada — e, enquanto não há provedor configurado, precisa deixar claro
 * que ninguém está sendo cobrado de verdade.
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

const ASSINATURA = {
  plano: 'profissional',
  status: 'ATIVA',
  precoPorCrianca: '11.90',
  minimoCriancas: 20,
  diaVencimento: 10,
  trialAte: null,
  diasDeTrial: 0,
  criancasAtivas: 12,
  valorEstimado: '238.00',
  proximaApuracao: '2026-09-01',
  ambiente: 'simulado',
  faturas: [
    {
      id: 'f1',
      competencia: '2026-08',
      competenciaNome: 'agosto de 2026',
      criancasAtivas: 12,
      criancasCobradas: 20,
      valor: '238.00',
      vencimento: '2026-08-10',
      status: 'PENDENTE',
      emAtraso: true,
      linkPagamento: null,
      pagoEm: null,
      simulada: true,
    },
    {
      id: 'f2',
      competencia: '2026-07',
      competenciaNome: 'julho de 2026',
      criancasAtivas: 12,
      criancasCobradas: 20,
      valor: '238.00',
      vencimento: '2026-07-10',
      status: 'PAGA',
      emAtraso: false,
      linkPagamento: null,
      pagoEm: '2026-07-08T12:00:00.000Z',
      simulada: true,
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

beforeEach(() => {
  useSessao.getState().encerrar();
});

describe('assinatura', () => {
  it('explica por que a conta é maior que o número de crianças', async () => {
    responderCom({ '/v1/assinatura': ASSINATURA });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/assinatura'));

    // O valor aparece na estimativa do mês e em cada fatura do mesmo valor.
    expect(await screen.findAllByText('R$ 238,00')).toHaveLength(3);
    // A frase é montada de vários nós JSX, então o casamento é pelo texto da
    // tela inteira em vez de por elemento.
    expect(document.body.textContent).toContain('12 crianças matriculadas × R$ 11,90');
    // Sem esta linha, a escola liga para o suporte.
    expect(screen.getByText(/Cobrança sobre o mínimo do plano: 20 crianças/)).toBeDefined();
  });

  /* Uma tela de cobrança que não avisa que a cobrança é falsa é uma armadilha. */
  it('avisa que nada é cobrado de verdade no modo simulado', async () => {
    responderCom({ '/v1/assinatura': ASSINATURA });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/assinatura'));

    expect(await screen.findByText(/Nenhuma cobrança é emitida de verdade/)).toBeDefined();
  });

  it('destaca fatura vencida', async () => {
    responderCom({ '/v1/assinatura': ASSINATURA });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/assinatura'));

    expect(await screen.findByText('1 fatura vencida.')).toBeDefined();
    expect(screen.getByText('vencida')).toBeDefined();
    expect(screen.getByText('paga')).toBeDefined();
  });

  it('mostra os dias que faltam de avaliação, sem falar em cobrança', async () => {
    responderCom({
      '/v1/assinatura': {
        ...ASSINATURA,
        status: 'TRIAL',
        diasDeTrial: 12,
        trialAte: '2026-09-01',
        faturas: [],
      },
    });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/assinatura'));

    expect(await screen.findByText(/faltam 12 dias/)).toBeDefined();
    expect(screen.getByText(/Nenhuma fatura ainda/)).toBeDefined();
  });

  it('dispara a apuração manual', async () => {
    responderCom({ '/v1/assinatura': ASSINATURA, '/v1/faturamento/apurar': ASSINATURA.faturas[0] });

    useSessao.getState().definir(GESTORA);
    render(envolver('/gestao/assinatura'));

    fireEvent.click(await screen.findByRole('button', { name: /Apurar este mês agora/ }));

    await waitFor(() => {
      expect(chamadas.some((c) => c.url.includes('/faturamento/apurar'))).toBe(true);
    });
  });

  it('não deixa a educadora ver a assinatura', async () => {
    responderCom({ '/v1/turmas': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/gestao/assinatura'));

    expect(await screen.findByText(/^(Bom dia|Boa tarde|Boa noite), Ana$/)).toBeDefined();
  });
});

/**
 * A faixa da régua de inadimplência.
 *
 * O caso que importa é o do D+20: o educador aperta salvar, nada grava, e sem
 * uma explicação em tela ele conclui que o app quebrou. A faixa existe para
 * que a escola descubra a causa antes de perder a manhã ligando para a
 * coordenação.
 */
describe('faixa de inadimplência', () => {
  const AVISO_D10 = {
    etapa: 10,
    bloqueado: false,
    atrasoEmDias: 12,
    competenciaNome: 'julho de 2026',
    valor: '238.00',
    mensagem:
      'A fatura de julho de 2026 está com 12 dias de atraso. No 20º dia a equipe deixa de conseguir registrar a rotina.',
  };

  it('não aparece quando a escola está em dia', async () => {
    // A rota devolve nulo, que é o estado normal de quem paga.
    responderCom({ '/v1/assinatura/aviso': null, '/v1/turmas': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/'));

    await screen.findByText(/^(Bom dia|Boa tarde|Boa noite), Ana$/);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('aparece para a educadora, sem caminho para a fatura', async () => {
    responderCom({ '/v1/assinatura/aviso': AVISO_D10, '/v1/turmas': [] });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/'));

    const faixa = await screen.findByRole('status');
    expect(faixa.textContent).toContain('12 dias de atraso');
    // Educador não resolve boleto: mandá-lo a uma tela que a API recusa seria
    // pior do que não oferecer link nenhum.
    expect(faixa.tagName).not.toBe('A');
  });

  it('leva a gestora à tela da assinatura', async () => {
    responderCom({ '/v1/assinatura/aviso': AVISO_D10, '/v1/turmas': [] });

    useSessao.getState().definir(GESTORA);
    render(envolver('/'));

    // A faixa deixou de ser um link inteiro: o texto explica, e o caminho para
    // pagar é um botão dentro dela — só para quem pode pagar.
    await screen.findByRole('status');
    const paraAFatura = screen.getByRole('link', { name: /Ver a fatura/ });
    expect(paraAFatura.getAttribute('href')).toBe('/gestao/assinatura');
  });

  it('diz que os registros pararam quando a escrita está cortada', async () => {
    responderCom({
      '/v1/assinatura/aviso': {
        ...AVISO_D10,
        etapa: 20,
        bloqueado: true,
        atrasoEmDias: 21,
        mensagem:
          'Registros suspensos: a fatura de julho de 2026 está com 21 dias de atraso. As famílias continuam vendo o que já foi registrado.',
      },
      '/v1/turmas': [],
    });

    useSessao.getState().definir(EDUCADORA);
    render(envolver('/'));

    const faixa = await screen.findByRole('status');
    expect(faixa.textContent).toContain('Registros suspensos');
    // A frase que evita o telefonema: a família não deixou de ver o dia.
    expect(faixa.textContent).toContain('famílias continuam vendo');
  });
});
