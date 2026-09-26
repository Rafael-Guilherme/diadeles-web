import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App as AppEducador } from '@/apps/educador/App';
import { App as AppResponsavel } from '@/apps/responsavel/App';
import { useSessao, type Sessao } from '@/shared/auth/sessao';
import { chamadas, comStatus, responderCom } from './preparo';

/**
 * A recuperação de senha da equipe.
 *
 * Antes disto não havia nenhuma: a senha provisória saía uma vez na tela da
 * secretaria e não ficava recuperável, e a educadora que a esquecesse numa
 * terça-feira de manhã só voltava a entrar por `UPDATE` no banco. Compilava,
 * passava no typecheck e só aparecia quando alguém tentava entrar de verdade.
 */

const SEM_DEMO = comStatus(404, {
  codigo: 'DEMO_DESABILITADO',
  mensagem: 'Modo demonstração desabilitado neste ambiente.',
});

const SESSAO: Sessao = {
  accessToken: 'token-de-teste',
  refreshToken: 'refresh-de-teste',
  expiraEm: 900,
  usuario: {
    id: 'u1',
    nome: 'Ana Souza',
    papeis: ['EDUCADOR'],
    escolaId: 'e1',
    escolaNome: 'Escola Modelo',
    app: 'educador',
  },
} as Sessao;

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

describe('esqueci minha senha', () => {
  it('a entrada da equipe oferece o caminho', async () => {
    responderCom({ '/v1/demo': SEM_DEMO });

    render(envolver(<AppEducador />));

    expect(await screen.findByRole('link', { name: 'Esqueci minha senha' })).toBeDefined();
  });

  it('não aparece do lado da família — não há senha para esquecer', async () => {
    responderCom({ '/v1/demo': SEM_DEMO });

    render(envolver(<AppResponsavel />));

    await screen.findByLabelText('Código do convite');
    expect(screen.queryByText('Esqueci minha senha')).toBeNull();
  });

  it('responde igual para e-mail que existe e para e-mail que não existe', async () => {
    responderCom({ '/v1/auth/senha/esqueci': comStatus(204) });

    render(envolver(<AppEducador />, '/esqueci-senha'));

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ninguem@lugar.nenhum' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar o link' }));

    /*
      A confirmação é escrita no condicional — "se houver uma conta com esse
      e-mail". Um "enviamos para você" afirmaria que a conta existe, e a tela
      viraria um oráculo de quem trabalha na escola.
    */
    expect(await screen.findByText(/Se houver uma conta com/)).toBeDefined();
    expect(screen.getByText('ninguem@lugar.nenhum')).toBeDefined();
  });

  it('avisa que a secretaria resolve na hora', async () => {
    responderCom({ '/v1/auth/senha/esqueci': comStatus(204) });

    render(envolver(<AppEducador />, '/esqueci-senha'));

    // O link do e-mail não cobre a educadora parada na porta da sala.
    expect(screen.getByText(/A secretaria da escola gera uma senha nova na hora/)).toBeDefined();
  });
});

describe('redefinir com o link do e-mail', () => {
  it('funciona deslogado — é o estado de quem clicou no e-mail', () => {
    responderCom({});

    render(envolver(<AppEducador />, '/redefinir-senha?token=abc123'));

    // Sem isto o link cairia na tela de entrada e o token se perderia.
    expect(screen.getByRole('heading', { name: 'Criar uma senha nova' })).toBeDefined();
    expect(useSessao.getState().accessToken).toBeNull();
  });

  it('recusa link sem token e oferece pedir outro', () => {
    responderCom({});

    render(envolver(<AppEducador />, '/redefinir-senha'));

    expect(screen.getByText(/não traz o código do e-mail/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Pedir um link novo' })).toBeDefined();
  });

  it('exige as duas senhas iguais antes de deixar enviar', () => {
    responderCom({});

    render(envolver(<AppEducador />, '/redefinir-senha?token=abc123'));

    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'senha-longa-1' } });
    fireEvent.change(screen.getByLabelText('Repita a senha'), { target: { value: 'outra-coisa' } });

    expect(screen.getByText('As duas não são iguais.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Salvar a senha' }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('recusa senha curta demais', () => {
    responderCom({});

    render(envolver(<AppEducador />, '/redefinir-senha?token=abc123'));

    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'curta' } });

    expect(screen.getByText('Pelo menos 8 caracteres.')).toBeDefined();
  });

  it('manda o token e não entra sozinho depois', async () => {
    responderCom({ '/v1/auth/senha/redefinir': comStatus(204) });

    render(envolver(<AppEducador />, '/redefinir-senha?token=abc123'));

    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'senha-longa-1' } });
    fireEvent.change(screen.getByLabelText('Repita a senha'), { target: { value: 'senha-longa-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha' }));

    expect(await screen.findByRole('heading', { name: 'Senha criada' })).toBeDefined();

    const pedido = chamadas.find((c) => c.url.includes('/auth/senha/redefinir'));
    expect(pedido?.corpo).toEqual({ token: 'abc123', novaSenha: 'senha-longa-1' });

    /*
      A API derruba todas as sessões ao redefinir — é o ponto, quando o motivo
      foi um celular perdido. Entrar direto aqui contradiria isso, e digitar a
      senha uma vez é o que confirma que ela foi anotada, não só inventada.
    */
    expect(useSessao.getState().accessToken).toBeNull();
  });

  it('mostra a recusa da API e deixa pedir outro link', async () => {
    responderCom({
      '/v1/auth/senha/redefinir': comStatus(410, {
        codigo: 'REDEFINICAO_INVALIDA',
        mensagem: 'Este link não vale mais. Peça um novo em "Esqueci minha senha".',
      }),
    });

    render(envolver(<AppEducador />, '/redefinir-senha?token=velho'));

    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'senha-longa-1' } });
    fireEvent.change(screen.getByLabelText('Repita a senha'), { target: { value: 'senha-longa-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha' }));

    expect(await screen.findByText(/Este link não vale mais/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Pedir um link novo' })).toBeDefined();
  });
});

