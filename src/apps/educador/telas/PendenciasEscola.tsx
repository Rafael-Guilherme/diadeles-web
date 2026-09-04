import { LayoutGestao } from '../componentes/LayoutGestao';
import { PendenciasDaEscola } from '../componentes/PendenciasDaEscola';

/**
 * A mesma lista do painel, com o telefone como ação principal.
 *
 * É a primeira aba do celular porque ali a coordenação já está com o telefone
 * na mão — a lista que no computador divide espaço com números aqui ocupa a
 * tela inteira (7a).
 */
export function PendenciasEscola() {
  return (
    <LayoutGestao
      titulo="Pendências"
      descricao={`${hojePorExtenso()} · toda a escola`}
    >
      <PendenciasDaEscola compacto />

      <p className="pt-4 text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
        A ciência por telefone vale como ciência e tira a ocorrência da lista. Fica registrado quem
        ligou, para quem e quando — a família não recebe um segundo pedido de confirmação.
      </p>
    </LayoutGestao>
  );
}

function hojePorExtenso(): string {
  const texto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
