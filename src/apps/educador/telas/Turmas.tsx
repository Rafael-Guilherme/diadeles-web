import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/shared/api/cliente';
import { ehDaGestao, useSessao } from '@/shared/auth/sessao';
import { sair } from '@/shared/auth/sair';
import { Cartao, Carregando, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const GRUPOS: Record<string, string> = {
  BEBES: 'Bebês',
  CRIANCAS_BEM_PEQUENAS: 'Crianças bem pequenas',
  CRIANCAS_PEQUENAS: 'Crianças pequenas',
};

export function Turmas() {
  const usuario = useSessao((estado) => estado.usuario);
  const [saindo, setSaindo] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  const gestao = ehDaGestao(usuario?.papeis ?? []);

  return (
    <div className="min-h-full">
      <Cabecalho titulo={`Olá, ${usuario?.nome.split(' ')[0]}`} subtitulo={usuario?.escolaNome} />

      <main className="space-y-(--gap-lista) px-4 py-4">
        {/* Coordenação e gestão abrem o app para saber como está o dia inteiro,
            não para registrar uma turma. O caminho para o painel vem antes da
            lista por isso — para elas a lista é o detalhe. */}
        {gestao && (
          <Link to="/gestao" className="block">
            <Cartao
              interno
              className="flex items-center gap-3 border-(color:--cor-acao-borda) bg-(color:--cor-acao-suave) transition active:brightness-95"
            >
              <BarChart3 size={19} className="shrink-0 text-(color:--cor-acao)" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-(color:--cor-acao-forte)">A escola hoje</p>
                <p className="text-xs text-[color:var(--color-tinta-suave)]">
                  Painel, equipe e acesso das famílias
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-(color:--cor-acao)" />
            </Cartao>
          </Link>
        )}

        {isLoading && <Carregando texto="Buscando suas turmas…" />}

        {data?.length === 0 && (
          <Vazio
            icone={<Users size={22} />}
            titulo="Nenhuma turma por aqui"
            descricao="Peça à coordenação para vincular você a uma turma."
          />
        )}

        {data?.map((turma) => (
          <Link key={turma.id} to={`/turma/${turma.id}`} className="block">
            <Cartao interno className="flex items-center gap-3 transition active:bg-neutral-50">
              <span
                className="h-11 w-1.5 shrink-0 rounded-full"
                style={{ background: turma.cor ?? 'var(--cor-acao)' }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{turma.nome}</p>
                <p className="text-xs text-[color:var(--color-tinta-suave)]">
                  {GRUPOS[turma.grupoEtario] ?? turma.grupoEtario} · {turma.turno}
                </p>
                <p className="numerico mt-1 flex items-center gap-1 text-xs text-[color:var(--color-tinta-tenue)]">
                  <Users size={13} /> {turma.criancasAtivas} crianças
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-[color:var(--color-tinta-tenue)]" />
            </Cartao>
          </Link>
        ))}

        <button
          onClick={() => {
            setSaindo(true);
            void sair();
          }}
          disabled={saindo}
          className="min-h-11 w-full pt-4 text-center text-sm text-[color:var(--color-tinta-tenue)] underline underline-offset-2 disabled:opacity-50"
        >
          {saindo ? 'Saindo…' : 'Sair'}
        </button>
      </main>
    </div>
  );
}
