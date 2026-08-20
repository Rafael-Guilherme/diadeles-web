import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Area, Aviso, Botao, Campo, Cartao, ListaDeItens } from '@/shared/ui/componentes';

function hojeIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

function daquiADias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toLocaleDateString('en-CA');
}

/**
 * Autorização de medicamento pela família.
 *
 * A escola não preenche isto por ninguém: o registro de quem autorizou é a
 * única coisa que separa "dar remédio a uma criança" de um problema sério, e
 * uma autorização assinada pela própria escola não prova nada
 * (docs/plano-produto.md §4).
 */
export function AutorizarMedicamento({ criancaId }: { criancaId: string }) {
  const clienteQuery = useQueryClient();
  const [aberto, setAberto] = useState(false);

  const [medicamento, setMedicamento] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [via, setVia] = useState('oral');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [seNecessario, setSeNecessario] = useState(false);
  const [inicio, setInicio] = useState(hojeIso);
  const [fim, setFim] = useState(() => daquiADias(7));
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const autorizar = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/v1/medicamentos/autorizacoes', {
        body: {
          criancaId,
          medicamento: medicamento.trim(),
          dosagem: dosagem.trim(),
          via: via.trim(),
          horarios: seNecessario ? undefined : horarios,
          seNecessario,
          inicio,
          fim,
          observacoes: observacoes.trim() || undefined,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['ficha', criancaId] });
      setAberto(false);
      setMedicamento('');
      setDosagem('');
      setHorarios([]);
      setSeNecessario(false);
      setObservacoes('');
      setErro(null);
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (!aberto) {
    return (
      <Botao variante="secundario" bloco onClick={() => setAberto(true)}>
        <Plus size={16} /> Autorizar um medicamento
      </Botao>
    );
  }

  const podeEnviar =
    medicamento.trim().length >= 2 &&
    dosagem.trim().length >= 1 &&
    (seNecessario || horarios.length > 0) &&
    inicio <= fim;

  return (
    <Cartao interno className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">Autorizar um medicamento</p>
        <button
          onClick={() => setAberto(false)}
          aria-label="Fechar"
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
          autorizar.mutate();
        }}
      >
        <Campo
          rotulo="Medicamento"
          placeholder="Amoxicilina 250mg/5ml"
          apoio="Escreva como está na receita, com a concentração."
          value={medicamento}
          onChange={(e) => setMedicamento(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo="Dose"
            placeholder="5 ml"
            value={dosagem}
            onChange={(e) => setDosagem(e.target.value)}
            required
          />
          <Campo
            rotulo="Via"
            placeholder="oral"
            value={via}
            onChange={(e) => setVia(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={seNecessario}
              onChange={(e) => setSeNecessario(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-(color:--cor-acao)"
            />
            <span className="text-sm leading-snug">
              <span className="font-semibold">Só se necessário</span>
              <span className="block text-xs text-[color:var(--color-tinta-suave)]">
                A escola dá apenas se a criança apresentar o sintoma. Descreva quando, no campo de
                observações.
              </span>
            </span>
          </label>

          {!seNecessario && (
            <ListaDeItens
              rotulo="Horários"
              placeholder="10:00"
              apoio="Um horário por vez, no formato HH:MM."
              itens={horarios}
              onMudar={setHorarios}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo="De"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            required
          />
          <Campo
            rotulo="Até"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            required
          />
        </div>

        <Area
          rotulo="Observações"
          apoio="Ex.: só se a febre passar de 37,8°C; dar depois de comer."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        {erro && <Aviso>{erro}</Aviso>}

        {/* A receita em papel continua sendo exigida na entrada da escola: o
            anexo digital entra junto com o upload de arquivos (M4). */}
        <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
          Entregue a receita na secretaria. A escola só administra o que estiver autorizado aqui e
          dentro do prazo.
        </p>

        <Botao type="submit" bloco disabled={!podeEnviar || autorizar.isPending}>
          {autorizar.isPending ? 'Autorizando…' : 'Autorizar'}
        </Botao>
      </form>
    </Cartao>
  );
}
