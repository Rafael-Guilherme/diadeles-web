import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Archive, Plus, Search } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Botao, Cartao, Carregando, Vazio } from '@/shared/ui/componentes';
import { LayoutGestao, Tabela, Td, Th, Tr } from '../componentes/LayoutGestao';

/**
 * Cadastro de crianças — a porta de entrada de uma escola real no produto.
 *
 * A busca fica no topo e sempre visível: com 80 crianças, rolar a lista para
 * achar a Sofia é mais lento do que digitar "sof". O filtro por turma vem
 * depois, porque a secretaria trabalha por criança e a coordenação, por turma.
 */
export function Criancas() {
  const [busca, setBusca] = useState('');
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [verArquivadas, setVerArquivadas] = useState(false);

  const turmas = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/turmas');
      if (error) throw error;
      return data;
    },
  });

  const criancas = useQuery({
    queryKey: ['criancas', turmaId, verArquivadas],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas', {
        params: {
          query: {
            ...(turmaId ? { turmaId } : {}),
            ...(verArquivadas ? { arquivadas: 'true' } : {}),
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    const lista = criancas.data ?? [];
    if (!termo) return lista;

    return lista.filter(
      (c) => normalizar(c.nome).includes(termo) || normalizar(c.nomeSocial ?? '').includes(termo),
    );
  }, [busca, criancas.data]);

  const semTurma = filtradas.filter((c) => !c.matricula && !c.arquivada).length;

  return (
    <LayoutGestao
      titulo="Crianças"
      descricao={`${filtradas.length} ${filtradas.length === 1 ? 'criança' : 'crianças'} na lista`}
      acoes={
        <Link to="/gestao/criancas/nova">
          <Botao tamanho="compacto" aria-label="Cadastrar criança">
            <Plus size={15} /> Nova matrícula
          </Botao>
        </Link>
      }
    >
      <div className="space-y-4">
          <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-tinta-tenue)]"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome"
                aria-label="Buscar criança por nome"
                className="min-h-11 w-full rounded-(--raio) border border-[color:var(--color-borda-forte)] bg-white pl-9 pr-3 text-[16px] outline-none transition placeholder:text-[color:var(--color-tinta-tenue)] focus:border-(color:--cor-acao) focus:ring-2 focus:ring-(color:--cor-acao-suave)"
            />
          </div>

          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1">
            <Filtro ativo={turmaId === null} onClick={() => setTurmaId(null)}>
              Todas
            </Filtro>
            {turmas.data?.map((turma) => (
              <Filtro key={turma.id} ativo={turmaId === turma.id} onClick={() => setTurmaId(turma.id)}>
                {turma.nome}
              </Filtro>
            ))}
          </div>

          {semTurma > 0 && (
            <Cartao interno className="flex items-start gap-2.5 border-[color:var(--color-alerta)]/30">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[color:var(--color-alerta)]" />
              <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                {semTurma === 1 ? 'Uma criança está' : `${semTurma} crianças estão`} sem turma. Sem
                matrícula ativa {semTurma === 1 ? 'ela não aparece' : 'elas não aparecem'} na grade de
                nenhum educador.
              </p>
            </Cartao>
          )}

          {criancas.isLoading ? (
            <Carregando />
          ) : filtradas.length === 0 ? (
            <Vazio
              titulo={busca ? 'Ninguém com esse nome' : 'Nenhuma criança cadastrada'}
              descricao={
                busca
                  ? 'Confira a grafia ou limpe a busca.'
                  : 'Cadastre a primeira criança para a escola começar a registrar o dia.'
              }
            />
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <Th>Criança</Th>
                  <Th>Idade</Th>
                  <Th>Restrição</Th>
                  <Th>Turma</Th>
                  <Th className="text-right">Responsáveis</Th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((crianca) => (
                  <Tr key={crianca.id} atencao={!crianca.matricula && !crianca.arquivada}>
                    <Td>
                      <Link
                        to={`/gestao/criancas/${crianca.id}`}
                        className="flex items-center gap-1.5 font-semibold hover:underline"
                      >
                        {crianca.nomeSocial ?? crianca.nome}
                        {crianca.arquivada && (
                          <Archive size={13} className="shrink-0 text-[color:var(--color-tinta-tenue)]" />
                        )}
                      </Link>
                    </Td>
                    <Td className="numerico text-[color:var(--color-tinta-suave)]">{crianca.idade}</Td>
                    {/* A restrição é a palavra do alimento, não um ícone: numa
                        lista de oitenta crianças é ela que a cozinha lê. */}
                    <Td
                      className={
                        crianca.alergias.length > 0
                          ? 'font-semibold text-[color:var(--color-alerta)]'
                          : 'text-[color:var(--color-tinta-tenue)]'
                      }
                    >
                      {crianca.alergias.length > 0
                        ? crianca.alergias.join(', ').toLowerCase()
                        : 'nenhuma'}
                    </Td>
                    <Td
                      className={
                        crianca.matricula
                          ? 'text-[color:var(--color-tinta-suave)]'
                          : 'font-semibold text-[color:var(--color-sol-700)]'
                      }
                    >
                      {crianca.matricula ? crianca.matricula.turmaNome : 'sem turma'}
                    </Td>
                    <Td
                      className={`numerico text-right ${
                        crianca.responsaveis === 0
                          ? 'font-semibold text-[color:var(--color-sol-700)]'
                          : 'text-[color:var(--color-tinta-suave)]'
                      }`}
                    >
                      {crianca.responsaveis === 0 ? 'nenhum' : crianca.responsaveis}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
          )}

          <button
            onClick={() => setVerArquivadas((v) => !v)}
            className="w-full pt-2 text-center text-xs text-[color:var(--color-tinta-suave)] underline"
          >
            {verArquivadas ? 'Ocultar arquivadas' : 'Mostrar também as arquivadas'}
          </button>
      </div>
    </LayoutGestao>
  );
}

function Filtro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
        ativo
          ? 'bg-(color:--cor-acao) text-white'
          : 'bg-white text-[color:var(--color-tinta-suave)] ring-1 ring-[color:var(--color-borda)]'
      }`}
    >
      {children}
    </button>
  );
}

/** Busca sem acento: quem digita "cecilia" espera achar a Cecília. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
