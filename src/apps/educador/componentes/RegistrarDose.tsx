import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pill, X } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { useSessao } from '@/shared/auth/sessao';
import { Area, Aviso, Botao, Campo, Cartao, Selecao } from '@/shared/ui/componentes';

interface Medicacao {
  id: string;
  medicamento: string;
  dosagem: string;
  via: string;
}

/**
 * Registro da dose administrada.
 *
 * A testemunha é a **dupla checagem**: duas pessoas conferem o remédio, a dose
 * e a criança antes de dar. É protocolo básico de medicação, e o campo existe
 * para que o registro reflita o que a escola já faz — não para criar
 * burocracia. Fica opcional porque numa turma com um educador só não há segunda
 * pessoa, e exigir o impossível ensinaria a equipe a mentir no formulário.
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
    <Cartao interno className="space-y-4 border-(color:--cor-acao)/40">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(color:--cor-acao-suave) text-(color:--cor-acao)">
            <Pill size={16} />
          </span>
          {medicacao.medicamento}
        </p>
        <button
          onClick={aoFechar}
          aria-label="Cancelar"
          className="-m-2 p-2 text-[color:var(--color-tinta-tenue)]"
        >
          <X size={18} />
        </button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          registrar.mutate();
        }}
      >
        <Campo
          rotulo="Dose dada"
          apoio={`Autorizado: ${medicacao.dosagem}, via ${medicacao.via}.`}
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          required
        />

        <Selecao
          rotulo="Quem conferiu junto"
          apoio="Dupla checagem: a segunda pessoa confere remédio, dose e criança."
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

        <Botao type="submit" bloco disabled={!dose.trim() || registrar.isPending}>
          {registrar.isPending ? (
            'Registrando…'
          ) : (
            <>
              <Check size={16} /> Registrar dose e avisar a família
            </>
          )}
        </Botao>
      </form>
    </Cartao>
  );
}
