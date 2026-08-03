import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  ['#como-funciona', 'Como funciona'],
  ['#publicos', 'Para quem'],
  ['#planos', 'Planos'],
  ['#perguntas', 'Perguntas'],
];

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8);
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition ${
        rolou
          ? 'border-[color:var(--color-borda)] bg-white/90 backdrop-blur'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
        <a href="#topo" className="flex items-center gap-2 font-bold tracking-tight">
          <img src="/favicon.png" alt="" className="h-8 w-8 rounded-(--raio-sm)" />
          Diadeles
        </a>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {LINKS.map(([href, texto]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-[color:var(--color-tinta-suave)] transition hover:text-[color:var(--color-tinta)]"
            >
              {texto}
            </a>
          ))}
          <a
            href="#experimentar"
            className="rounded-(--raio) bg-(color:--cor-acao) px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Ver funcionando
          </a>
        </nav>

        <button
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-(--raio-sm) md:hidden"
        >
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {aberto && (
        <nav className="border-t border-[color:var(--color-borda)] bg-white px-5 py-3 md:hidden">
          {LINKS.map(([href, texto]) => (
            <a
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              className="block py-2.5 font-medium"
            >
              {texto}
            </a>
          ))}
          <a
            href="#experimentar"
            onClick={() => setAberto(false)}
            className="mt-2 block rounded-(--raio) bg-(color:--cor-acao) px-4 py-3 text-center font-semibold text-white"
          >
            Ver funcionando
          </a>
        </nav>
      )}
    </header>
  );
}
