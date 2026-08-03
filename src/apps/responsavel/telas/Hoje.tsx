import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Baby,
  Download,
  Droplets,
  LogIn,
  LogOut,
  Moon,
  Smile,
  Sparkles,
  Utensils,
  NotebookPen,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '@/shared/api/cliente';
import { useSessao } from '@/shared/auth/sessao';
import { useInstalacao } from '@/shared/pwa/instalacao';
import { Cartao, Carregando, Etiqueta, Vazio } from '@/shared/ui/componentes';

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

/**
 * A tela que a família abre. Tudo aqui é frase pronta, montada na API —
 * ninguém em casa quer decifrar "ALIMENTACAO: aceitacao=METADE".
 */
export function Hoje() {
  const usuario = useSessao((estado) => estado.usuario);
  const encerrar = useSessao((estado) => estado.encerrar);
  const { instalado } = useInstalacao();

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
      <header className="area-segura-topo bg-[--cor-acao-suave] px-5 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[--cor-acao]">
              {usuario?.escolaNome}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{dia?.crianca.nome}</h1>
            <p className="text-sm text-[color:var(--color-tinta-suave)]">
              {dia?.crianca.turmaNome} · {dia?.crianca.idade}
            </p>
          </div>
          {!instalado && (
            <Link
              to="/instalar"
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[--cor-acao] shadow-sm"
            >
              <Download size={14} /> Instalar
            </Link>
          )}
        </div>

        {dia && (
          <p className="mt-4 text-lg font-semibold leading-snug text-[--cor-acao-forte]">
            {dia.resumo}
          </p>
        )}

        {dia && dia.crianca.alergias.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[color:var(--color-alerta)]">
            <AlertTriangle size={12} /> Alergia registrada: {dia.crianca.alergias.join(', ')}
          </p>
        )}
      </header>

      <main className="space-y-3 px-4 py-5">
        {dia?.timeline.length === 0 && (
          <Vazio
            titulo="Ainda sem registros hoje"
            descricao="Assim que a escola registrar algo, aparece aqui."
          />
        )}

        {dia?.timeline.map((item) => (
          <Cartao key={item.id} className="flex gap-3 p-3.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                item.categoria === 'OCORRENCIA'
                  ? 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
                  : 'bg-[--cor-acao-suave] text-[--cor-acao]'
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
                <p className="font-semibold leading-snug">{item.titulo}</p>
                <time className="shrink-0 text-xs text-[color:var(--color-tinta-suave)]">
                  {new Date(item.ocorridoEm).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              {item.detalhe && (
                <p className="mt-0.5 text-sm text-[color:var(--color-tinta-suave)]">
                  {item.detalhe}
                </p>
              )}
              {/* `dados` é Json na API: o formato varia por tipo de item, então a
                  leitura aqui é defensiva em vez de tipada. */}
              {item.categoria === 'OCORRENCIA' && conduta(item.dados) && (
                <p className="mt-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-sm">
                  <b className="font-semibold">O que fizemos: </b>
                  {conduta(item.dados)}
                </p>
              )}
            </div>
          </Cartao>
        ))}

        {dia && !dia.saidaEm && dia.presente && (
          <p className="pt-2 text-center text-xs text-[color:var(--color-tinta-suave)]">
            <Etiqueta tom="ok">na escola agora</Etiqueta>
          </p>
        )}

        <button
          onClick={encerrar}
          className="w-full pt-6 text-center text-sm text-[color:var(--color-tinta-suave)] underline"
        >
          Sair da demonstração
        </button>
      </main>
    </div>
  );
}
