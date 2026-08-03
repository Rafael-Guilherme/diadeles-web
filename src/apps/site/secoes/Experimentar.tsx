import { ArrowUpRight, GraduationCap, Heart } from 'lucide-react';
import { APP_EDUCADOR, APP_RESPONSAVEL } from '../conteudo';

/**
 * O CTA principal. Em vez de um formulário pedindo e-mail para "receber uma
 * demonstração", o produto abre na hora — é a única forma de a escola entender
 * o registro em lote sem alguém explicando por telefone.
 */
export function Experimentar() {
  return (
    <section
      id="experimentar"
      className="border-y border-[color:var(--color-borda)] bg-[--cor-acao] text-white"
    >
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Abra os dois lados agora.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Uma escola de demonstração já está montada, com um dia em andamento: chamada feita,
            almoço e sono registrados, uma criança ausente, uma ocorrência no parque. Sem cadastro,
            sem cartão. Registre algo de um lado e veja aparecer do outro.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <CartaoApp
            href={APP_EDUCADOR}
            icone={<GraduationCap size={22} />}
            titulo="Entrar como educadora"
            texto="Faça a chamada do Berçário II e registre o lanche da turma inteira de uma vez."
            rotulo="Ana Souza · Educadora"
          />
          <CartaoApp
            href={APP_RESPONSAVEL}
            icone={<Heart size={22} />}
            titulo="Entrar como mãe"
            texto="Veja o dia da Sofia como uma família vê: linha do tempo, avisos e cardápio."
            rotulo="Marina Prado · Mãe da Sofia"
          />
        </div>

        <p className="mt-8 text-sm text-white/70">
          Dica: nos dois apps, use “Instalar aplicativo” para adicionar o ícone à tela de início e
          ver como fica no celular de verdade.
        </p>
      </div>
    </section>
  );
}

function CartaoApp({
  href,
  icone,
  titulo,
  texto,
  rotulo,
}: {
  href: string;
  icone: React.ReactNode;
  titulo: string;
  texto: string;
  rotulo: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 transition hover:bg-white/15"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
          {icone}
        </span>
        <ArrowUpRight
          size={20}
          className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white"
        />
      </div>
      <h3 className="mt-4 text-xl font-bold">{titulo}</h3>
      <p className="mt-1.5 leading-relaxed text-white/75">{texto}</p>
      <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/60">
        {rotulo}
      </span>
    </a>
  );
}
