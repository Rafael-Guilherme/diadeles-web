import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleSlash, Smartphone, UserRound } from 'lucide-react';
import { api } from '@/shared/api/cliente';
import { Cartao, Carregando, Etiqueta, RotuloSecao, Vazio } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const PERIODOS = [7, 14, 30] as const;

/**
 * Adesão: quem registra e quem abre.
 *
 * As duas formas de o produto morrer em silêncio, com a assinatura em dia, são
 * o educador que parou de registrar e a família que parou de abrir. Nenhuma
 * das duas aparece no painel do dia — a escola só descobre na renovação, e aí
 * já é tarde (docs/plano-produto.md §11).
 *
 * A tela é deliberadamente comparativa: turmas lado a lado, com a mesma régua.
 * Um número isolado ("27 registros") não diz nada; ao lado de uma turma que
 * fez 5 no mesmo período, diz tudo.
 */
export function Adesao() {
  const [dias, setDias] = useState<number>(7);

  const { data, isLoading } = useQuery({
    queryKey: ['adesao', dias],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/escola/adesao', {
        params: { query: { dias } },
      });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Adesão" voltarPara="/gestao" />
        <Carregando texto="Levantando o período…" />
      </>
    );
  }

  const nuncaEntraram = data.familiasParadas.filter((f) => !f.ultimoAcessoEm);
  const pararam = data.familiasParadas.filter((f) => f.ultimoAcessoEm);

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Adesão"
        subtitulo={`De ${formatarData(data.desde)} a ${formatarData(data.data)}`}
        voltarPara="/gestao"
      />

      <main className="space-y-5 px-4 py-4">
        <div className="flex gap-2">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo}
              onClick={() => setDias(periodo)}
              aria-pressed={dias === periodo}
              className={`min-h-11 flex-1 rounded-(--raio) border text-sm font-semibold transition ${
                dias === periodo
                  ? 'border-(color:--cor-acao) bg-(color:--cor-acao-suave) text-(color:--cor-acao)'
                  : 'border-[color:var(--color-borda)] bg-white'
              }`}
            >
              {periodo} dias
            </button>
          ))}
        </div>

        <section className="space-y-2">
          <RotuloSecao>Quem registra</RotuloSecao>

          {data.turmas.length === 0 && (
            <Vazio titulo="Nenhuma turma ainda" descricao="Crie as turmas para medir a adesão." />
          )}

          <ul className="space-y-(--gap-lista)">
            {data.turmas.map((turma) => (
              <li key={turma.turmaId}>
                <Cartao interno className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{turma.nome}</p>
                    <span className="numerico shrink-0 text-xs text-[color:var(--color-tinta-suave)]">
                      {turma.criancasAtivas}{' '}
                      {turma.criancasAtivas === 1 ? 'criança' : 'crianças'}
                    </span>
                  </div>

                  {/* Hoje primeiro, período depois: a coordenação abre isto de
                      manhã querendo saber o que ainda dá para corrigir. */}
                  <div className="grid grid-cols-3 gap-2">
                    <Numero
                      valor={`${turma.chamadaHoje}/${turma.criancasAtivas}`}
                      rotulo="chamada hoje"
                      atencao={turma.chamadaHoje < turma.criancasAtivas}
                    />
                    <Numero
                      valor={`${turma.criancasComRegistroHoje}/${turma.criancasAtivas}`}
                      rotulo="com rotina hoje"
                      atencao={turma.criancasComRegistroHoje < turma.criancasAtivas}
                    />
                    <Numero
                      valor={`${turma.diasComRegistro}/${data.dias}`}
                      rotulo="dias ativos"
                      atencao={turma.diasComRegistro === 0}
                    />
                  </div>

                  <ul className="space-y-1.5">
                    {turma.educadores.map((educador) => (
                      <li
                        key={educador.usuarioId}
                        className="flex items-center gap-2 text-sm"
                      >
                        <UserRound
                          size={14}
                          className="shrink-0 text-[color:var(--color-tinta-tenue)]"
                        />
                        <span className="min-w-0 flex-1 truncate">{educador.nome}</span>
                        {educador.registros === 0 ? (
                          <Etiqueta tom="alerta">nada no período</Etiqueta>
                        ) : (
                          <span className="numerico shrink-0 text-xs text-[color:var(--color-tinta-suave)]">
                            {educador.registros}{' '}
                            {educador.registros === 1 ? 'registro' : 'registros'}
                          </span>
                        )}
                      </li>
                    ))}
                    {turma.educadores.length === 0 && (
                      <li className="text-sm text-[color:var(--color-alerta)]">
                        Nenhum educador atribuído — ninguém registra esta turma.
                      </li>
                    )}
                  </ul>

                  <p className="flex items-center gap-1.5 border-t border-[color:var(--color-borda)] pt-2.5 text-xs text-[color:var(--color-tinta-suave)]">
                    <Smartphone size={13} className="shrink-0" />
                    <span className="numerico">
                      {turma.familiasAtivas} de {turma.familiasComAcesso}
                    </span>{' '}
                    {turma.familiasComAcesso === 1 ? 'família abriu' : 'famílias abriram'} o app no
                    período
                  </p>
                </Cartao>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <RotuloSecao>Quem não abre</RotuloSecao>

          {data.familiasParadas.length === 0 ? (
            <Cartao interno>
              <p className="text-sm text-[color:var(--color-tinta-suave)]">
                Todas as famílias abriram o app no período.
              </p>
            </Cartao>
          ) : (
            <>
              {/* A separação não é estética: quem nunca entrou precisa de
                  convite, quem parou precisa de telefonema. São duas ações
                  diferentes e a lista misturada esconde isso. */}
              {nuncaEntraram.length > 0 && (
                <Cartao interno className="space-y-2.5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <CircleSlash size={14} className="text-[color:var(--color-alerta)]" />
                    Nunca entraram ({nuncaEntraram.length})
                  </p>
                  {nuncaEntraram.map((familia) => (
                    <Familia
                      key={`${familia.criancaId}-${familia.responsavelId}`}
                      familia={familia}
                      nota="convite pendente"
                    />
                  ))}
                  <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
                    Convite se emite em Acesso das famílias.
                  </p>
                </Cartao>
              )}

              {pararam.length > 0 && (
                <Cartao interno className="space-y-2.5">
                  <p className="text-sm font-semibold">Pararam de abrir ({pararam.length})</p>
                  {pararam.map((familia) => (
                    <Familia
                      key={`${familia.criancaId}-${familia.responsavelId}`}
                      familia={familia}
                      nota={`desde ${formatarDataHora(familia.ultimoAcessoEm!)}`}
                    />
                  ))}
                </Cartao>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Numero({
  valor,
  rotulo,
  atencao = false,
}: {
  valor: string;
  rotulo: string;
  atencao?: boolean;
}) {
  return (
    <div className="rounded-(--raio) bg-[color:var(--color-papel)] p-2 text-center">
      <p
        className={`numerico text-base font-semibold leading-none ${
          atencao ? 'text-[color:var(--color-alerta)]' : ''
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-2xs leading-tight text-[color:var(--color-tinta-tenue)]">{rotulo}</p>
    </div>
  );
}

function Familia({
  familia,
  nota,
}: {
  familia: { crianca: string; turma: string; responsavel: string };
  nota: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{familia.responsavel}</p>
        <p className="truncate text-xs text-[color:var(--color-tinta-suave)]">
          {familia.crianca} · {familia.turma}
        </p>
      </div>
      <Etiqueta>{nota}</Etiqueta>
    </div>
  );
}

function formatarData(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
