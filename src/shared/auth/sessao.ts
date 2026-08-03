import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UsuarioSessao {
  id: string;
  nome: string;
  email?: string | null;
  papeis: string[];
  escolaId: string;
  escolaNome: string;
  app: 'educador' | 'responsavel';
}

export interface Sessao {
  accessToken: string;
  refreshToken: string;
  expiraEm: number;
  usuario: UsuarioSessao;
}

interface EstadoSessao {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioSessao | null;
  definir: (sessao: Sessao) => void;
  encerrar: () => void;
}

/**
 * A sessão é presa ao device e dura meses (docs/arquitetura.md §5): o app é
 * instalado, então guardar o refresh localmente é o que permite o responsável
 * nunca mais ver tela de login. Login recorrente seria o maior ponto de
 * abandono do lado da família.
 */
export const useSessao = create<EstadoSessao>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,

      definir: (sessao) =>
        set({
          accessToken: sessao.accessToken,
          refreshToken: sessao.refreshToken,
          usuario: sessao.usuario,
        }),

      encerrar: () => set({ accessToken: null, refreshToken: null, usuario: null }),
    }),
    {
      name: 'diadeles.sessao',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Acesso fora de componentes (middleware do cliente HTTP). */
export const sessaoStore = useSessao;

export function estaAutenticado(): boolean {
  return Boolean(useSessao.getState().accessToken);
}
