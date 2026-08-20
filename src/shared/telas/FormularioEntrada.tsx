import { useState, type FormEvent } from 'react';
import { api, mensagemDeErro } from '../api/cliente';
import { rotuloDoDevice } from '../auth/device';
import { useSessao, type Sessao } from '../auth/sessao';
import { Aviso, Botao, Campo } from '../ui/componentes';

/**
 * A entrada de verdade, fora da demonstração.
 *
 * São dois caminhos diferentes porque são duas relações diferentes com a
 * escola (docs/arquitetura.md §5):
 *
 * - **Equipe**: e-mail e senha. Gente que trabalha ali, tem crachá e troca de
 *   turno; senha é o que se espera.
 * - **Família**: código do convite e celular, sem senha nenhuma. O pai instala
 *   o app uma vez e nunca mais vê tela de login — a sessão fica presa ao
 *   aparelho. Login recorrente seria o maior ponto de abandono do lado da
 *   família, e uma senha a mais para esquecer não protege nada que o código de
 *   convite já não proteja.
 */
export function FormularioEntrada({ app }: { app: 'educador' | 'responsavel' }) {
  const definirSessao = useSessao((estado) => estado.definir);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [celular, setCelular] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const daEquipe = app === 'educador';

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const deviceLabel = rotuloDoDevice();

      const { data, error } = daEquipe
        ? await api.POST('/v1/auth/login', {
            body: { email: email.trim(), senha, deviceLabel },
          })
        : await api.POST('/v1/auth/convite', {
            body: {
              codigo: codigo.trim(),
              celular: celular.replace(/\D/g, ''),
              nome: nome.trim() || undefined,
              deviceLabel,
            },
          });

      if (error) throw error;
      definirSessao(data as Sessao);
    } catch (e) {
      // A API já devolve mensagem pronta para estes casos — "Convite expirado.
      // Peça um novo à escola." diz mais do que qualquer texto genérico daqui.
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  const podeEnviar = daEquipe
    ? email.includes('@') && senha.length >= 8
    : codigo.trim().length >= 4 && celular.replace(/\D/g, '').length >= 10;

  return (
    <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
      {daEquipe ? (
        <>
          <Campo
            rotulo="E-mail"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="voce@suaescola.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Campo
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </>
      ) : (
        <>
          <Campo
            rotulo="Código do convite"
            apoio="Está no bilhete ou no QR que a escola entregou."
            autoCapitalize="characters"
            placeholder="SOF-4K2P"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            required
          />
          <Campo
            rotulo="Seu celular"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            apoio="É como a escola reconhece você. Só os números."
            placeholder="11988887777"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            required
          />
          <Campo
            rotulo="Seu nome"
            apoio="Opcional — sem isso, vale o nome que a escola escreveu no convite."
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </>
      )}

      {erro && <Aviso>{erro}</Aviso>}

      <Botao type="submit" bloco disabled={!podeEnviar || enviando}>
        {enviando ? 'Entrando…' : daEquipe ? 'Entrar' : 'Entrar com o convite'}
      </Botao>

      {!daEquipe && (
        <p className="text-xs leading-relaxed text-[color:var(--color-tinta-tenue)]">
          Depois disto o app não pede login de novo neste aparelho. Se trocar de celular, peça um
          convite novo à escola.
        </p>
      )}
    </form>
  );
}
