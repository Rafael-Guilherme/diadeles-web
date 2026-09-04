import { useEffect, useState } from 'react';
import { API_URL } from '../api/cliente';
import { useSessao, type Sessao } from '../auth/sessao';
import { Avatar, Aviso, Botao, Cartao, Carregando } from '../ui/componentes';
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
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      {/* A faixa de ambiente fica no topo e sempre visível, não como nota de
          rodapé: é ela que impede alguém de confundir esta escola inventada
          com a escola de verdade (5c). */}
      {temDemo && (
        <p className="flex items-start gap-2 border-b border-[color:var(--color-sol-200)] bg-[color:var(--color-sol-50)] px-5 py-2.5 text-xs leading-snug text-[color:var(--color-sol-700)]">
          <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-sol-600)]" />
          Ambiente de demonstração. Dados fictícios, recriados a qualquer momento.
        </p>
      )}

      <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-10">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <img src="/pwa-192.png" alt="" className="h-12 w-12 rounded-(--raio)" />
            <div>
              <h1 className="text-2xl">{titulo}</h1>
              <p className="text-sm leading-snug text-[color:var(--color-tinta-suave)]">
                {estado === 'indisponivel'
                  ? app === 'educador'
                    ? 'Entre com o e-mail que a escola cadastrou. O mesmo acesso serve para equipe e coordenação — o app se ajusta ao seu papel.'
                    : 'Entre com o convite que a escola enviou. Ele chega por e-mail e vale sete dias.'
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
                  <Avatar nome={perfil.nome} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
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

        {/* Quem chega sem acesso não erra a senha — ele nunca teve uma. A saída
            é a secretaria, e dizer isso aqui poupa a tentativa de "esqueci". */}
        {mostrarFormulario && (
          <Cartao interno className="mt-2">
            <p className="text-sm font-semibold">Ainda não tem acesso?</p>
            <p className="mt-1 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
              Quem cria conta é a escola. Pergunte à secretaria — o convite chega por e-mail e vale
              sete dias.
            </p>
          </Cartao>
        )}

        <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
          Ao entrar você concorda com os termos de uso e a política de privacidade.
        </p>
      </div>
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
