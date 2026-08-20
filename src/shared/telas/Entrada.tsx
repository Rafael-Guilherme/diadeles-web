import { useEffect, useState } from 'react';
import { API_URL } from '../api/cliente';
import { useSessao, type Sessao } from '../auth/sessao';
import { Aviso, Botao, Cartao, Carregando } from '../ui/componentes';
import { FormularioEntrada } from './FormularioEntrada';

interface PerfilDemo {
  chave: string;
  nome: string;
  cargo: string;
  descricao: string;
  app: 'educador' | 'responsavel';
}

/** Demonstração ligada, desligada, ou ainda não se sabe. */
type EstadoDemo = 'carregando' | 'disponivel' | 'indisponivel' | 'apiFora';

/**
 * A porta de entrada dos dois apps, com dois caminhos que não competem.
 *
 * Onde a demonstração está ligada, ela vem primeiro: um toque e a pessoa está
 * dentro de uma escola plausível, sem cadastro e sem senha para decorar. É o
 * que o site promete, e é a razão de existir deste ambiente.
 *
 * A entrada real fica logo abaixo — equipe com e-mail e senha, família com o
 * código do convite. Quando `DEMO_MODE` está desligado, a API responde 404 em
 * `/demo` e é a entrada real que vira a tela inteira. Essa distinção importa:
 * uma instalação de produção sem demonstração não é um erro a ser relatado ao
 * usuário, é o estado normal dela.
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
  const [perfis, setPerfis] = useState<PerfilDemo[]>([]);
  const [estado, setEstado] = useState<EstadoDemo>('carregando');
  const [entrando, setEntrando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);

  useEffect(() => {
    let ativo = true;

    fetch(`${API_URL}/demo`)
      .then(async (resposta) => {
        if (!ativo) return;

        // 404 aqui é resposta, não falha: é a API dizendo que este ambiente não
        // tem demonstração. Só erro de rede é problema para mostrar.
        if (!resposta.ok) {
          setEstado('indisponivel');
          return;
        }

        const dados = (await resposta.json()) as { perfis: PerfilDemo[] };
        setPerfis(dados.perfis.filter((p) => p.app === app));
        setEstado('disponivel');
      })
      .catch(() => {
        if (ativo) setEstado('apiFora');
      });

    return () => {
      ativo = false;
    };
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

  const temDemo = estado === 'disponivel';
  // Sem demonstração, o formulário é a tela — não faz sentido escondê-lo atrás
  // de um botão quando não há mais nada para mostrar.
  const mostrarFormulario = formularioAberto || estado === 'indisponivel';

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <img src="/pwa-192.png" alt="" className="h-12 w-12 rounded-(--raio)" />
          <div>
            <h1 className="text-2xl">{titulo}</h1>
            <p className="text-sm text-[color:var(--color-tinta-suave)]">
              {estado === 'indisponivel'
                ? app === 'educador'
                  ? 'Entre com o e-mail e a senha da sua escola.'
                  : 'Entre com o convite que a escola enviou.'
                : subtitulo}
            </p>
          </div>
        </div>
      </header>

      {erro && <Aviso>{erro}</Aviso>}

      {estado === 'apiFora' && (
        <Aviso>Não consegui falar com a API. Confira se ela está rodando em {API_URL}</Aviso>
      )}

      {estado === 'carregando' && <Carregando texto="Abrindo…" />}

      {temDemo && (
        <div className="space-y-(--gap-lista)">
          {perfis.map((perfil) => (
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
                  // Três cartões com um botão "Entrar" cada, mais o do
                  // formulário abaixo: sem o nome, quem usa leitor de tela ouve
                  // "Entrar" quatro vezes e não sabe em qual está.
                  aria-label={`Entrar como ${perfil.nome}`}
                  className="shrink-0"
                >
                  {entrando === perfil.chave ? 'Entrando…' : 'Entrar'}
                </Botao>
              </div>
            </Cartao>
          ))}
        </div>
      )}

      {temDemo && !formularioAberto && (
        <>
          <Separador />
          <button
            onClick={() => setFormularioAberto(true)}
            className="min-h-11 text-sm font-semibold text-(color:--cor-acao)"
          >
            {app === 'educador' ? 'Entrar com minha conta' : 'Tenho um convite da escola'}
          </button>
        </>
      )}

      {mostrarFormulario && (
        <>
          {temDemo && <Separador />}
          <FormularioEntrada app={app} />
        </>
      )}

      {temDemo && (
        <p className="text-center text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
          Ambiente de demonstração. Os dados são fictícios e podem ser recriados a qualquer momento.
        </p>
      )}
    </div>
  );
}

function Separador() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[color:var(--color-borda)]" />
      <span className="text-2xs font-semibold uppercase tracking-wider text-[color:var(--color-tinta-tenue)]">
        ou
      </span>
      <span className="h-px flex-1 bg-[color:var(--color-borda)]" />
    </div>
  );
}
