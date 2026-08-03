import { useEffect, useState } from 'react';
import { API_URL } from '../api/cliente';
import { useSessao, type Sessao } from '../auth/sessao';
import { Aviso, Botao, Cartao, Carregando } from '../ui/componentes';

interface PerfilDemo {
  chave: string;
  nome: string;
  cargo: string;
  descricao: string;
  app: 'educador' | 'responsavel';
}

/**
 * Entrada do modo demonstração: um toque e a pessoa está dentro, com dados de
 * uma escola plausível. Sem cadastro, sem senha para decorar.
 *
 * No produto real, a equipe entra com e-mail e senha e a família entra por
 * convite da escola — nunca por esta tela (docs/arquitetura.md §5).
 */
export function Entrada({
  app,
  titulo,
  subtitulo,
}: {
  app: 'educador' | 'responsavel';
  titulo: string;
  subtitulo: string;
}) {
  const definirSessao = useSessao((estado) => estado.definir);
  const [perfis, setPerfis] = useState<PerfilDemo[] | null>(null);
  const [entrando, setEntrando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/demo`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('demo indisponível'))))
      .then((dados: { perfis: PerfilDemo[] }) =>
        setPerfis(dados.perfis.filter((p) => p.app === app)),
      )
      .catch(() =>
        setErro('Não consegui falar com a API. Confira se ela está rodando em ' + API_URL),
      );
  }, [app]);

  async function entrar(chave: string) {
    setEntrando(chave);
    setErro(null);
    try {
      const resposta = await fetch(`${API_URL}/demo/entrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil: chave }),
      });
      if (!resposta.ok) throw new Error('falha');
      definirSessao((await resposta.json()) as Sessao);
    } catch {
      setErro('Não foi possível entrar. Tente novamente.');
      setEntrando(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <img src="/pwa-192.png" alt="" className="h-12 w-12 rounded-(--raio)" />
          <div>
            <h1 className="text-2xl">{titulo}</h1>
            <p className="text-sm text-[color:var(--color-tinta-suave)]">{subtitulo}</p>
          </div>
        </div>
      </header>

      {erro && <Aviso>{erro}</Aviso>}

      {!perfis && !erro && <Carregando texto="Buscando perfis de demonstração…" />}

      <div className="space-y-(--gap-lista)">
        {perfis?.map((perfil) => (
          <Cartao key={perfil.chave} interno>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{perfil.nome}</p>
                <p className="text-xs font-medium text-(color:--cor-acao)">{perfil.cargo}</p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                  {perfil.descricao}
                </p>
              </div>
              <Botao
                onClick={() => void entrar(perfil.chave)}
                disabled={entrando !== null}
                className="shrink-0"
              >
                {entrando === perfil.chave ? 'Entrando…' : 'Entrar'}
              </Botao>
            </div>
          </Cartao>
        ))}
      </div>

      <p className="text-center text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
        Ambiente de demonstração. Os dados são fictícios e podem ser recriados a qualquer momento.
      </p>
    </div>
  );
}
