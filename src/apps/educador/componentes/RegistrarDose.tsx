import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import type { components } from '@/shared/api/schema';
import { useSessao } from '@/shared/auth/sessao';
import { Area, Aviso, Botao, Campo, Cartao, RotuloCampo, Selecao } from '@/shared/ui/componentes';

type Medicacao = Pick<
  components['schemas']['MedicacaoDoDiaDto'],
  'id' | 'medicamento' | 'dosagem' | 'via'
> &
  Partial<Pick<components['schemas']['MedicacaoDoDiaDto'], 'horarios' | 'fim' | 'administradoHoje'>>;

/**
 * Registro da dose administrada.
 *
 * A tela é montada como um protocolo, não como um formulário: primeiro a
 * conferência no frasco, depois o que está autorizado, depois quem dá e quem
 * confere. A **dupla checagem** é o motivo de a tela existir — duas pessoas
 * conferem remédio, dose e criança antes de dar.
 *
 * A segunda checagem fica opcional porque numa turma com um educador só não há
 * segunda pessoa, e exigir o impossível ensinaria a equipe a marcar qualquer
 * nome para liberar o botão.
 */
export function RegistrarDose({
  medicacao,
  criancaId,
  aoFechar,
}: {
  medicacao: Medicacao;
  criancaId: string;
  aoFechar: () => void;
}) {
  const clienteQuery = useQueryClient();
  const usuario = useSessao((estado) => estado.usuario);

  const [dose, setDose] = useState(medicacao.dosagem);
  const [testemunhaId, setTestemunhaId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const equipe = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/equipe');
      if (error) throw error;
      return data;
    },
  });

  const registrar = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/v1/medicamentos/administracoes', {
        body: {
          // Gerado no cliente: dois toques no botão, ou um reenvio depois de a
          // rede oscilar, não podem virar duas doses no registro de uma criança.
          clientId: crypto.randomUUID(),
          autorizacaoId: medicacao.id,
          dose: dose.trim(),
          testemunhaId: testemunhaId || undefined,
          observacao: observacao.trim() || undefined,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['dia', criancaId] });
      void clienteQuery.invalidateQueries({ queryKey: ['crianca', criancaId] });
      aoFechar();
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  const outros = (equipe.data ?? []).filter((m) => m.id !== usuario?.id && m.ativo);

  return (
    <Cartao className="overflow-hidden border-[color:var(--color-alerta)]">
      <div className="flex items-start gap-2.5 p-(--padding-cartao)">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">Dose · {medicacao.medicamento}</p>
          <p className="numerico text-xs text-[color:var(--color-tinta-tenue)]">
            {descreverHorarios(medicacao.horarios)}
          </p>
        </div>
        <button
          onClick={aoFechar}
          aria-label="Cancelar"
          className="-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-(--raio-sm) text-[color:var(--color-tinta-tenue)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* O primeiro passo do protocolo não é digitar nada: é olhar o frasco. */}
      <div className="border-y border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)] px-(--padding-cartao) py-2.5">
        <div className="flex gap-2.5">
          <span
            aria-hidden
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) bg-[color:var(--color-alerta)] text-xs font-bold text-white"
          >
            !
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-alerta)]">
              Confira no frasco antes de dar
            </p>
            <p className="mt-0.5 text-sm leading-snug text-[color:var(--color-tinta-suave)]">
              Nome do remédio, concentração e nome da criança. Se algo não bater, não dê e chame a
              coordenação.
            </p>
          </div>
        </div>

        <dl className="mt-2.5 space-y-1 text-sm">
          <Linha rotulo="Autorizado" valor={`${medicacao.dosagem} · via ${medicacao.via}`} />
          {medicacao.fim && <Linha rotulo="Validade" valor={`até ${dataCurta(medicacao.fim)}`} />}
          {medicacao.administradoHoje && medicacao.administradoHoje.length > 0 && (
            <Linha
              rotulo="Já dado hoje"
              valor={medicacao.administradoHoje
                .map((iso) =>
                  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                )
                .join(', ')}
            />
          )}
        </dl>
      </div>

      <form
        className="space-y-4 p-(--padding-cartao)"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          registrar.mutate();
        }}
      >
        <div className="space-y-1.5">
          <RotuloCampo>Checagem 1 · quem dá</RotuloCampo>
          <div className="flex items-center gap-2.5 rounded-(--raio) border border-[color:var(--color-ok)] bg-[color:var(--color-ok-suave)] p-(--padding-cartao)">
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-(--raio-sm) bg-[color:var(--color-ok)] text-xs text-white"
            >
              ✓
            </span>
            <p className="text-sm font-semibold">{usuario?.nome ?? 'Você'}</p>
          </div>
        </div>

        <Campo
          rotulo="Dose dada"
          apoio={`Autorizado: ${medicacao.dosagem}, via ${medicacao.via}.`}
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          required
        />

        <Selecao
          rotulo="Checagem 2 · quem confere"
          apoio="A segunda pessoa confere remédio, dose e criança. A família recebe o registro com os dois nomes e o horário real."
          value={testemunhaId}
          onChange={(e) => setTestemunhaId(e.target.value)}
        >
          <option value="">Ninguém conferiu</option>
          {outros.map((membro) => (
            <option key={membro.id} value={membro.id}>
              {membro.nome}
            </option>
          ))}
        </Selecao>

        <Area
          rotulo="Observação"
          apoio="Só se houve algo fora do previsto."
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        {erro && <Aviso>{erro}</Aviso>}

        <div className="flex gap-2">
          <Botao type="button" variante="secundario" onClick={aoFechar} className="flex-1">
            Não dei
          </Botao>
          <Botao
            type="submit"
            className="flex-[2]"
            disabled={!dose.trim() || registrar.isPending}
          >
            {registrar.isPending ? 'Registrando…' : 'Confirmar dose'}
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[color:var(--color-tinta-suave)]">{rotulo}</dt>
      <dd className="numerico text-right font-semibold">{valor}</dd>
    </div>
  );
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** `horarios` é Json na API: pode ser uma lista de horas ou "se necessário". */
function descreverHorarios(horarios: unknown): string {
  if (Array.isArray(horarios)) return `previstas ${horarios.map(String).join(', ')}`;
  if (horarios && typeof horarios === 'object' && 'seNecessario' in horarios) {
    return 'se necessário';
  }
  return 'sem horário fixo';
}
