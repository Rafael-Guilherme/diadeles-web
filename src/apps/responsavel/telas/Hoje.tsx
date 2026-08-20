import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Baby,
  Bell,
  Check,
  Download,
  Droplets,
  LogIn,
  LogOut,
  Moon,
  Smile,
  Sparkles,
  Utensils,
  NotebookPen,
  MessageSquarePlus,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '@/shared/api/cliente';
import { useSessao } from '@/shared/auth/sessao';
import { sair } from '@/shared/auth/sair';
import { useInstalacao } from '@/shared/pwa/instalacao';
import { Cartao, Carregando, Etiqueta, Vazio } from '@/shared/ui/componentes';
import { ConviteAvisos } from '../componentes/ConviteAvisos';

const ICONES: Record<string, ReactNode> = {
  ALIMENTACAO: <Utensils size={16} />,
  SONO: <Moon size={16} />,
  HIGIENE: <Baby size={16} />,
  HIDRATACAO: <Droplets size={16} />,
  HUMOR: <Smile size={16} />,
  ATIVIDADE: <Sparkles size={16} />,
  OBSERVACAO: <NotebookPen size={16} />,
};

/** O que a escola fez diante de uma ocorrência — é o que transforma o aviso em confiança. */
function conduta(dados: unknown): string | null {
  if (typeof dados !== 'object' || !dados || !('conduta' in dados)) return null;
  const valor = (dados as Record<string, unknown>).conduta;
  return typeof valor === 'string' && valor.trim() ? valor : null;
}

/** `null` quando a família ainda não confirmou que leu a ocorrência. */
function cienteEm(dados: unknown): string | null {
  if (typeof dados !== 'object' || !dados || !('cienteEm' in dados)) return null;
  const valor = (dados as Record<string, unknown>).cienteEm;
  return typeof valor === 'string' ? valor : null;
}

/**
 * A tela que a família abre. Tudo aqui é frase pronta, montada na API —
 * ninguém em casa quer decifrar "ALIMENTACAO: aceitacao=METADE".
 */
