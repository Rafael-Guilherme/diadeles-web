/**
 * Nome curto do aparelho, gravado na sessão.
 *
 * A sessão da família é presa ao device e dura meses (docs/arquitetura.md §5):
 * sem um rótulo, a lista de sessões de uma pessoa vira quatro linhas iguais e
 * ninguém consegue revogar a certa — que é justamente o que se quer fazer
 * quando um celular é perdido.
 *
 * Deliberadamente grosseiro: "iPhone · Safari" basta para reconhecer, e olhar
 * o user agent com mais detalhe seria coletar mais do que o necessário sobre a
 * família (§11).
 */
export function rotuloDoDevice(): string {
  if (typeof navigator === 'undefined') return 'Navegador';

  const ua = navigator.userAgent;

  const aparelho =
    /iPhone/i.test(ua) ? 'iPhone'
    : /iPad/i.test(ua) ? 'iPad'
    : /Android/i.test(ua) ? 'Android'
    : /Windows/i.test(ua) ? 'Windows'
    : /Macintosh/i.test(ua) ? 'Mac'
    : /Linux/i.test(ua) ? 'Linux'
    : 'Navegador';

  // A ordem importa: todo navegador no iOS diz "Safari", e Edge e Chrome dizem
  // "Chrome". Do mais específico para o mais genérico.
  const navegador =
    /Edg\//i.test(ua) ? 'Edge'
    : /OPR\//i.test(ua) ? 'Opera'
    : /Firefox\//i.test(ua) ? 'Firefox'
    : /Chrome\//i.test(ua) ? 'Chrome'
    : /Safari\//i.test(ua) ? 'Safari'
    : null;

  return navegador ? `${aparelho} · ${navegador}` : aparelho;
}
