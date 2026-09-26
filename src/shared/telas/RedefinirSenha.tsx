import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, mensagemDeErro } from '../api/cliente';
import { Aviso, Botao, Campo, Cartao } from '../ui/componentes';

const MINIMO = 8;

/**
 * O segundo passo do "esqueci minha senha": o destino do link do e-mail.
 *
 * Roda **deslogado** — é a única tela do app do educador que precisa existir
 * sem sessão além da própria entrada. Quem chega aqui acabou de clicar num
 * link na caixa de entrada.
 *
 * Não emite sessão ao terminar, de propósito. A API derruba todas as sessões
 * do usuário ao redefinir (é o ponto, quando o motivo foi um celular perdido),
 * e entrar direto contradiria isso: quem acabou de definir a senha deve
 * digitá-la uma vez: é o que confirma que ela foi anotada e não só inventada.
 */
export function RedefinirSenha() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const { error } = await api.POST('/v1/auth/senha/redefinir', {
        body: { token, novaSenha: senha },
      });
      if (error) throw error;
      setPronto(true);
    } catch (e) {
      // "Este link não vale mais. Peça um novo…" vem pronto da API e diz mais
      // do que qualquer texto genérico daqui.
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <Moldura titulo="Link incompleto">
        <Aviso>
          Este endereço não traz o código do e-mail. Abra o link inteiro, direto da mensagem que a
          escola enviou.
        </Aviso>
        <Link to="/esqueci-senha" className="min-h-11 text-sm font-semibold text-(color:--cor-acao)">
          Pedir um link novo
        </Link>
      </Moldura>
    );
  }

  if (pronto) {
    return (
      <Moldura titulo="Senha criada">
        <Cartao interno className="space-y-2">
          <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
            Pronto. Entre com a senha nova — e se o app estava aberto em outro aparelho, ele vai
            pedir senha também: redefinir encerra todas as sessões.
          </p>
        </Cartao>
        <Botao bloco onClick={() => (window.location.href = '/')}>
          Entrar
        </Botao>
      </Moldura>
    );
  }

  const curta = senha.length > 0 && senha.length < MINIMO;
  const diferente = confirmacao.length > 0 && senha !== confirmacao;
  const podeEnviar = senha.length >= MINIMO && senha === confirmacao && !enviando;

  return (
    <Moldura
      titulo="Criar uma senha nova"
      apoio="O link do e-mail vale uma hora e só pode ser usado uma vez."
    >
      <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
        <Campo
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={curta ? `Pelo menos ${MINIMO} caracteres.` : undefined}
          apoio={`Pelo menos ${MINIMO} caracteres.`}
          required
        />
        <Campo
          rotulo="Repita a senha"
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

        {erro && (
          <Link
            to="/esqueci-senha"
            className="block min-h-11 text-center text-sm font-semibold text-(color:--cor-acao)"
          >
            Pedir um link novo
          </Link>
        )}
      </form>
    </Moldura>
  );
}

function Moldura({
  titulo,
  apoio,
  children,
}: {
  titulo: string;
  apoio?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl">{titulo}</h1>
        {apoio && (
          <p className="text-sm leading-snug text-[color:var(--color-tinta-suave)]">{apoio}</p>
        )}
      </header>
      {children}
    </div>
  );
}
