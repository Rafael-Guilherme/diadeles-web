import { useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, Check, Download, MessageSquarePlus } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import type { components } from '@/shared/api/schema';
import { useSessao } from '@/shared/auth/sessao';
import { sair } from '@/shared/auth/sair';
import { useInstalacao } from '@/shared/pwa/instalacao';
import { Botao, Carregando, Vazio } from '@/shared/ui/componentes';
import { ConviteAvisos } from '../componentes/ConviteAvisos';

type ItemDoDia = components['schemas']['ItemTimelineDto'];

/*
  O relógio, como fonte externa.

  "agora" só vale se for agora: a etiqueta no último item de um dia já encerrado
  diria que a criança está bebendo água às sete da noite. E como a mãe deixa
  esta tela aberta no ônibus, o minuto precisa avançar sozinho — ler o relógio
  durante a renderização daria um valor congelado no primeiro desenho.

  A granularidade é o minuto de propósito: é o que a tela mostra, e um snapshot
  em milissegundos mandaria o React redesenhar sem nada ter mudado.
*/
let minutoCorrente = Math.floor(Date.now() / 60_000);

function lerMinuto(): number {
  return minutoCorrente;
}

function assinarRelogio(aoMudar: () => void): () => void {
  const tique = window.setInterval(() => {
    const minuto = Math.floor(Date.now() / 60_000);
    if (minuto === minutoCorrente) return;
    minutoCorrente = minuto;
    aoMudar();
  }, 20_000);

  return () => window.clearInterval(tique);
}

function useMinutoAtual(): number {
  return useSyncExternalStore(assinarRelogio, lerMinuto, lerMinuto) * 60_000;
}

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
 *
 * A linha do tempo tem um trilho contínuo com o horário no vão da esquerda, e
 * não um ícone por item: o que dá ritmo é a divisão por período e o peso do
 * tipo. Ícone em cada linha viraria decoração e competiria com a única coisa
 * que a mãe abriu o app para ler.
 */
