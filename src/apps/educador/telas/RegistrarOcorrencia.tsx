import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, Send } from 'lucide-react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Area, Aviso, Botao, Campo, Cartao, Carregando, RotuloSecao } from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

type Tipo =
  | 'FEBRE'
  | 'QUEDA'
  | 'MORDIDA'
  | 'MACHUCADO'
  | 'ALERGIA'
  | 'VOMITO'
  | 'CHORO_PROLONGADO'
  | 'COMPORTAMENTO'
  | 'OUTRO';

type Gravidade = 'LEVE' | 'MODERADA' | 'GRAVE';

const TIPOS: { valor: Tipo; rotulo: string }[] = [
  { valor: 'QUEDA', rotulo: 'Queda' },
  { valor: 'MORDIDA', rotulo: 'Mordida' },
  { valor: 'MACHUCADO', rotulo: 'Machucado' },
  { valor: 'FEBRE', rotulo: 'Febre' },
  { valor: 'VOMITO', rotulo: 'Vômito' },
  { valor: 'ALERGIA', rotulo: 'Reação alérgica' },
  { valor: 'CHORO_PROLONGADO', rotulo: 'Choro prolongado' },
  { valor: 'COMPORTAMENTO', rotulo: 'Comportamento' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

const GRAVIDADES: { valor: Gravidade; rotulo: string; apoio: string }[] = [
  { valor: 'LEVE', rotulo: 'Leve', apoio: 'A família fica sabendo, sem urgência' },
  { valor: 'MODERADA', rotulo: 'Moderada', apoio: 'Merece atenção em casa hoje' },
  { valor: 'GRAVE', rotulo: 'Grave', apoio: 'Avisa por notificação e e-mail, na hora' },
];

/**
 * Registro de ocorrência.
 *
 * A conduta é obrigatória, e não um campo opcional de observação: "mordida no
 * braço" assusta; "mordida no braço, lavamos, aplicamos gelo e voltou a
 * brincar" tranquiliza. É a diferença entre a família confiar na escola e ligar
 * exigindo explicação — e é literalmente o que o produto vende
 * (docs/plano-produto.md §1).
 */
export function RegistrarOcorrencia() {
  const { turmaId = '', criancaId = '' } = useParams();
  const navegar = useNavigate();
  const clienteQuery = useQueryClient();

  const [tipo, setTipo] = useState<Tipo>('QUEDA');
  const [gravidade, setGravidade] = useState<Gravidade>('LEVE');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [conduta, setConduta] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const crianca = useQuery({
    queryKey: ['crianca', criancaId],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/criancas/{id}', {
        params: { path: { id: criancaId } },
      });
      if (error) throw error;
      return data;
    },
  });

  const registrar = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/v1/ocorrencias', {
        body: {
          // O id vem do cliente: se a resposta se perder no caminho e o
          // educador tocar de novo, o servidor reconhece o reenvio em vez de
          // registrar a mesma queda duas vezes.
          clientId: crypto.randomUUID(),
          criancaId,
          tipo,
          gravidade,
          ocorridoEm: new Date().toISOString(),
          local: local.trim() || undefined,
          descricao: descricao.trim(),
          conduta: conduta.trim(),
          temperatura: tipo === 'FEBRE' && temperatura ? Number(temperatura) : undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ['dia', criancaId] });
      void clienteQuery.invalidateQueries({ queryKey: ['ocorrencias'] });
    },
    onError: (e) => setErro(mensagemDeErro(e)),
  });

  if (crianca.isLoading) {
    return (
      <>
        <Cabecalho titulo="Ocorrência" voltarPara={`/turma/${turmaId}/crianca/${criancaId}`} />
        <Carregando />
      </>
    );
  }

  const nome = crianca.data?.nomeSocial ?? crianca.data?.nome ?? '';

  if (registrar.isSuccess) {
    const avisadas = registrar.data.familiasAvisadas;

    return (
      <div className="min-h-full pb-10">
        <Cabecalho titulo="Ocorrência registrada" voltarPara={`/turma/${turmaId}`} />
        <main className="space-y-4 px-4 py-4">
          <Cartao interno className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-ok-suave)] text-[color:var(--color-ok)]">
              <Check size={20} />
            </span>
            <div>
              <p className="font-semibold">{registrar.data.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
                {avisadas === 0
                  ? 'Ninguém foi avisado: esta criança não tem responsável com acesso ao app. Procure a secretaria.'
                  : `${avisadas} ${avisadas === 1 ? 'responsável foi avisado' : 'responsáveis foram avisados'}${
                      gravidade === 'GRAVE' ? ' por notificação e e-mail' : ''
                    }.`}
              </p>
            </div>
          </Cartao>

          <Botao bloco onClick={() => navegar(`/turma/${turmaId}/crianca/${criancaId}`)}>
            Voltar para a ficha
          </Botao>
          <Botao variante="secundario" bloco onClick={() => navegar(`/turma/${turmaId}`)}>
            Voltar para a turma
          </Botao>
        </main>
      </div>
    );
  }

  const podeEnviar = descricao.trim().length >= 5 && conduta.trim().length >= 5;

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Registrar ocorrência"
        subtitulo={nome}
        voltarPara={`/turma/${turmaId}/crianca/${criancaId}`}
      />

      <main className="space-y-5 px-4 py-4">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setErro(null);
            registrar.mutate();
          }}
        >
          <section className="space-y-2">
            <RotuloSecao>O que aconteceu</RotuloSecao>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  aria-pressed={tipo === t.valor}
                  className={`min-h-11 rounded-(--raio) px-2 text-xs font-semibold transition ${
                    tipo === t.valor
                      ? 'bg-(color:--cor-acao) text-white'
                      : 'bg-white text-[color:var(--color-tinta-suave)] ring-1 ring-inset ring-[color:var(--color-borda-forte)]'
                  }`}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <RotuloSecao>Gravidade</RotuloSecao>
            <div className="space-y-1.5">
              {GRAVIDADES.map((g) => (
                <button
                  key={g.valor}
                  type="button"
                  onClick={() => setGravidade(g.valor)}
                  aria-pressed={gravidade === g.valor}
                  className={`flex w-full items-center gap-3 rounded-(--raio) border p-3 text-left transition ${
                    gravidade === g.valor
                      ? g.valor === 'GRAVE'
                        ? 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta-suave)]'
                        : 'border-(color:--cor-acao) bg-(color:--cor-acao-suave)'
                      : 'border-[color:var(--color-borda)] bg-white'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      gravidade === g.valor
                        ? g.valor === 'GRAVE'
                          ? 'border-[color:var(--color-alerta)] bg-[color:var(--color-alerta)]'
                          : 'border-(color:--cor-acao) bg-(color:--cor-acao)'
                        : 'border-neutral-300'
                    }`}
                  >
                    {gravidade === g.valor && <Check size={12} className="text-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{g.rotulo}</span>
                    <span className="block text-xs text-[color:var(--color-tinta-suave)]">
                      {g.apoio}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {gravidade === 'GRAVE' && (
            <Aviso>
              <AlertTriangle size={14} className="mr-1 inline" />
              A família recebe notificação e e-mail imediatamente. Escreva a conduta antes de
              enviar — é o que evita o telefonema em pânico.
            </Aviso>
          )}

          {tipo === 'FEBRE' && (
            <Campo
              rotulo="Temperatura (°C)"
              type="number"
              step="0.1"
              min="30"
              max="45"
              inputMode="decimal"
              placeholder="38.4"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
          )}

          <Campo
            rotulo="Onde"
            placeholder="Parque, sala, refeitório…"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />

          <Area
            rotulo="Descrição"
            apoio="O que aconteceu, em uma ou duas frases."
            value={descricao}
            required
            onChange={(e) => setDescricao(e.target.value)}
          />

          <Area
            rotulo="O que fizemos"
            apoio="A parte que tranquiliza quem está em casa. Sem isto o aviso só assusta."
            value={conduta}
            required
            onChange={(e) => setConduta(e.target.value)}
          />

          {erro && <Aviso>{erro}</Aviso>}

          <Botao type="submit" bloco disabled={!podeEnviar || registrar.isPending}>
            {registrar.isPending ? (
              'Registrando…'
            ) : (
              <>
                <Send size={16} /> Registrar e avisar a família
              </>
            )}
          </Botao>

          {/* A ocorrência não entra na fila offline: um aviso grave que só sai
              quando a rede volta seria pior do que a recusa honesta agora. */}
          <p className="text-center text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
            Este registro precisa de internet — a família é avisada na hora.
          </p>
        </form>
      </main>
    </div>
  );
}
