import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import {
  Area,
  Aviso,
  Botao,
  Campo,
  Cartao,
  Carregando,
  Etiqueta,
  RotuloSecao,
  Vazio,
} from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

interface Rascunho {
  titulo: string;
  corpo: string;
  exigeCiencia: boolean;
  turmas: string[];
}

const VAZIO: Rascunho = { titulo: '', corpo: '', exigeCiencia: false, turmas: [] };

/**
 * Comunicados escritos pela escola, com a taxa de leitura ao lado.
 *
 * A taxa não é vaidade: ela existe para a coordenação saber a quem ligar. Por
 * isso a lista de quem não leu vem antes da de quem leu, e o número aparece com
 * o denominador — "12 de 30" diz o que "12 leituras" não diz.
 */
export function ComunicadosGestao() {
  const cliente = useQueryClient();
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [abertas, setAbertas] = useState<string | null>(null);

  const comunicados = useQuery({
    queryKey: ['comunicados'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/comunicados');
      if (error) throw error;
      return data;
    },
  });

  const turmas = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  const recarregar = () => cliente.invalidateQueries({ queryKey: ['comunicados'] });

  const publicar = useMutation({
    mutationFn: async ({ dados, agora }: { dados: Rascunho; agora: boolean }) => {
      const { error } = await api.POST('/v1/comunicados', {
        body: {
          titulo: dados.titulo.trim(),
          corpo: dados.corpo.trim(),
          exigeCiencia: dados.exigeCiencia,
          alvoTurmas: dados.turmas,
          publicar: agora,
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setRascunho(null);
      await recarregar();
    },
  });

  const publicarRascunho = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.POST('/v1/comunicados/{id}/publicar', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  if (comunicados.isLoading || !comunicados.data) {
    return (
      <>
        <Cabecalho titulo="Comunicados" voltarPara="/gestao" />
        <Carregando texto="Buscando os comunicados…" />
      </>
    );
  }

  const erro = publicar.error ?? publicarRascunho.error;
  const podeEnviar = rascunho && rascunho.titulo.trim().length >= 3 && rascunho.corpo.trim().length >= 3;

  return (
    <div className="min-h-full pb-10">
      <Cabecalho titulo="Comunicados" voltarPara="/gestao" />

      <main className="space-y-4 px-4 py-4">
        {erro && <Aviso>{mensagemDeErro(erro)}</Aviso>}

        {rascunho ? (
          <Cartao interno className="space-y-3">
            <RotuloSecao>Novo comunicado</RotuloSecao>

            <Campo
              rotulo="Título"
              value={rascunho.titulo}
              placeholder="Reunião de pais — 22/08"
              onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
            />

            <Area
              rotulo="Mensagem"
              rows={5}
              value={rascunho.corpo}
              onChange={(e) => setRascunho({ ...rascunho, corpo: e.target.value })}
            />

            <div className="space-y-1.5">
              <p className="text-sm font-semibold">Para quem</p>
              <p className="text-xs text-[color:var(--color-tinta-tenue)]">
                Sem nenhuma turma marcada, vai para a escola inteira.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(turmas.data ?? []).map((turma) => {
                  const marcada = rascunho.turmas.includes(turma.id);
                  return (
                    <button
                      key={turma.id}
                      aria-pressed={marcada}
                      onClick={() =>
                        setRascunho({
                          ...rascunho,
                          turmas: marcada
                            ? rascunho.turmas.filter((t) => t !== turma.id)
                            : [...rascunho.turmas, turma.id],
                        })
                      }
                      className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${
                        marcada
                          ? 'bg-(color:--cor-acao) text-white'
                          : 'bg-white text-[color:var(--color-tinta-suave)] ring-1 ring-inset ring-[color:var(--color-borda-forte)]'
                      }`}
                    >
                      {turma.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={rascunho.exigeCiencia}
                onChange={(e) => setRascunho({ ...rascunho, exigeCiencia: e.target.checked })}
              />
              Pedir confirmação de leitura
            </label>

            <div className="flex gap-2">
              <Botao
                bloco
                disabled={publicar.isPending || !podeEnviar}
                onClick={() => publicar.mutate({ dados: rascunho, agora: true })}
              >
                <Send size={15} /> {publicar.isPending ? 'Enviando…' : 'Publicar'}
              </Botao>
              <Botao
                variante="secundario"
                disabled={publicar.isPending || !podeEnviar}
                onClick={() => publicar.mutate({ dados: rascunho, agora: false })}
              >
                Salvar rascunho
              </Botao>
            </div>

            <Botao variante="fantasma" bloco onClick={() => setRascunho(null)}>
              Cancelar
            </Botao>
          </Cartao>
        ) : (
          <Botao bloco onClick={() => setRascunho(VAZIO)}>
            <Plus size={16} /> Novo comunicado
          </Botao>
        )}

        {comunicados.data.length === 0 && !rascunho && (
          <Vazio
            icone={<Megaphone size={22} />}
            titulo="Nenhum comunicado ainda"
            descricao="O que você publicar aqui aparece na caixa de avisos de cada família."
          />
        )}

        <div className="space-y-(--gap-lista)">
          {comunicados.data.map((c) => (
            <Cartao key={c.id} interno className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 font-semibold">{c.titulo}</p>
                {c.rascunho ? (
                  <Etiqueta>rascunho</Etiqueta>
                ) : (
                  c.exigeCiencia && <Etiqueta tom="marca">pede ciência</Etiqueta>
                )}
              </div>

              <p className="line-clamp-3 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                {c.corpo}
              </p>

              {c.alvoTurmas.length > 0 && (
                <p className="text-xs text-[color:var(--color-tinta-tenue)]">
                  Dirigido a {c.alvoTurmas.length}{' '}
                  {c.alvoTurmas.length === 1 ? 'turma' : 'turmas'}
                </p>
              )}

              {c.rascunho ? (
                <Botao
                  bloco
                  disabled={publicarRascunho.isPending}
                  onClick={() => publicarRascunho.mutate(c.id)}
                >
                  <Send size={15} /> Publicar
                </Botao>
              ) : (
                <>
                  <Botao
                    variante="secundario"
                    bloco
                    onClick={() => setAbertas(abertas === c.id ? null : c.id)}
                  >
                    {abertas === c.id ? 'Fechar leituras' : 'Ver quem leu'}
                  </Botao>
                  {abertas === c.id && <Leituras comunicadoId={c.id} />}
                </>
              )}
            </Cartao>
          ))}
        </div>
      </main>
    </div>
  );
}

function Leituras({ comunicadoId }: { comunicadoId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['leituras', comunicadoId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/comunicados/{id}/leituras', {
        params: { path: { id: comunicadoId } },
      });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data) return <Carregando texto="Conferindo as leituras…" />;

  return (
    <div className="space-y-2 border-t border-[color:var(--color-borda)] pt-2.5">
      <p className="numerico text-sm font-semibold">
        {data.leram} de {data.destinatarios} leram
        <span className="ml-1 font-normal text-[color:var(--color-tinta-suave)]">
          ({data.percentual}%)
        </span>
      </p>

      <ul className="space-y-1">
        {data.familias.map((f) => (
          <li
            key={`${f.responsavelId}-${f.criancaId}`}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="min-w-0 truncate">
              {f.responsavel}
              <span className="text-[color:var(--color-tinta-tenue)]"> · {f.crianca}</span>
            </span>
            {f.lidoEm ? (
              <Etiqueta tom="ok">leu</Etiqueta>
            ) : (
              <Etiqueta tom="alerta">não leu</Etiqueta>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