export function Hoje() {
  const usuario = useSessao((estado) => estado.usuario);
  const [saindo, setSaindo] = useState(false);
  const { instalado } = useInstalacao();
  const clienteQuery = useQueryClient();

  const agora = useMinutoAtual();

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
      <div className="px-4 py-8">
        <Vazio
          titulo="Nenhuma criança vinculada"
          descricao="Peça à escola o convite de acesso para acompanhar o dia."
        />
      </div>
    );
  }

  const manha = dia?.timeline.filter((i) => new Date(i.ocorridoEm).getHours() < 12) ?? [];
  const tarde = dia?.timeline.filter((i) => new Date(i.ocorridoEm).getHours() >= 12) ?? [];
  const ultimo = dia?.timeline.at(-1);
  const emCurso =
    ultimo && agora - new Date(ultimo.ocorridoEm).getTime() < 45 * 60 * 1000
      ? ultimo.id
      : undefined;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-[color:var(--color-sol-50)]">
      {/* O cabeçalho é a tela: quem abre no meio do dia quer a resposta aqui,
          sem rolar. Daí o resumo em Fraunces e a linha do tempo como apoio. */}
      <header className="area-segura-topo flex flex-col gap-3.5 px-4 pb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="display flex h-11 w-11 shrink-0 items-center justify-center rounded-(--raio) bg-[color:var(--color-sol-100)] text-lg text-[color:var(--color-sol-700)]"
          >
            {(dia?.crianca.nomeSocial ?? dia?.crianca.nome ?? '?')[0]}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="display truncate text-2xl leading-[1.05]">
              {dia?.crianca.nomeSocial ?? dia?.crianca.nome}
            </h1>
            <p className="truncate text-sm text-[color:var(--color-sol-700)]">
              {dia?.crianca.turmaNome} · {hojePorExtenso()}
            </p>
          </div>

          {/* Só o sino no topo. Dois ícones aqui comiam a linha do nome, e a
              turma da criança virava reticências — justamente o dado que diz
              de quem é este dia. */}
          <div className="flex shrink-0 items-center gap-1.5">
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

        {dia && <p className="display text-xl leading-[1.35] text-pretty">{dia.resumo}</p>}

        <div className="flex flex-wrap gap-2">
          {dia && dia.crianca.alergias.length > 0 && (
            <span className="rounded-full bg-[color:var(--color-alerta-suave)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-alerta)] ring-1 ring-inset ring-[color:var(--color-alerta)]">
              Alergia · {dia.crianca.alergias.join(', ').toLowerCase()}
            </span>
          )}
          {contagens(dia?.timeline ?? []).map(({ rotulo, quantas }) => (
            <span
              key={rotulo}
              className="numerico rounded-full bg-[color:var(--color-sol-100)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-sol-700)]"
            >
              {rotulo} · {quantas}
            </span>
          ))}
        </div>
      </header>

      {/* A folha clara sobe por cima do papel quente: é a mudança de superfície
          que separa "como está a Sofia agora" de "o que aconteceu hoje". */}
      <div className="flex-1 rounded-t-(--raio-xl) border-t border-[color:var(--color-borda)] bg-[color:var(--color-papel)] pb-6">
        {dia?.timeline.length === 0 ? (
          <div className="px-4 py-6">
            <Vazio
              titulo="O dia ainda não começou"
              descricao="O primeiro registro aparece aqui logo depois da chegada. Você recebe um aviso quando ele chegar."
            />
          </div>
        ) : (
          <>
            <Periodo
              rotulo="Manhã"
              apoio={ultimo ? `atualizado ${hora(ultimo.ocorridoEm)}` : undefined}
              itens={manha}
              agora={emCurso}
              aoConfirmar={(id) => confirmar.mutate(id)}
              confirmando={confirmar.isPending}
            />
            <Periodo
              rotulo="Tarde"
              itens={tarde}
              agora={emCurso}
              aoConfirmar={(id) => confirmar.mutate(id)}
              confirmando={confirmar.isPending}
            />
          </>
        )}

        <div className="space-y-4 px-4 pt-2">
          {/* Depois da timeline, não antes: o pedido de permissão só aparece
              quando já houve o que mostrar. Pedir na primeira tela troca a chance
              de avisar todo dia por um "Bloquear" reflexo (plano-produto §8). */}
          {Boolean(dia?.timeline.length) && <ConviteAvisos />}

          {/* O recado é ação ocasional — a família abre o app para ver o dia,
              não para escrever. Por isso ele fecha a tela em vez de disputar o
              topo com o resumo. */}
          <Link to="/recado" className="block">
            <Botao bloco>
              <MessageSquarePlus size={18} /> Recado para a escola
            </Botao>
          </Link>

          {!instalado && (
            <Link to="/instalar" className="block">
              <Botao variante="secundario" bloco>
                <Download size={18} /> Deixar o Diadeles na tela inicial
              </Botao>
            </Link>
          )}

          <button
            onClick={() => {
              setSaindo(true);
              void sair();
            }}
            disabled={saindo}
            className="w-full pt-2 text-center text-sm text-[color:var(--color-tinta-suave)] underline disabled:opacity-50"
          >
            {saindo ? 'Saindo…' : 'Sair'}
          </button>

          <p className="pb-2 text-center text-2xs text-[color:var(--color-tinta-tenue)]">
            {usuario?.escolaNome}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Um bloco da linha do tempo, com o rótulo do período.
 *
 * A divisão manhã/tarde é o que dá ritmo sem ícone nenhum: a mãe procura "o
 * almoço" e sabe em qual metade da tela olhar.
 */
