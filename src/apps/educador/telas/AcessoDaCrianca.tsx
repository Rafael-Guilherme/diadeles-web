import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
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

const VINCULOS: Record<string, string> = {
  MAE: 'Mãe',
  PAI: 'Pai',
  AVO: 'Avó ou avô',
  TIO: 'Tio ou tia',
  PADRASTO_MADRASTA: 'Padrasto ou madrasta',
  RESPONSAVEL_LEGAL: 'Responsável legal',
  OUTRO: 'Responsável',
};

interface NovoAutorizado {
  nome: string;
  documento: string;
  parentesco: string;
  validoAte: string;
}

const AUTORIZADO_VAZIO: NovoAutorizado = { nome: '', documento: '', parentesco: '', validoAte: '' };

/**
 * Quem vê e quem busca esta criança.
 *
 * É a tela de maior consequência do produto. As leituras já respeitavam o
 * bloqueio; o que faltava era poder acioná-lo — até aqui, uma medida protetiva
 * só entrava no sistema por dentro do banco. Bloquear exige motivo porque é o
 * que sustenta a decisão quando o outro responsável perguntar.
 */
export function AcessoDaCrianca() {
  const { criancaId = '' } = useParams();
  const cliente = useQueryClient();
  const [bloqueando, setBloqueando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [novo, setNovo] = useState<NovoAutorizado | null>(null);

  const ficha = useQuery({
    queryKey: ['ficha', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{id}', {
        params: { path: { id: criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const vinculos = useQuery({
    queryKey: ['vinculos', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{criancaId}/vinculos', {
        params: { path: { criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const autorizados = useQuery({
    queryKey: ['autorizados', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{criancaId}/autorizados', {
        params: { path: { criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const recarregarVinculos = () => cliente.invalidateQueries({ queryKey: ['vinculos', criancaId] });
  const recarregarAutorizados = () =>
    cliente.invalidateQueries({ queryKey: ['autorizados', criancaId] });

  const permitir = useMutation({
    mutationFn: async ({
      id,
      campo,
      valor,
    }: {
      id: string;
      campo: 'podeVisualizar' | 'podeRetirar' | 'podeAutorizar';
      valor: boolean;
    }) => {
      const { error } = await api.PATCH('/v1/vinculos/{id}', {
        params: { path: { id } },
        body: { [campo]: valor },
      });
      if (error) throw error;
    },
    onSuccess: recarregarVinculos,
  });

  const bloquear = useMutation({
    mutationFn: async ({
      id,
      bloqueado,
      motivo,
    }: {
      id: string;
      bloqueado: boolean;
      motivo?: string;
    }) => {
      const { error } = await api.POST('/v1/vinculos/{id}/bloqueio', {
        params: { path: { id } },
        body: { bloqueado, ...(motivo ? { motivo } : {}) },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setBloqueando(null);
      setMotivo('');
      await recarregarVinculos();
    },
  });

  const criarAutorizado = useMutation({
    mutationFn: async (dados: NovoAutorizado) => {
      const { error } = await api.POST('/v1/criancas/{criancaId}/autorizados', {
        params: { path: { criancaId } },
        body: {
          nome: dados.nome.trim(),
          documento: dados.documento.trim(),
          ...(dados.parentesco.trim() ? { parentesco: dados.parentesco.trim() } : {}),
          ...(dados.validoAte ? { validoAte: dados.validoAte } : {}),
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNovo(null);
      await recarregarAutorizados();
    },
  });

  const revogarAutorizado = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await api.PATCH('/v1/autorizados/{id}', {
        params: { path: { id } },
        body: { ativo },
      });
      if (error) throw error;
    },
    onSuccess: recarregarAutorizados,
  });

  if (vinculos.isLoading || !vinculos.data) {
    return (
      <>
        <Cabecalho titulo="Quem tem acesso" voltarPara="/gestao/criancas" />
        <Carregando texto="Buscando os vínculos…" />
      </>
    );
  }

  const erro =
    permitir.error ?? bloquear.error ?? criarAutorizado.error ?? revogarAutorizado.error;

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Quem tem acesso"
        subtitulo={ficha.data?.nome}
        voltarPara="/gestao/criancas"
      />

      <main className="space-y-5 px-4 py-4">
        {erro && <Aviso>{mensagemDeErro(erro)}</Aviso>}

        <section className="space-y-2">
          <RotuloSecao>Responsáveis</RotuloSecao>

          {vinculos.data.length === 0 && (
            <Vazio
              titulo="Nenhum responsável vinculado"
              descricao="Envie um convite para a família ter acesso ao app."
            />
          )}

          {vinculos.data.map((v) => (
            <Cartao key={v.id} interno className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{v.nome}</p>
                  <p className="text-xs text-[color:var(--color-tinta-suave)]">
                    {VINCULOS[v.tipo] ?? v.tipo}
                  </p>
                </div>
                {v.bloqueado && (
                  <Etiqueta tom="alerta">
                    <ShieldAlert size={11} /> bloqueado
                  </Etiqueta>
                )}
              </div>

              {v.bloqueado ? (
                <>
                  {v.motivoBloqueio && (
                    <p className="rounded-(--raio) bg-[color:var(--color-papel)] p-2 text-xs leading-relaxed">
                      {v.motivoBloqueio}
                    </p>
                  )}
                  <Botao
                    variante="secundario"
                    bloco
                    disabled={bloquear.isPending}
                    onClick={() => bloquear.mutate({ id: v.id, bloqueado: false })}
                  >
                    <ShieldCheck size={15} /> Remover bloqueio
                  </Botao>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Permissao
                      rotulo="Acompanha o dia"
                      ativo={v.podeVisualizar}
                      disabled={permitir.isPending}
                      onMudar={(valor) =>
                        permitir.mutate({ id: v.id, campo: 'podeVisualizar', valor })
                      }
                    />
                    <Permissao
                      rotulo="Pode buscar a criança"
                      ativo={v.podeRetirar}
                      disabled={permitir.isPending}
                      onMudar={(valor) => permitir.mutate({ id: v.id, campo: 'podeRetirar', valor })}
                    />
                    <Permissao
                      rotulo="Autoriza medicação"
                      ativo={v.podeAutorizar}
                      disabled={permitir.isPending}
                      onMudar={(valor) =>
                        permitir.mutate({ id: v.id, campo: 'podeAutorizar', valor })
                      }
                    />
                  </div>

                  {bloqueando === v.id ? (
                    <div className="space-y-2 border-t border-[color:var(--color-borda)] pt-2.5">
                      <Campo
                        rotulo="Motivo do bloqueio"
                        value={motivo}
                        placeholder="Medida protetiva 123/2026"
                        apoio="Fica registrado no vínculo e na trilha de auditoria, com quem aplicou."
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Botao
                          variante="perigo"
                          bloco
                          disabled={bloquear.isPending || motivo.trim().length < 3}
                          onClick={() =>
                            bloquear.mutate({ id: v.id, bloqueado: true, motivo: motivo.trim() })
                          }
                        >
                          Bloquear acesso
                        </Botao>
                        <Botao
                          variante="secundario"
                          onClick={() => {
                            setBloqueando(null);
                            setMotivo('');
                          }}
                        >
                          Cancelar
                        </Botao>
                      </div>
                    </div>
                  ) : (
                    <Botao variante="fantasma" bloco onClick={() => setBloqueando(v.id)}>
                      Bloquear por decisão judicial
                    </Botao>
                  )}
                </>
              )}
            </Cartao>
          ))}
        </section>

        <section className="space-y-2">
          <RotuloSecao>Autorizados a buscar</RotuloSecao>
          <p className="px-1 text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
            Quem pode retirar a criança sem ser usuário do app — avó, motorista, van. É esta lista
            que a portaria confere na saída.
          </p>

          {novo ? (
            <Cartao interno className="space-y-3">
              <Campo
                rotulo="Nome"
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              />
              <Campo
                rotulo="Documento"
                value={novo.documento}
                placeholder="123.456.789-00"
                apoio="Conferido na portaria no momento da saída."
                onChange={(e) => setNovo({ ...novo, documento: e.target.value })}
              />
              <Campo
                rotulo="Parentesco"
                value={novo.parentesco}
                placeholder="Avó"
                onChange={(e) => setNovo({ ...novo, parentesco: e.target.value })}
              />
              <Campo
                rotulo="Válido até"
                type="date"
                value={novo.validoAte}
                apoio="Opcional. Vencida, a autorização deixa de valer sozinha."
                onChange={(e) => setNovo({ ...novo, validoAte: e.target.value })}
              />
              <div className="flex gap-2">
                <Botao
                  bloco
                  disabled={
                    criarAutorizado.isPending ||
                    novo.nome.trim().length < 2 ||
                    novo.documento.trim().length < 3
                  }
                  onClick={() => criarAutorizado.mutate(novo)}
                >
                  Salvar
                </Botao>
                <Botao variante="secundario" onClick={() => setNovo(null)}>
                  Cancelar
                </Botao>
              </div>
            </Cartao>
          ) : (
            <Botao variante="secundario" bloco onClick={() => setNovo(AUTORIZADO_VAZIO)}>
              <Plus size={16} /> Adicionar autorizado
            </Botao>
          )}

          {(autorizados.data ?? []).map((a) => (
            <Cartao key={a.id} interno className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.nome}</p>
                  <p className="numerico text-xs text-[color:var(--color-tinta-suave)]">
                    {a.documento}
                    {a.parentesco ? ` · ${a.parentesco}` : ''}
                  </p>
                  {a.validoAte && (
                    <p className="numerico text-xs text-[color:var(--color-tinta-tenue)]">
                      até {formatar(a.validoAte)}
                    </p>
                  )}
                </div>
                {a.ativo ? <Etiqueta tom="ok">vale hoje</Etiqueta> : <Etiqueta>não vale</Etiqueta>}
              </div>

              <Botao
                variante="fantasma"
                bloco
                disabled={revogarAutorizado.isPending}
                onClick={() => revogarAutorizado.mutate({ id: a.id, ativo: !a.ativo })}
              >
                {a.ativo ? 'Revogar' : 'Reativar'}
              </Botao>
            </Cartao>
          ))}
        </section>
      </main>
    </div>
  );
}

function Permissao({
  rotulo,
  ativo,
  disabled,
  onMudar,
}: {
  rotulo: string;
  ativo: boolean;
  disabled?: boolean;
  onMudar: (valor: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      {rotulo}
      <input
        type="checkbox"
        className="h-5 w-5 shrink-0"
        checked={ativo}
        disabled={disabled}
        onChange={(e) => onMudar(e.target.checked)}
      />
    </label>
  );
}

function formatar(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
