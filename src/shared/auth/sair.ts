import { api } from '../api/cliente';
import { sessaoStore } from './sessao';

/**
 * Sair de verdade: revoga a sessão no servidor **e** limpa o aparelho.
 *
 * Limpar só o `localStorage` não bastaria. O refresh token dura meses por
 * desenho (docs/arquitetura.md §5), então uma sessão apagada só do lado do
 * device continuaria válida na API — e "Sair" no celular emprestado, ou no
 * tablet que fica na sala, não faria o que promete.
 *
 * A ordem é revogar primeiro, limpar depois, mas a limpeza acontece de todo
 * jeito: sem rede, o educador ainda precisa conseguir sair do app. Nesse caso
 * o que fica é uma sessão órfã no servidor, que expira sozinha — pior que
 * revogar, melhor que prender a pessoa dentro do app.
 */
export async function sair(): Promise<void> {
  const refreshToken = sessaoStore.getState().refreshToken;

  if (refreshToken) {
    try {
      await api.POST('/v1/auth/sair', { body: { refreshToken } });
    } catch {
      // Falha de rede não pode impedir a saída.
    }
  }

  sessaoStore.getState().encerrar();
}