function Periodo({
  rotulo,
  apoio,
  itens,
  agora,
  aoConfirmar,
  confirmando,
}: {
  rotulo: string;
  apoio?: string;
  itens: ItemDoDia[];
  agora?: string;
  aoConfirmar: (id: string) => void;
  confirmando: boolean;
}) {
  if (itens.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3.5">
        <h2 className="text-2xs uppercase tracking-[0.12em] text-[color:var(--color-tinta-tenue)]">
          {rotulo}
        </h2>
        {apoio && <span className="text-xs text-[color:var(--color-tinta-tenue)]">{apoio}</span>}
      </div>

      <ul className="px-4">
        {itens.map((item, indice) => (
          <li key={item.id} className="flex gap-3">
            {/* O vão de 46px é o trilho: hora em cima, linha contínua embaixo.
                Ela liga um registro ao outro e é o que faz a lista parecer um
                dia, não um extrato. */}
            <div className="flex w-[46px] shrink-0 flex-col items-center">
              <time className="numerico text-xs font-semibold leading-[1.6] text-[color:var(--color-sol-700)]">
                {hora(item.ocorridoEm)}
              </time>
              {indice < itens.length - 1 && (
                <span aria-hidden className="w-0.5 flex-1 bg-[color:var(--color-sol-100)]" />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-3">
              <ItemDaLinha
                item={item}
                emCurso={item.id === agora}
                aoConfirmar={aoConfirmar}
                confirmando={confirmando}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ItemDaLinha({
  item,
  emCurso,
  aoConfirmar,
  confirmando,
}: {
  item: ItemDoDia;
  emCurso: boolean;
  aoConfirmar: (id: string) => void;
  confirmando: boolean;
}) {
  const ocorrencia = item.categoria === 'OCORRENCIA';

  return (
    <div
      className={`rounded-(--raio) bg-white p-(--padding-cartao) ${
        ocorrencia
          ? 'border border-[color:var(--color-alerta)]'
          : emCurso
            ? 'border border-[color:var(--color-sol-200)]'
            : ''
      }`}
      style={{ boxShadow: 'var(--sombra-cartao)' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p
          className={`min-w-0 flex-1 text-base font-semibold leading-snug ${
            ocorrencia ? 'text-[color:var(--color-alerta)]' : ''
          }`}
        >
          {item.titulo}
        </p>
        {emCurso && !ocorrencia && (
          <span className="shrink-0 rounded-full bg-[color:var(--color-sol-50)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-sol-700)]">
            agora
          </span>
        )}
      </div>

      {item.detalhe && (
        <p className="mt-1 text-base leading-snug text-[color:var(--color-tinta-suave)]">
          {item.detalhe}
        </p>
      )}

      {/* `dados` é Json na API: o formato varia por tipo de item, então a
          leitura aqui é defensiva em vez de tipada. */}
      {ocorrencia && conduta(item.dados) && (
        <p className="mt-2.5 rounded-(--raio-sm) bg-[color:var(--color-papel)] px-3 py-2.5 text-sm leading-relaxed">
          <b className="font-semibold">O que fizemos: </b>
          {conduta(item.dados)}
        </p>
      )}

      {/* A confirmação fecha o ciclo: sem ela a escola não tem como provar que
          avisou, e é essa prova que ela precisa quando a conversa vira
          reclamação. */}
      {ocorrencia &&
        (cienteEm(item.dados) ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-[color:var(--color-ok)]">
            <Check size={13} /> Você confirmou que leu
          </p>
        ) : (
          <>
            <Botao bloco className="mt-3" disabled={confirmando} onClick={() => aoConfirmar(item.id)}>
              Confirmar que eu li
            </Botao>
            <p className="mt-2 text-xs leading-snug text-[color:var(--color-tinta-tenue)]">
              A escola vê seu nome e o horário da confirmação. Se quiser conversar, ligue para a
              coordenação.
            </p>
          </>
        ))}
    </div>
  );
}

/**
 * As três pastilhas do topo: o que já aconteceu, em número.
 *
 * Contagem e não frase — a frase é do resumo, logo acima, e repeti-la aqui
 * seria dizer a mesma coisa duas vezes com menos espaço.
 */
function contagens(timeline: ItemDoDia[]): { rotulo: string; quantas: number }[] {
  const rotulos: Record<string, string> = {
    ALIMENTACAO: 'Refeições',
    HIGIENE: 'Fralda',
    HIDRATACAO: 'Água',
    ATIVIDADE: 'Atividades',
  };

  return Object.entries(rotulos)
    .map(([tipo, rotulo]) => ({
      rotulo,
      quantas: timeline.filter((i) => i.tipo === tipo).length,
    }))
    .filter((c) => c.quantas > 0)
    .slice(0, 3);
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * "quarta, 3 de setembro" — sem o "-feira".
 *
 * A linha divide espaço com o nome da turma e o sino: com "quarta-feira" ela
 * estourava e virava reticências justamente no dado que diz de quem é o dia.
 */
function hojePorExtenso(): string {
  return new Date()
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace('-feira', '');
}
