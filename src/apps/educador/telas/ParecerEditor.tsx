import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Check, Printer, Send, ShieldCheck } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { ehDaGestao, useSessao } from '@/shared/auth/sessao';
import { Aviso, Botao, Cartao, Carregando, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const NIVEIS: [string, string][] = [
  ['', 'sem avaliação'],
  ['EM_CONSTRUCAO', 'Em construção'],
  ['EM_DESENVOLVIMENTO', 'Em desenvolvimento'],
  ['CONSOLIDADO', 'Consolidado'],
];

interface Item {
  campo: string;
  campoNome: string;
  texto: string;
  nivel?: string | null;
}

/**
 * A escrita do parecer descritivo.
 *
 * O que o gerador entregou é evidência contável: quantas atividades, quantas
 * refeições, qual a frequência. O que falta é o que só a educadora tem — ter
 * visto a criança. Por isso a tela é um editor de texto por campo, e não um
 * formulário de notas: o parecer é um documento em prosa, lido pela família e
 * arquivado pela escola.
 *
 * O nível ("em construção", "consolidado") fica vazio de propósito quando o
 * rascunho chega. É a única avaliação do documento, e nenhum software deveria
 * chutá-la a partir de registros de fralda e almoço.
 */
export function ParecerEditor() {
  const { turmaId = '', parecerId = '' } = useParams();
  const clienteQuery = useQueryClient();
  const usuario = useSessao((estado) => estado.usuario);

  const [rascunho, setRascunho] = useState<{ textoGeral: string; itens: Item[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  // Um campo por vez. Cinco caixas de texto abertas ao mesmo tempo é o que faz
  // a educadora escrever um parágrafo curto em cada e desistir do quinto.
  const [emFoco, setEmFoco] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['parecer', parecerId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/relatorios/{id}', {
        params: { path: { id: parecerId } },
      });
      if (error) throw error;
      return data;
    },
  });

  function invalidar() {
    void clienteQuery.invalidateQueries({ queryKey: ['parecer', parecerId] });
    void clienteQuery.invalidateQueries({ queryKey: ['pareceres'] });
  }

  const salvar = useMutation({
    mutationFn: async (corpo: { textoGeral: string; itens: Item[] }) => {
      const { error } = await api.PATCH('/v1/relatorios/{id}', {
        params: { path: { id: parecerId } },
        body: {
          textoGeral: corpo.textoGeral,
          itens: corpo.itens.map((i) => ({
            campo: i.campo as 'EU_OUTRO_NOS',
            texto: i.texto,
            nivel: (i.nivel || undefined) as 'CONSOLIDADO' | undefined,
          })),
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setErro(null);
      setSalvo(true);
      setRascunho(null);
      setTimeout(() => setSalvo(false), 2500);
      invalidar();
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  const mudarEstado = useMutation({
    mutationFn: async (acao: 'revisao' | 'publicar') => {
      const rota =
        acao === 'revisao' ? '/v1/relatorios/{id}/revisao' : '/v1/relatorios/{id}/publicar';
      const { error } = await api.POST(rota, { params: { path: { id: parecerId } } });
      if (error) throw error;
    },
    onSuccess: () => {
      setErro(null);
      invalidar();
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Parecer" voltarPara={`/turma/${turmaId}/pareceres`} />
        <Carregando />
      </>
    );
  }

  const publicado = data.status === 'PUBLICADO';
  const atual = rascunho ?? {
    textoGeral: data.textoGeral ?? '',
    itens: data.itens as Item[],
  };

  function editarItem(campo: string, mudanca: Partial<Item>) {
    setSalvo(false);
    setRascunho({
      ...atual,
      itens: atual.itens.map((i) => (i.campo === campo ? { ...i, ...mudanca } : i)),
    });
  }

  const escritos = atual.itens.filter((i) => i.texto.trim().length > 0).length;
  const mudou = rascunho !== null;

  const itemAtual = atual.itens[emFoco];

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo={`${data.criancaNome} · ${data.periodoNome}`}
        subtitulo={`${data.turmaNome} · escrito por ${data.autorNome}${
          data.revisorNome ? ` · revisado por ${data.revisorNome}` : ''
        }`}
        voltarPara={`/turma/${turmaId}/pareceres`}
      />

      {/* O passo do documento, sempre visível: rascunho, revisão, publicado.
          Quem escreve não publica — a barra existe para que a educadora saiba,
          sem perguntar, em que mão o parecer está. */}
      <div className="flex items-center gap-1.5 border-b border-[color:var(--color-borda)] bg-white px-3 py-2">
        {(
          [
            ['RASCUNHO', 'Rascunho'],
            ['EM_REVISAO', 'Revisão'],
            ['PUBLICADO', 'Publicado'],
          ] as const
        ).map(([valor, rotulo]) => (
          <span
            key={valor}
            className={`rounded-(--raio-sm) px-2.5 py-1 text-xs font-semibold ${
              data.status === valor
                ? 'bg-(color:--cor-acao) text-white'
                : 'text-[color:var(--color-tinta-tenue)]'
            }`}
          >
            {rotulo}
          </span>
        ))}
        <span className="flex-1" />
        {publicado && (
          <Botao variante="secundario" tamanho="compacto" onClick={() => window.print()}>
            <Printer size={15} /> Imprimir
          </Botao>
        )}
      </div>

      <main className="grid gap-4 px-3 py-4 lg:grid-cols-[220px_1fr_260px] lg:px-6">
        {/* Coluna 1 — os campos e em que pé está cada um. */}
        <nav className="space-y-1.5">
          <RotuloSecao apoio={`${escritos} de 5`}>Campos de experiência</RotuloSecao>
          <ul className="space-y-1.5">
            {atual.itens.map((item, indice) => {
              const palavras = contarPalavras(item.texto);
              return (
                <li key={item.campo}>
                  <button
                    onClick={() => setEmFoco(indice)}
                    aria-current={indice === emFoco}
                    className={`w-full rounded-(--raio) border p-2.5 text-left transition ${
                      indice === emFoco
                        ? 'border-(color:--cor-acao) bg-(color:--cor-acao-suave)'
                        : 'border-[color:var(--color-borda)] bg-white'
                    }`}
                  >
                    <span className="block text-sm font-medium leading-snug">{item.campoNome}</span>
                    <span
                      className={`numerico block text-2xs ${
                        palavras === 0
                          ? 'text-[color:var(--color-sol-700)]'
                          : 'text-[color:var(--color-tinta-tenue)]'
                      }`}
                    >
                      {indice === emFoco
                        ? 'escrevendo agora'
                        : palavras === 0
                          ? 'vazio'
                          : `escrito · ${palavras} palavras`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="pt-2">
            <RotuloSecao>Abertura</RotuloSecao>
            <button
              onClick={() => setEmFoco(-1)}
              aria-current={emFoco === -1}
              className={`mt-1.5 w-full rounded-(--raio) border p-2.5 text-left transition ${
                emFoco === -1
                  ? 'border-(color:--cor-acao) bg-(color:--cor-acao-suave)'
                  : 'border-[color:var(--color-borda)] bg-white'
              }`}
            >
              <span className="block text-sm font-medium">Parágrafo de abertura</span>
              <span className="numerico block text-2xs text-[color:var(--color-tinta-tenue)]">
                {contarPalavras(atual.textoGeral)} palavras
              </span>
            </button>
          </div>
        </nav>

        {/* Coluna 2 — o campo em foco, com a tela inteira para ele. */}
        <section className="min-w-0 space-y-3">
          {emFoco === -1 ? (
            <>
              <div>
                <p className="text-2xs uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
                  Abertura
                </p>
                <h2 className="text-xl font-semibold">Parágrafo de abertura</h2>
                <p className="mt-1 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
                  Como a criança chegou e como está saindo do semestre. É o primeiro parágrafo do
                  documento impresso.
                </p>
              </div>
              <textarea
                value={atual.textoGeral}
                disabled={publicado}
                onChange={(e) => {
                  setSalvo(false);
                  setRascunho({ ...atual, textoGeral: e.target.value });
                }}
                rows={10}
                aria-label="Abertura do parecer"
                className="w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3.5 py-3 text-[16px] leading-relaxed outline-none focus:border-(color:--cor-acao) disabled:bg-[color:var(--color-papel)]"
              />
            </>
          ) : (
            itemAtual && (
              <>
                <div>
                  <p className="text-2xs uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
                    Campo {emFoco + 1} de {atual.itens.length}
                  </p>
                  <h2 className="text-xl font-semibold">{itemAtual.campoNome}</h2>
                  <p className="mt-1 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
                    Escreva sobre o percurso, não sobre nota — o texto vai inteiro para a família,
                    exatamente como está aqui.
                  </p>
                </div>

                <div>
                  <textarea
                    value={itemAtual.texto}
                    disabled={publicado}
                    onChange={(e) => editarItem(itemAtual.campo, { texto: e.target.value })}
                    rows={12}
                    aria-label={itemAtual.campoNome}
                    placeholder="Nada foi registrado neste campo no semestre. Escreva o que você observou."
                    className="w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3.5 py-3 text-[16px] leading-relaxed outline-none focus:border-(color:--cor-acao) disabled:bg-[color:var(--color-papel)]"
                  />
                  <p className="numerico mt-1 text-right text-2xs text-[color:var(--color-tinta-tenue)]">
                    {contarPalavras(itemAtual.texto)} palavras · mínimo sugerido 80
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {NIVEIS.map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      disabled={publicado}
                      onClick={() => editarItem(itemAtual.campo, { nivel: valor })}
                      aria-pressed={(itemAtual.nivel ?? '') === valor}
                      className={`min-h-9 rounded-(--raio) border px-2.5 text-xs font-medium transition disabled:opacity-60 ${
                        (itemAtual.nivel ?? '') === valor
                          ? 'border-(color:--cor-acao) bg-(color:--cor-acao) text-white'
                          : 'border-[color:var(--color-borda)] bg-white'
                      }`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>

                <Aviso tom="neutro">
                  A família lê este texto exatamente como está escrito. Observação interna de
                  ocorrência e anotação da coordenação não entram no parecer.
                </Aviso>

                <div className="flex gap-2">
                  <Botao
                    variante="secundario"
                    className="flex-1"
                    disabled={emFoco <= 0}
                    onClick={() => setEmFoco(emFoco - 1)}
                  >
                    ← Anterior
                  </Botao>
                  <Botao
                    variante="secundario"
                    className="flex-1"
                    disabled={emFoco >= atual.itens.length - 1}
                    onClick={() => setEmFoco(emFoco + 1)}
                  >
                    Próximo →
                  </Botao>
                </div>
              </>
            )
          )}
        </section>

        {/* Coluna 3 — quem assina, e o que falta para publicar. */}
        <aside className="space-y-4">
          {publicado ? (
            <Aviso tom="ok" titulo="Publicado para a família">
              O texto não muda mais. Se houver correção, publique uma nova versão — a família vê as
              duas.
            </Aviso>
          ) : (
            <>
              {erro && <Aviso>{erro}</Aviso>}
              {salvo && <Aviso tom="ok">Salvo.</Aviso>}

              <Botao bloco disabled={!mudou || salvar.isPending} onClick={() => salvar.mutate(atual)}>
                {salvar.isPending ? 'Salvando…' : 'Salvar'}
              </Botao>

              {data.status === 'RASCUNHO' && (
                <Botao
                  variante="secundario"
                  bloco
                  disabled={mudou || mudarEstado.isPending}
                  onClick={() => mudarEstado.mutate('revisao')}
                >
                  <Send size={16} /> Enviar para revisão
                </Botao>
              )}

              {/* Quem escreve não assina sozinho: a revisão por outra pessoa é o
                  que separa um parecer de uma anotação. */}
              {ehDaGestao(usuario?.papeis ?? []) && (
                <Botao
                  variante="secundario"
                  bloco
                  disabled={mudou || escritos < 5 || mudarEstado.isPending}
                  onClick={() => mudarEstado.mutate('publicar')}
                >
                  <ShieldCheck size={16} /> Publicar para a família
                </Botao>
              )}

              {mudou && (
                <p className="text-xs text-[color:var(--color-tinta-tenue)]">
                  Salve antes de enviar ou publicar.
                </p>
              )}
            </>
          )}

          <div className="space-y-2">
            <RotuloSecao>Quem publica</RotuloSecao>
            <Cartao interno className="space-y-2">
              <p className="text-sm">
                <strong className="font-semibold">{data.autorNome}</strong> escreve
              </p>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                {data.revisorNome ? `${data.revisorNome} revisa e publica` : 'A coordenação revisa e publica'}
              </p>
              <p className="text-xs leading-snug text-[color:var(--color-tinta-tenue)]">
                Quem escreve não publica. Depois de publicado, correção exige nova versão — e a
                família vê as duas.
              </p>
            </Cartao>
          </div>

          {publicado && data.publicadoEm && (
            <p className="numerico flex items-center gap-1.5 text-xs text-[color:var(--color-ok)]">
              <Check size={13} /> Publicado em {new Date(data.publicadoEm).toLocaleDateString('pt-BR')}
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}

/** Contagem simples: o editor mostra progresso, não corrige texto. */
function contarPalavras(texto: string): number {
  const limpo = texto.trim();
  return limpo ? limpo.split(/\s+/).length : 0;
}
