import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, mensagemDeErro } from '../api/cliente';
import { rotuloDoDevice } from '../auth/device';
import { useSessao, type Sessao } from '../auth/sessao';
import { Aviso, Botao, Campo, Cartao } from '../ui/componentes';

const MINIMO = 8;

/**
 * Trocar a própria senha, já estando dentro do app.
 *
 * É o destino de toda senha provisória que a secretaria entrega: ela nasce
 * legível num papel em cima do balcão, e esta tela é o que a substitui por algo
 * que só a pessoa sabe.
 *
 * A API devolve uma sessão nova, e é ela que fica valendo aqui. Sem isso, quem
 * trocasse a senha seria deslogado pelo próprio ato — as sessões antigas são
 * revogadas todas, e a que estava em uso é uma delas.
 */
export function TrocarSenha() {
  const navegar = useNavigate();
  const definirSessao = useSessao((estado) => estado.definir);

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const { data, error } = await api.PATCH('/v1/auth/senha', {
        body: { senhaAtual: atual, novaSenha: nova, deviceLabel: rotuloDoDevice() },
      });
      if (error) throw error;

      definirSessao(data as Sessao);
      setPronto(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  const curta = nova.length > 0 && nova.length < MINIMO;
  const diferente = confirmacao.length > 0 && nova !== confirmacao;
  const repetida = nova.length > 0 && nova === atual;
  const podeEnviar =
    atual.length > 0 && nova.length >= MINIMO && nova === confirmacao && !repetida && !enviando;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl">Trocar minha senha</h1>
        <p className="text-sm leading-snug text-[color:var(--color-tinta-suave)]">
          Trocar a senha encerra as sessões em outros aparelhos. Neste, você continua dentro.
        </p>
      </header>

      {pronto ? (
        <>
          <Cartao interno>
            <p className="font-semibold">Senha trocada</p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
              Use a senha nova da próxima vez que entrar. Se o app estava aberto em outro celular ou
              no tablet da sala, ele vai pedir senha.
            </p>
          </Cartao>
          <Botao bloco onClick={() => navegar('/')}>
            Voltar para as turmas
          </Botao>
        </>
      ) : (
        <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
          <Campo
            rotulo="Senha atual"
            type="password"
            autoComplete="current-password"
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            apoio="Se você recebeu uma senha provisória da secretaria, é ela."
            required
          />
          <Campo
            rotulo="Nova senha"
            type="password"
            autoComplete="new-password"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            erro={
              curta
                ? `Pelo menos ${MINIMO} caracteres.`
                : repetida
                  ? 'Precisa ser diferente da atual.'
                  : undefined
            }
            apoio={`Pelo menos ${MINIMO} caracteres.`}
            required
          />
          <Campo
            rotulo="Repita a nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            erro={diferente ? 'As duas não são iguais.' : undefined}
            required
          />

          {erro && <Aviso>{erro}</Aviso>}

          <Botao type="submit" bloco disabled={!podeEnviar}>
            {enviando ? 'Salvando…' : 'Salvar a senha'}
          </Botao>
          <Botao variante="secundario" bloco type="button" onClick={() => navegar('/')}>
            Cancelar
          </Botao>
        </form>
      )}
    </div>
  );
}
