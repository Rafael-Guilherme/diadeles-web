import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { App as AppResponsavel } from '@/apps/responsavel/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { chamadas, comStatus, responderCom } from './preparo';

/**
 * Entrar e sair fora da demonstração.
 *
 * A API tinha login da equipe, entrada por convite e revogação de sessão desde
 * o M0, e nenhuma das três tinha tela: dava para experimentar o produto e não
 * dava para usá-lo. É o tipo de buraco que compila, passa no typecheck e só
 * aparece quando alguém tenta entrar de verdade.
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

const SESSAO_NOVA = {
  accessToken: 'token-novo',
  refreshToken: 'refresh-novo',
  expiraEm: 900,
  usuario: {
    id: 'u1',
    nome: 'Ana Souza',
    papeis: ['EDUCADOR'],
    escolaId: 'e1',
    escolaNome: 'Escola Modelo',
    app: 'educador',
  },
};

const SESSAO_ATIVA: Sessao = {
  ...SESSAO_NOVA,
  accessToken: 'token-de-teste',
  refreshToken: 'refresh-de-teste',
} as Sessao;

/** Ambiente de produção: sem demonstração, a API responde 404 em `/demo`. */
const SEM_DEMO = comStatus(404, {
  codigo: 'DEMO_DESABILITADO',
  mensagem: 'Modo demonstração desabilitado neste ambiente.',
});

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

describe('entrada da equipe', () => {
  it('oferece a conta real ao lado dos perfis de demonstração', async () => {
    responderCom({ '/v1/demo': PERFIS });

    render(envolver(<AppEducador />));

    expect(await screen.findByText('Ana Souza')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com minha conta' }));

    expect(screen.getByLabelText('E-mail')).toBeDefined();
    expect(screen.getByLabelText('Senha')).toBeDefined();
  });

  it('faz login com e-mail e senha e guarda a sessão', async () => {
    responderCom({ '/v1/demo': PERFIS, '/v1/auth/login': SESSAO_NOVA, '/v1/turmas': [] });

    render(envolver(<AppEducador />));

    fireEvent.click(await screen.findByRole('button', { name: 'Entrar com minha conta' }));
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana.souza@escolamodelo.com.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(useSessao.getState().accessToken).toBe('token-novo'));

    const login = chamadas.find((c) => c.url.includes('/auth/login'));
    expect(login?.metodo).toBe('POST');
    // O rótulo do aparelho é o que permite revogar a sessão certa depois.
    expect((login?.corpo as { deviceLabel?: string }).deviceLabel).toBeTruthy();
  });

  it('mostra o erro que a API devolveu, e não um genérico', async () => {
    responderCom({
      '/v1/demo': PERFIS,
      '/v1/auth/login': comStatus(401, {
        codigo: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'E-mail ou senha incorretos.',
      }),
    });

    render(envolver(<AppEducador />));

    fireEvent.click(await screen.findByRole('button', { name: 'Entrar com minha conta' }));
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@escola.com.br' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaerrada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined();
    expect(useSessao.getState().accessToken).toBeNull();
  });

  /*
   * Sem demonstração, a tela é o formulário — e não uma mensagem de erro. Era
   * o que acontecia antes: uma instalação de produção normal exibia "não
   * consegui falar com a API" para todo mundo.
   */
  it('vira tela de login quando o ambiente não tem demonstração', async () => {
    responderCom({ '/v1/demo': SEM_DEMO });

    render(envolver(<AppEducador />));

    expect(await screen.findByLabelText('E-mail')).toBeDefined();
    expect(screen.queryByText(/Não consegui falar com a API/)).toBeNull();
    expect(screen.queryByText(/Ambiente de demonstração/)).toBeNull();
  });
});

describe('entrada da família', () => {
  it('entra pelo convite da escola, sem senha', async () => {
    responderCom({
      '/v1/demo': PERFIS,
      '/v1/auth/convite': { ...SESSAO_NOVA, usuario: { ...SESSAO_NOVA.usuario, app: 'responsavel' } },
      '/v1/criancas/minhas': [],
    });

    render(envolver(<AppResponsavel />));

    fireEvent.click(await screen.findByRole('button', { name: 'Tenho um convite da escola' }));
    fireEvent.change(screen.getByLabelText('Código do convite'), {
      target: { value: 'ali-ce24' },
    });
    fireEvent.change(screen.getByLabelText('Seu celular'), {
      target: { value: '(11) 98888-7777' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com o convite' }));

    await waitFor(() => expect(useSessao.getState().accessToken).toBe('token-novo'));

    const convite = chamadas.find((c) => c.url.includes('/auth/convite'));
    const corpo = convite?.corpo as { codigo: string; celular: string };
    // O código sai em maiúsculas e o celular sem máscara: é o que a API espera.
    expect(corpo.codigo).toBe('ALI-CE24');
    expect(corpo.celular).toBe('11988887777');
  });

  it('não pede senha nenhuma à família', async () => {
    responderCom({ '/v1/demo': SEM_DEMO });

    render(envolver(<AppResponsavel />));

    expect(await screen.findByLabelText('Código do convite')).toBeDefined();
    expect(screen.queryByLabelText('Senha')).toBeNull();
  });
});

describe('sair', () => {
  it('revoga a sessão no servidor, e não só no aparelho', async () => {
    responderCom({ '/v1/turmas': [], '/v1/auth/sair': {} });

    useSessao.getState().definir(SESSAO_ATIVA);
    render(envolver(<AppEducador />));

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      const sair = chamadas.find((c) => c.url.includes('/auth/sair'));
      expect((sair?.corpo as { refreshToken?: string })?.refreshToken).toBe('refresh-de-teste');
    });

    await waitFor(() => expect(useSessao.getState().accessToken).toBeNull());
  });

  /* Sem rede o educador ainda precisa conseguir sair do app do celular. */
  it('sai do aparelho mesmo quando a API não responde', async () => {
    responderCom({ '/v1/turmas': [], '/v1/auth/sair': comStatus(500, {}) });

    useSessao.getState().definir(SESSAO_ATIVA);
    render(envolver(<AppEducador />));

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(useSessao.getState().accessToken).toBeNull());
  });
});
