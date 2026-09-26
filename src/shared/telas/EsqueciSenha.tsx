import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import { Aviso, Botao, Campo, Cartao } from '../ui/componentes';

/**
 * "Esqueci minha senha", para a equipe.
 *
 * A tela **não diz se o e-mail existe** — nem em sucesso, nem em erro, nem no
 * tempo que leva para responder. Um "não encontramos esse e-mail" seria uma
 * lista de quem trabalha na escola, entregue a quem estiver sondando, e é a
 * mesma razão pela qual o login tem mensagem única para senha errada e e-mail
 * inexistente.
 *
 * Por isso a confirmação é escrita no condicional: *"se houver uma conta com
 * esse e-mail"*. Ela é honesta com quem digitou errado e não conta nada a quem
 * está pescando.
 *
 * Não existe do lado da família: o responsável entra por convite e a sessão
 * fica presa ao aparelho — não há senha para esquecer.
 */
export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);

    const { error } = await api.POST('/v1/auth/senha/esqueci', {
      body: { email: email.trim() },
    });

    // A API responde 204 exista a conta ou não, então erro aqui só pode ser
    // rede, formato de e-mail ou limite de tentativas — nada que revele quem
    // tem conta na escola.
    if (error) {
      setErro(
        typeof error === 'object' && error && 'mensagem' in error
          ? String((error as { mensagem: string }).mensagem)
          : 'Não foi possível enviar. Tente de novo em alguns instantes.',
      );
      setEnviando(false);
      return;
    }

    setEnviado(true);
    setEnviando(false);
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl">Esqueci minha senha</h1>
        <p className="text-sm leading-snug text-[color:var(--color-tinta-suave)]">
          Digite o e-mail com que você entra no app. Enviamos um link para criar uma senha nova.
        </p>
      </header>

      {enviado ? (
        <>
          <Cartao interno className="space-y-2">
            <p className="font-semibold">Confira seu e-mail</p>
            <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
              Se houver uma conta com <strong>{email.trim()}</strong>, o link já está a caminho. Ele
              vale uma hora e só pode ser usado uma vez.
            </p>
            <p className="text-sm leading-relaxed text-[color:var(--color-tinta-suave)]">
              Não chegou? Veja no spam. O e-mail pode estar cadastrado com outro endereço — nesse
              caso a secretaria resolve na hora, sem esperar link nenhum.
            </p>
          </Cartao>

          <Link to="/" className="min-h-11 text-center text-sm font-semibold text-(color:--cor-acao)">
            Voltar para a entrada
          </Link>
        </>
      ) : (
        <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
          <Campo
            rotulo="E-mail"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            placeholder="voce@suaescola.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {erro && <Aviso>{erro}</Aviso>}

          <Botao type="submit" bloco disabled={!email.includes('@') || enviando}>
            {enviando ? 'Enviando…' : 'Enviar o link'}
          </Botao>

          <Link
            to="/"
            className="block min-h-11 pt-1 text-center text-sm font-semibold text-(color:--cor-acao)"
          >
            Voltar
          </Link>

          {/* A secretaria é o caminho mais rápido, e dizê-lo aqui evita a
              espera por um e-mail que talvez nunca tenha sido cadastrado. */}
          <Cartao interno>
            <p className="text-sm leading-snug text-[color:var(--color-tinta-suave)]">
              Com pressa? A secretaria da escola gera uma senha nova na hora, pelo painel da gestão.
            </p>
          </Cartao>
        </form>
      )}
    </div>
  );
}
