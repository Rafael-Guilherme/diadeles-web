import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Send } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Area, Aviso, Botao, Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';

const CATEGORIAS = [
  { valor: 'retirada', rotulo: 'Quem busca', exemplo: 'Hoje quem busca é a avó Marta, às 17h.' },
  { valor: 'ausencia', rotulo: 'Falta', exemplo: 'Vai faltar amanhã: consulta com a pediatra.' },
  { valor: 'saude', rotulo: 'Saúde', exemplo: 'Dormiu mal e acordou com o nariz escorrendo.' },
  { valor: 'geral', rotulo: 'Outro', exemplo: 'Esqueci a garrafinha na mochila do irmão.' },
] as const;

type Categoria = (typeof CATEGORIAS)[number]['valor'];

/**
 * Recado da família para a escola.
 *
 * É de mão única de propósito. Não existe resposta, nem "digitando", nem
 * notificação de volta para cobrar retorno: o educador está com vinte crianças
 * e não pode virar atendente no meio do turno (docs/plano-produto.md §11).
 *
 * O que a família ganha no lugar da resposta é a confirmação de leitura, com o
 * nome de quem leu e a hora — que é exatamente o que o bilhete na mochila
 * nunca deu.
 */
export function Recado() {
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [categoria, setCategoria] = useState<Categoria>('retirada');
  const [corpo, setCorpo] = useState('');
  const [paraAmanha, setParaAmanha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const criancas = useQuery({
    queryKey: ['minhas-criancas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/minhas');
      if (error) throw error;
      return data;
    },
  });

  const criancaId = criancas.data?.[0]?.id;

  const meus = useQuery({
    queryKey: ['meus-recados'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/recados/meus');
      if (error) throw error;
      return data;
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/v1/recados', {
        body: {
          criancaId: criancaId!,
          categoria,
          corpo: corpo.trim(),
          referenteA: paraAmanha ? amanhaIso() : hojeIso(),
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['meus-recados'] });
      setCorpo('');
      setParaAmanha(false);
      setErro(null);
      setEnviado(true);
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (criancas.isLoading) return <Carregando texto="Abrindo…" />;

  if (!criancaId) {
    return (
      <Vazio
        titulo="Nenhuma criança vinculada"
        descricao="Peça à escola o convite de acesso para falar com a equipe por aqui."
      />
    );
  }

  const escolhida = CATEGORIAS.find((c) => c.valor === categoria)!;
  const podeEnviar = corpo.trim().length >= 3;

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="area-segura-topo bg-gradient-to-b from-(color:--cor-acao-suave) to-transparent px-5 pb-6">
        <button
          onClick={() => navegar('/')}
          aria-label="Voltar"
          className="-ml-3 mb-1 flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-tinta-suave)] transition active:bg-white/60"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="display text-2xl">Avisar a escola</h1>
        <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
          A equipe lê quando puder e confirma a leitura aqui. Para algo urgente, ligue para a
          secretaria.
        </p>
      </header>

      <main className="space-y-5 px-4 pb-6">
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            setErro(null);
            enviar.mutate();
          }}
        >
          <div className="space-y-2">
            <RotuloSecao>Sobre o quê</RotuloSecao>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => {
                    setCategoria(opcao.valor);
                    setEnviado(false);
                  }}
                  aria-pressed={categoria === opcao.valor}
                  className={`min-h-11 rounded-(--raio) border text-sm font-semibold transition ${
                    categoria === opcao.valor
                      ? 'border-(color:--cor-acao) bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                      : 'border-[color:var(--color-borda)] bg-white'
                  }`}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          <Area
            rotulo="O recado"
            rows={4}
            placeholder={escolhida.exemplo}
            apoio="Escreva como falaria na porta da sala."
            value={corpo}
            onChange={(e) => {
              setCorpo(e.target.value);
              setEnviado(false);
            }}
          />

          {/* Um recado sobre amanhã que chega como recado de hoje faz a escola
              procurar a criança na porta no dia errado. */}
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={paraAmanha}
              onChange={(e) => setParaAmanha(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-(color:--cor-acao)"
            />
            <span className="text-sm leading-snug">
              <span className="font-semibold">É sobre amanhã</span>
              <span className="block text-xs text-[color:var(--color-tinta-suave)]">
                Sem marcar, o recado vale para hoje.
              </span>
            </span>
          </label>

          {erro && <Aviso>{erro}</Aviso>}
          {enviado && <Aviso tom="ok">Recado enviado. A escola vê na turma da criança.</Aviso>}

          <Botao type="submit" bloco disabled={!podeEnviar || enviar.isPending}>
            {enviar.isPending ? (
              'Enviando…'
            ) : (
              <>
                <Send size={16} /> Enviar recado
              </>
            )}
          </Botao>
        </form>

        <section className="space-y-2">
          <RotuloSecao>O que você já avisou</RotuloSecao>

          {meus.data?.length === 0 && (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Nada ainda. O que você mandar fica aqui, com a confirmação de quem leu.
              </p>
            </Cartao>
          )}

          <ul className="space-y-(--gap-lista)">
            {(meus.data ?? []).map((recado) => (
              <li key={recado.id}>
                <Cartao interno className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta tom="marca">
                      {CATEGORIAS.find((c) => c.valor === recado.categoria)?.rotulo ??
                        recado.categoria}
                    </Etiqueta>
                    <span className="text-xs text-[color:var(--color-tinta-tenue)]">
                      {quando(recado.criadoEm)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{recado.corpo}</p>
                  {recado.lidoEm ? (
                    <p className="flex items-center gap-1 text-xs font-medium text-[color:var(--color-ok)]">
                      <Check size={13} /> {recado.lidoPorNome} leu {quando(recado.lidoEm)}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-[color:var(--color-tinta-tenue)]">
                      <Clock size={13} /> Ainda não lido pela escola
                    </p>
                  )}
                </Cartao>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function hojeIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

function amanhaIso(): string {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return data.toLocaleDateString('en-CA');
}

/** "hoje às 09:12" quando é do dia; "12/08 às 09:12" quando não é. */
function quando(iso: string): string {
  const data = new Date(iso);
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const mesmoDia = data.toLocaleDateString('en-CA') === hojeIso();
  if (mesmoDia) return `hoje às ${hora}`;
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
}
