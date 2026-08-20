import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import {
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

/**
 * O ano letivo é a moldura de tudo: turma pertence a um ano, e matrícula
 * pertence a uma turma. Encerrar o ano é o gesto que impede a secretaria de
 * matricular em 2025 no meio de 2026 — por isso ele desativa, mas nunca apaga.
 */
export function AnosLetivos() {
  const cliente = useQueryClient();
  const [novoAno, setNovoAno] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['anos-letivos'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/anos-letivos');
      if (error) throw error;
      return data;
    },
  });

  const recarregar = () => cliente.invalidateQueries({ queryKey: ['anos-letivos'] });

  const abrir = useMutation({
    mutationFn: async (ano: number) => {
      const { error } = await api.POST('/v1/anos-letivos', { body: { ano } });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNovoAno('');
      await recarregar();
    },
  });

  const encerrar = useMutation({
    mutationFn: async ({ id, encerrado }: { id: string; encerrado: boolean }) => {
      const { error } = await api.PATCH('/v1/anos-letivos/{id}', {
        params: { path: { id } },
        body: { encerrado },
      });
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Ano letivo" voltarPara="/gestao" />
        <Carregando texto="Buscando os anos…" />
      </>
    );
  }

  const erro = abrir.error ?? encerrar.error;
  const sugestao = String(new Date().getFullYear() + 1);

  return (
    <div className="min-h-full pb-10">
      <Cabecalho titulo="Ano letivo" voltarPara="/gestao" />

      <main className="space-y-4 px-4 py-4">
        {erro && <Aviso>{mensagemDeErro(erro)}</Aviso>}

        <Cartao interno className="space-y-3">
          <RotuloSecao>Abrir um ano</RotuloSecao>
          <Campo
            rotulo="Ano"
            type="number"
            inputMode="numeric"
            value={novoAno}
            placeholder={sugestao}
            apoio="As datas de início e fim seguem o calendário letivo e podem ser ajustadas depois."
            onChange={(e) => setNovoAno(e.target.value)}
          />
          <Botao
            bloco
            disabled={abrir.isPending || novoAno.length !== 4}
            onClick={() => abrir.mutate(Number(novoAno))}
          >
            <Plus size={16} /> {abrir.isPending ? 'Abrindo…' : 'Abrir ano letivo'}
          </Botao>
        </Cartao>

        {data.length === 0 && (
          <Vazio
            icone={<CalendarDays size={22} />}
            titulo="Nenhum ano aberto"
            descricao="Abra o ano letivo para poder criar turmas e matricular crianças."
          />
        )}

        <div className="space-y-(--gap-lista)">
          {data.map((ano) => (
            <Cartao key={ano.id} interno className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="numerico font-semibold">{ano.ano}</p>
                  <p className="numerico text-xs text-[color:var(--color-tinta-suave)]">
                    {formatar(ano.inicio)} a {formatar(ano.fim)}
                  </p>
                </div>
                {ano.corrente ? (
                  <Etiqueta tom="ok">em curso</Etiqueta>
                ) : ano.encerrado ? (
                  <Etiqueta tom="alerta">encerrado</Etiqueta>
                ) : (
                  <Etiqueta>aberto</Etiqueta>
                )}
              </div>

              <p className="numerico text-xs text-[color:var(--color-tinta-suave)]">
                {ano.turmas} {ano.turmas === 1 ? 'turma' : 'turmas'}
              </p>

              <Botao
                variante="secundario"
                bloco
                disabled={encerrar.isPending}
                onClick={() => encerrar.mutate({ id: ano.id, encerrado: !ano.encerrado })}
              >
                {ano.encerrado ? 'Reabrir' : 'Encerrar'}
              </Botao>
            </Cartao>
          ))}
        </div>
      </main>
    </div>
  );
}

function formatar(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