export function Hoje() {
  const usuario = useSessao((estado) => estado.usuario);
  const [saindo, setSaindo] = useState(false);
  const { instalado } = useInstalacao();
  const clienteQuery = useQueryClient();

  const { data: criancas, isLoading: carregandoCriancas } = useQuery({
    queryKey: ['minhas-criancas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/minhas');
      if (error) throw error;
      return data;
    },
  });

  const criancaId = criancas?.[0]?.id;

  const { data: dia, isLoading } = useQuery({
    enabled: Boolean(criancaId),
    queryKey: ['dia', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{id}/dia', {
        params: { path: { id: criancaId! } },
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: avisos } = useQuery({
    queryKey: ['avisos'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/notificacoes');
      if (error) throw error;
      return data;
    },
  });

  const confirmar = useMutation({
    mutationFn: async (ocorrenciaId: string) => {
      const { error } = await api.POST('/v1/ocorrencias/{id}/ciente', {
        params: { path: { id: ocorrenciaId } },
      });
      if (error) throw error;
    },
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['dia', criancaId] }),
  });

  if (carregandoCriancas || isLoading) return <Carregando texto="Buscando o dia…" />;

  if (!criancas?.length) {
    return (
      <Vazio
        titulo="Nenhuma criança vinculada"
        descricao="Peça à escola o convite de acesso para acompanhar o dia."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* O cabeçalho é a tela: quem abre no meio do dia quer a resposta aqui,
          sem rolar. Daí o resumo em tipo grande e a linha do tempo como apoio. */}
      <header className="area-segura-topo relative overflow-hidden bg-gradient-to-b from-(color:--cor-acao-suave) to-transparent px-5 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wider text-(color:--cor-acao)">
              {usuario?.escolaNome}
            </p>
            <h1 className="display mt-0.5 truncate text-2xl">{dia?.crianca.nome}</h1>
            <p className="text-sm text-[color:var(--color-tinta-suave)]">
              {dia?.crianca.turmaNome} · {dia?.crianca.idade}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* "Avisar a escola" fica no cabeçalho, ao lado do sino, e não na
                barra de baixo: é ação ocasional — a família abre o app para ver
                o dia, não para escrever. */}
            <Link
              to="/recado"
              aria-label="Avisar a escola"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-(color:--cor-acao) ring-1 ring-(color:--cor-acao-borda) transition active:scale-95"
            >
              <MessageSquarePlus size={18} />
            </Link>
            {!instalado && (
              <Link
                to="/instalar"
                className="flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-(color:--cor-acao) ring-1 ring-(color:--cor-acao-borda) transition active:scale-95"
              >
                <Download size={14} /> Instalar
              </Link>
            )}
            <Link
              to="/avisos"
              aria-label={
                avisos?.naoLidas
                  ? `Avisos, ${avisos.naoLidas} não ${avisos.naoLidas === 1 ? 'lido' : 'lidos'}`
                  : 'Avisos'
              }
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-(color:--cor-acao) ring-1 ring-(color:--cor-acao-borda) transition active:scale-95"
            >
              <Bell size={18} />
              {Boolean(avisos?.naoLidas) && (
                <span className="numerico absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--color-alerta)] px-1 text-2xs font-bold text-white">
                  {avisos!.naoLidas}
                </span>
              )}
            </Link>
          </div>
        </div>

        {dia && (
          <p className="display mt-5 text-xl leading-snug text-(color:--cor-acao-forte)">{dia.resumo}</p>
        )}

        {dia && dia.crianca.alergias.length > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-alerta-suave)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--color-alerta)] ring-1 ring-inset ring-[color:var(--color-alerta)]/15">
            <AlertTriangle size={12} /> Alergia registrada: {dia.crianca.alergias.join(', ')}
          </p>
        )}
      </header>

      <main className="space-y-(--gap-lista) px-4 pb-6">
        {dia?.timeline.length === 0 && (
          <Vazio
            icone={<Sparkles size={22} />}
            titulo="Ainda sem registros hoje"
            descricao="Assim que a escola registrar algo, aparece aqui."
          />
        )}

        {dia?.timeline.map((item) => (
          <Cartao key={item.id} interno className="flex gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-(--raio) ${
                item.categoria === 'OCORRENCIA'
                  ? 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
                  : 'bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
              }`}
            >
              {item.categoria === 'ENTRADA' ? (
                <LogIn size={16} />
              ) : item.categoria === 'SAIDA' ? (
                <LogOut size={16} />
              ) : item.categoria === 'OCORRENCIA' ? (
                <AlertTriangle size={16} />
              ) : (
                (ICONES[item.tipo ?? ''] ?? <Sparkles size={16} />)
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[15px] font-semibold leading-snug">{item.titulo}</p>
                <time className="shrink-0 text-2xs text-[color:var(--color-tinta-tenue)]">
                  {new Date(item.ocorridoEm).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              {item.detalhe && (
                <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                  {item.detalhe}
                </p>
              )}
              {/* `dados` é Json na API: o formato varia por tipo de item, então a
                  leitura aqui é defensiva em vez de tipada. */}
              {item.categoria === 'OCORRENCIA' && conduta(item.dados) && (
                <p className="mt-2.5 rounded-(--raio-sm) bg-[color:var(--color-papel)] px-3 py-2.5 text-sm leading-relaxed ring-1 ring-inset ring-[color:var(--color-borda)]">
                  <b className="font-semibold">O que fizemos: </b>
                  {conduta(item.dados)}
                </p>
              )}

              {/* A confirmação fecha o ciclo: sem ela a escola não tem como
                  provar que avisou, e é essa prova que ela precisa quando a
                  conversa vira reclamação. */}
              {item.categoria === 'OCORRENCIA' &&
                (cienteEm(item.dados) ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-[color:var(--color-ok)]">
                    <Check size={13} /> Você confirmou que leu
                  </p>
                ) : (
                  <button
                    onClick={() => confirmar.mutate(item.id)}
                    disabled={confirmar.isPending}
                    className="mt-2 min-h-11 w-full rounded-(--raio) bg-(color:--cor-acao-suave) text-sm font-semibold text-(color:--cor-acao) transition active:scale-[0.99] disabled:opacity-50"
                  >
                    Li e estou ciente
                  </button>
                ))}
            </div>
          </Cartao>
        ))}

        {/* Depois da timeline, não antes: o pedido de permissão só aparece
            quando já houve o que mostrar. Pedir na primeira tela troca a chance
            de avisar todo dia por um "Bloquear" reflexo (plano-produto §8). */}
        {Boolean(dia?.timeline.length) && <ConviteAvisos />}

        {dia && !dia.saidaEm && dia.presente && (
          <p className="pt-2 text-center text-xs text-[color:var(--color-tinta-suave)]">
            <Etiqueta tom="ok">na escola agora</Etiqueta>
          </p>
        )}

        <button
          onClick={() => {
            setSaindo(true);
            void sair();
          }}
          disabled={saindo}
          className="w-full pt-6 text-center text-sm text-[color:var(--color-tinta-suave)] underline disabled:opacity-50"
        >
          {saindo ? 'Saindo…' : 'Sair'}
        </button>
      </main>
    </div>
  );
}