describe('trocar a senha de dentro do app', () => {
  it('troca a sessão pela que a API devolveu', async () => {
    useSessao.getState().definir(SESSAO);
    responderCom({
      '/v1/auth/senha': {
        ...SESSAO,
        accessToken: 'token-depois-da-troca',
        refreshToken: 'refresh-depois-da-troca',
      },
    });

    render(envolver(<AppEducador />, '/trocar-senha'));

    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'PQUJUWY2XQ' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'senha-minha-1' } });
    fireEvent.change(screen.getByLabelText('Repita a nova senha'), {
      target: { value: 'senha-minha-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha' }));

    // Sem isto, quem troca a própria senha seria deslogado pelo próprio ato:
    // as sessões antigas são revogadas, e a em uso é uma delas.
    await waitFor(() =>
      expect(useSessao.getState().accessToken).toBe('token-depois-da-troca'),
    );
    expect(await screen.findByText('Senha trocada')).toBeDefined();
  });

  it('não deixa repetir a senha atual', () => {
    useSessao.getState().definir(SESSAO);
    responderCom({});

    render(envolver(<AppEducador />, '/trocar-senha'));

    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'senha-igual-1' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'senha-igual-1' } });
    fireEvent.change(screen.getByLabelText('Repita a nova senha'), {
      target: { value: 'senha-igual-1' },
    });

    expect(screen.getByText('Precisa ser diferente da atual.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Salvar a senha' }).hasAttribute('disabled')).toBe(
      true,
    );
  });
});

describe('a secretaria redefine pelo painel', () => {
  const EQUIPE = [
    {
      id: 'u2',
      nome: 'Beatriz Lima',
      email: 'beatriz.lima@escolamodelo.com.br',
      papeis: ['COORDENADOR'],
      ativo: true,
      ultimoAcesso: null,
      turmas: [],
    },
    {
      id: 'u3',
      nome: 'Quem Saiu',
      email: 'saiu@escolamodelo.com.br',
      papeis: ['EDUCADOR'],
      ativo: false,
      ultimoAcesso: null,
      turmas: [],
    },
  ];

  const GESTORA: Sessao = {
    ...SESSAO,
    usuario: { ...SESSAO.usuario, papeis: ['GESTOR'] },
  } as Sessao;

  it('mostra a senha nova uma vez, com o aviso de que ela não volta', async () => {
    useSessao.getState().definir(GESTORA);
    responderCom({
      '/v1/equipe/u2/senha': {
        membro: EQUIPE[0],
        senhaProvisoria: 'PQUJUWY2XQ',
      },
      '/v1/equipe': EQUIPE,
    });

    render(envolver(<AppEducador />, '/gestao/equipe'));

    fireEvent.click(
      await screen.findByRole('button', { name: 'Gerar senha nova para Beatriz Lima' }),
    );

    expect(await screen.findByText('PQUJUWY2XQ')).toBeDefined();
    expect(screen.getByText(/não fica guardada e não dá para consultá-la de novo/)).toBeDefined();
  });

  it('não oferece senha para quem está desativado', async () => {
    useSessao.getState().definir(GESTORA);
    responderCom({ '/v1/equipe': EQUIPE });

    render(envolver(<AppEducador />, '/gestao/equipe'));

    await screen.findByText('Quem Saiu');

    // Uma senha nova ali prometeria um acesso que o `ativo: false` recusa.
    expect(screen.queryByRole('button', { name: 'Gerar senha nova para Quem Saiu' })).toBeNull();
  });
});
