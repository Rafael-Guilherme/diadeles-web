import { useQuery } from '@tanstack/react-query';
import { UserX } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Etiqueta, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const PAPEIS: Record<string, string> = {
  SUPER_ADMIN: 'Administração',
  REDE_ADMIN: 'Rede',
  GESTOR: 'Gestão',
  COORDENADOR: 'Coordenação',
  EDUCADOR: 'Educador',
  AUXILIAR: 'Auxiliar',
  RESPONSAVEL: 'Família',
};

export function Equipe() {
  const { data, isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/equipe');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Equipe" voltarPara="/gestao" />
        <Carregando texto="Buscando a equipe…" />
      </>
    );
  }

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Equipe"
        subtitulo={`${data.length} ${data.length === 1 ? 'pessoa' : 'pessoas'}`}
        voltarPara="/gestao"
      />

      <main className="space-y-(--gap-lista) px-4 py-4">
        {data.length === 0 && (
          <Vazio
            icone={<UserX size={22} />}
            titulo="Ninguém cadastrado ainda"
            descricao="Convide a equipe para que ela possa registrar a rotina das turmas."
          />
        )}

        {data.map((membro) => (
          <Cartao key={membro.id} interno className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{membro.nome}</p>
                {membro.email && (
                  <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">
                    {membro.email}
                  </p>
                )}
              </div>
              {!membro.ativo && <Etiqueta tom="alerta">inativo</Etiqueta>}
            </div>

            <div className="flex flex-wrap gap-1">
              {membro.papeis.map((papel) => (
                <Etiqueta key={papel} tom="marca">
                  {PAPEIS[papel] ?? papel}
                </Etiqueta>
              ))}
              {membro.turmas.map((turma) => (
                <Etiqueta key={turma}>{turma}</Etiqueta>
              ))}
            </div>

            {/* Quem nunca acessou não recebe nada do que a escola publica. É o
                que a coordenação precisa saber antes de cobrar o registro. */}
            <p className="text-xs text-[color:var(--color-tinta-tenue)]">
              {membro.ultimoAcesso
                ? `Último acesso ${formatarAcesso(membro.ultimoAcesso)}`
                : 'Nunca acessou o app'}
            </p>
          </Cartao>
        ))}
      </main>
    </div>
  );
}

function formatarAcesso(iso: string): string {
  const data = new Date(iso);
  const dias = Math.floor((Date.now() - data.getTime()) / 86_400_000);

  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  return data.toLocaleDateString('pt-BR');
}
