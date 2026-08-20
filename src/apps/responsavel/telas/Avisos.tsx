import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bell, ScrollText, Sun } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Vazio } from '@/shared/ui/componentes';
import { ControleAvisos } from '../componentes/ConviteAvisos';

const ICONES: Record<string, typeof Bell> = {
  RESUMO_DIARIO: Sun,
  OCORRENCIA_GRAVE: AlertTriangle,
  RELATORIO: ScrollText,
};

/**
 * A caixa de avisos dentro do app.
 *
 * Ela existe porque nada pode depender só da entrega externa: push não chega em
 * aparelho desligado, e-mail cai em spam, e a família que não instalou o app
 * não tem nem um nem outro. O canal avisa; esta tela é a fonte de verdade
 * (docs/arquitetura.md §7).
 */
export function Avisos() {
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['avisos'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/notificacoes');
      if (error) throw error;
      return data;
    },
  });

  const marcarTodas = useMutation({
    mutationFn: async () => {
      await api.POST('/v1/notificacoes/lidas', {});
    },
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['avisos'] }),
  });

  // Abrir a tela é a leitura. Um botão "marcar como lido" só transferiria para
  // a mãe o trabalho de zerar um contador que já cumpriu o papel dele.
  const naoLidas = data?.naoLidas ?? 0;
  useEffect(() => {
    if (naoLidas > 0 && !marcarTodas.isPending) marcarTodas.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naoLidas]);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <header className="area-segura-topo flex items-center gap-2 py-4">
        <button
          onClick={() => navegar(-1)}
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-tinta-suave)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="display text-xl">Avisos</h1>
      </header>

      <div className="pb-4">
        <ControleAvisos />
      </div>

      {isLoading ? (
        <Carregando />
      ) : !data?.itens.length ? (
        <Vazio
          icone={<Bell size={22} />}
          titulo="Nenhum aviso ainda"
          descricao="Quando a escola fechar o turno, o resumo do dia aparece aqui."
        />
      ) : (
        <ul className="space-y-(--gap-lista)">
          {data.itens.map((aviso) => {
            const Icone = ICONES[aviso.tipo] ?? Bell;
            const grave = aviso.gravidade === 'GRAVE';

            /*
             * `link` era gravado em toda notificação e nunca usado: o aviso
             * dizia "o parecer está pronto" e a mãe ficava procurando onde.
             * Quando ele existe, o cartão inteiro leva ao lugar.
             */
            const conteudo = (
              <Cartao interno className="flex gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-(--raio) ${
                    grave
                      ? 'bg-[color:var(--color-alerta-suave)] text-[color:var(--color-alerta)]'
                      : 'bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                  }`}
                >
                  <Icone size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[15px] font-semibold leading-snug">{aviso.titulo}</p>
                    <time className="shrink-0 text-2xs text-[color:var(--color-tinta-tenue)]">
                      {formatarQuando(aviso.criadoEm)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                    {aviso.corpo}
                  </p>
                </div>
              </Cartao>
            );

            return aviso.link ? (
              <Link key={aviso.id} to={aviso.link} className="block">
                {conteudo}
              </Link>
            ) : (
              <li key={aviso.id} className="list-none">
                {conteudo}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Hoje mostra a hora; antes disso, a data. Ninguém precisa de "06/08 14:32" no aviso de agora. */
function formatarQuando(iso: string): string {
  const quando = new Date(iso);
  const hoje = new Date().toDateString() === quando.toDateString();

  return hoje
    ? quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : quando.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
