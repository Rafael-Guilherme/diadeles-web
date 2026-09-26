import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Rodape } from '../secoes/Rodape';
import { DOCUMENTOS, type DocumentoLegal, type SecaoLegal } from './conteudo-legal';

/**
 * Página de documento legal.
 *
 * Uma coluna estreita e nada mais: não há navegação lateral, não há CTA, não há
 * nada vendendo no meio do texto. Quem abre "Política de privacidade" está
 * procurando uma resposta, e a página inteira existe para não atrapalhar.
 *
 * A faixa de rascunho fica no topo, dentro do fluxo e impossível de não ver.
 * Enquanto o texto for modelo, esconder isso seria pior do que não ter a página.
 */
export function PaginaLegal({ documento }: { documento: DocumentoLegal }) {
  // Vindo do rodapé, a página abriria na mesma altura de rolagem da anterior.
  useEffect(() => window.scrollTo(0, 0), [documento.slug]);

  const outros = DOCUMENTOS.filter((d) => d.slug !== documento.slug);

  return (
    <>
      <header className="border-b border-[color:var(--color-borda)]">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-bold tracking-tight transition hover:opacity-80"
          >
            <img src="/favicon.png" alt="" className="h-8 w-8 rounded-(--raio-sm)" />
            Diadeles
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-(color:--cor-acao)"
        >
          <ArrowLeft size={16} /> Voltar ao site
        </Link>

        <h1 className="mt-4 text-balance text-3xl sm:text-4xl">{documento.titulo}</h1>
        <p className="mt-3 text-lg leading-relaxed text-[color:var(--color-tinta-suave)]">
          {documento.resumo}
        </p>
        <p className="mt-2 text-sm text-[color:var(--color-tinta-tenue)]">
          Última atualização: {documento.atualizadoEm}
        </p>

        <FaixaDeRascunho />

        <div className="mt-10 space-y-9">
          {documento.secoes.map((secao) => (
            <Secao key={secao.titulo} secao={secao} />
          ))}
        </div>

        <nav className="mt-14 border-t border-[color:var(--color-borda)] pt-6">
          <p className="text-sm font-semibold">Os outros documentos</p>
          <ul className="mt-3 space-y-2">
            {outros.map((outro) => (
              <li key={outro.slug}>
                <Link
                  to={`/${outro.slug}`}
                  className="text-(color:--cor-acao) underline underline-offset-2"
                >
                  {outro.titulo}
                </Link>
                <span className="text-[color:var(--color-tinta-tenue)]"> — {outro.resumo}</span>
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <Rodape />
    </>
  );
}

/**
 * O aviso de que o texto ainda não é definitivo.
 *
 * Um documento legal em rascunho, publicado sem dizer que é rascunho, é pior
 * que a ausência da página: a ausência se vê, o rascunho passa por pronto.
 */
function FaixaDeRascunho() {
  return (
    <div className="mt-8 flex items-start gap-3 rounded-(--raio) border border-[color:var(--color-sol-200)] bg-[color:var(--color-sol-50)] p-4">
      <AlertTriangle
        size={18}
        className="mt-0.5 shrink-0 text-[color:var(--color-sol-700)]"
        aria-hidden
      />
      <div className="text-sm leading-relaxed text-[color:var(--color-sol-700)]">
        <p className="font-semibold">Documento modelo, ainda sem revisão jurídica.</p>
        <p className="mt-1">
          O texto abaixo é um esqueleto para revisão, e os trechos entre colchetes ainda não têm
          valor preenchido. Ele não vale como termo contratual até ser revisado e publicado em
          versão definitiva.
        </p>
      </div>
    </div>
  );
}

function Secao({ secao }: { secao: SecaoLegal }) {
  return (
    <section>
      <h2 className="text-xl font-bold">{secao.titulo}</h2>

      {secao.paragrafos?.map((texto) => (
        <p
          key={texto}
          className="mt-3 leading-relaxed text-[color:var(--color-tinta-suave)]"
        >
          <ComNegrito texto={texto} />
        </p>
      ))}

      {secao.itens && (
        <ul className="mt-3 space-y-2">
          {secao.itens.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 leading-relaxed text-[color:var(--color-tinta-suave)]"
            >
              <span
                aria-hidden
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-borda-forte)]"
              />
              <span>
                <ComNegrito texto={item} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * `**assim**` vira negrito.
 *
 * Um marcador só, e nenhuma biblioteca de markdown: o que estes documentos
 * precisam destacar é o nome de um papel — controladora, operadora — no meio
 * de uma frase, e um `split` resolve isso sem 40 KB de dependência num texto
 * que quase ninguém abre.
 */
function ComNegrito({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/\*\*(.+?)\*\*/g).map((pedaco, indice) =>
        indice % 2 === 1 ? (
          <strong key={indice} className="font-semibold text-[color:var(--color-tinta)]">
            {pedaco}
          </strong>
        ) : (
          pedaco
        ),
      )}
    </>
  );
}
