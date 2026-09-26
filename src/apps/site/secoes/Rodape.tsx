import { Link } from 'react-router-dom';
import { APP_EDUCADOR, APP_RESPONSAVEL } from '../conteudo';

/**
 * Rodapé escuro.
 *
 * É o fim da página e o único bloco que não vende nada: o contraste invertido
 * fecha a leitura em vez de deixá-la se dissolvendo em mais um cinza claro.
 */
export function Rodape() {
  return (
    <footer className="bg-[color:var(--color-tinta)] text-white/70">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-bold tracking-tight text-white">
              <img src="/favicon.png" alt="" className="h-7 w-7 rounded-(--raio-sm)" />
              Diadeles
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              A rotina da educação infantil registrada onde ela acontece, e compartilhada com quem
              precisa saber.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <Coluna
              titulo="Produto"
              // Com a barra: a partir de `/termos`, um `#planos` cru não
              // acharia seção nenhuma — a landing não está na tela.
              links={[
                ['/#como-funciona', 'Como funciona'],
                ['/#publicos', 'Para quem'],
                ['/#planos', 'Planos'],
                ['/#perguntas', 'Perguntas'],
              ]}
            />
            <Coluna
              titulo="Demonstração"
              links={[
                [APP_EDUCADOR, 'App do educador'],
                [APP_RESPONSAVEL, 'App da família'],
              ]}
              externo
            />
            <Coluna
              titulo="Legal"
              links={[
                ['/termos', 'Termos de uso'],
                ['/privacidade', 'Política de privacidade'],
                ['/dados-de-criancas', 'Tratamento de dados de crianças'],
              ]}
              interno
            />
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Diadeles · diadeles.com.br</p>
          <p className="mt-1.5">
            Ambiente de demonstração: escola, crianças e famílias são fictícias. Nenhum dado real de
            criança é utilizado.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Coluna({
  titulo,
  links,
  externo = false,
  interno = false,
}: {
  titulo: string;
  links: [string, string][];
  externo?: boolean;
  /** Rota do próprio site — precisa de `Link`, senão recarrega a página inteira. */
  interno?: boolean;
}) {
  const estilo = 'text-white/70 transition hover:text-white';

  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-white/40">{titulo}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([href, texto]) => (
          <li key={texto}>
            {interno ? (
              <Link to={href} className={estilo}>
                {texto}
              </Link>
            ) : (
              <a
                href={href}
                {...(externo ? { target: '_blank', rel: 'noreferrer' } : {})}
                className={estilo}
              >
                {texto}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
