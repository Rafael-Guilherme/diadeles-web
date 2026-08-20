import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Check, Printer, Send, ShieldCheck } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { ehDaGestao, useSessao } from '@/shared/auth/sessao';
import { Aviso, Botao, Cartao, Carregando, Etiqueta, RotuloSecao } from '@/shared/ui/componentes';
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

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo={data.criancaNome}
        subtitulo={`${data.periodoNome} · ${data.turmaNome}`}
        voltarPara={`/turma/${turmaId}/pareceres`}
      />

      <main className="space-y-5 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Etiqueta tom={publicado ? 'ok' : 'neutro'}>
            {publicado ? 'publicado' : data.status === 'EM_REVISAO' ? 'em revisão' : 'rascunho'}
          </Etiqueta>
          <span className="text-xs text-[color:var(--color-tinta-suave)]">
            escrito por {data.autorNome}
            {data.revisorNome ? ` · revisado por ${data.revisorNome}` : ''}
          </span>
        </div>

        {publicado ? (
          <Aviso tom="ok">
            A família já recebeu este parecer. O texto não muda mais — se houver correção, publique
            um novo.
          </Aviso>
        ) : (
          <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
            O que está escrito veio dos registros do semestre e é só contagem. O que a criança
            mostrou, quem escreve é você.
          </p>
        )}

        <section className="space-y-2">
          <RotuloSecao>Abertura</RotuloSecao>
          <textarea
            value={atual.textoGeral}
            disabled={publicado}
            onChange={(e) => {
              setSalvo(false);
              setRascunho({ ...atual, textoGeral: e.target.value });
            }}
            rows={3}
            aria-label="Abertura do parecer"
            className="w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white px-3 py-2.5 text-[16px] leading-relaxed outline-none focus:border-(color:--cor-acao) disabled:bg-[color:var(--color-papel)]"
          />
        </section>

        <section className="space-y-2">
          <RotuloSecao apoio={`${escritos} de 5`}>Campos de experiência</RotuloSecao>

          <ul className="space-y-(--gap-lista)">
            {atual.itens.map((item) => (
              <li key={item.campo}>
                <Cartao interno className="space-y-2.5">
                  <p className="text-sm font-semibold">{item.campoNome}</p>

                  <textarea
                    value={item.texto}
                    disabled={publicado}
                    onChange={(e) => editarItem(item.campo, { texto: e.target.value })}
                    rows={4}
                    aria-label={item.campoNome}
                    placeholder="Nada foi registrado neste campo no semestre. Escreva o que você observou."
                    className="w-full rounded-(--raio) border border-[color:var(--color-borda)] px-3 py-2 text-[16px] leading-relaxed outline-none focus:border-(color:--cor-acao) disabled:bg-[color:var(--color-papel)]"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {NIVEIS.map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        type="button"
                        disabled={publicado}
                        onClick={() => editarItem(item.campo, { nivel: valor })}
                        aria-pressed={(item.nivel ?? '') === valor}
                        className={`min-h-9 rounded-(--raio) border px-2.5 text-xs font-medium transition disabled:opacity-60 ${
                          (item.nivel ?? '') === valor
                            ? 'border-(color:--cor-acao) bg-(color:--cor-acao) text-white'
                            : 'border-[color:var(--color-borda)] bg-white'
                        }`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </Cartao>
              </li>
            ))}
          </ul>
        </section>

        {erro && <Aviso>{erro}</Aviso>}
        {salvo && <Aviso tom="ok">Salvo.</Aviso>}

        {!publicado && (
          <div className="space-y-2">
            <Botao
              bloco
              disabled={!mudou || salvar.isPending}
              onClick={() => salvar.mutate(atual)}
            >
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </Botao>

            {data.status === 'RASCUNHO' && (
              <Botao
                variante="secundario"
                bloco
                disabled={mudou || mudarEstado.isPending}
                onClick={() => mudarEstado.mutate('revisao')}
              >
                <Send size={16} /> Mandar para a coordenação
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
              <p className="text-center text-xs text-[color:var(--color-tinta-tenue)]">
                Salve antes de enviar ou publicar.
              </p>
            )}
          </div>
        )}

        {publicado && (
          <Botao variante="secundario" bloco onClick={() => window.print()}>
            <Printer size={16} /> Imprimir ou salvar em PDF
          </Botao>
        )}

        {publicado && (
          <p className="flex items-center gap-1.5 text-xs text-[color:var(--color-ok)]">
            <Check size={13} /> Publicado em{' '}
            {data.publicadoEm ? new Date(data.publicadoEm).toLocaleDateString('pt-BR') : ''}
          </p>
        )}
      </main>
    </div>
  );
}
