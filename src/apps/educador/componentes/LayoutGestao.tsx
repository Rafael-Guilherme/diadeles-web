import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSessao } from '@/shared/auth/sessao';
import { Avatar } from '@/shared/ui/componentes';

/**
 * O casco das telas de gestão.
 *
 * No computador é uma lateral fixa, porque a coordenação passa a manhã inteira
 * saltando entre turmas, comunicados e cadastro — e refazer a navegação a cada
 * tela custa mais que os 200px que ela ocupa.
 *
 * No celular a lateral vira quatro abas, e as quatro não são as mesmas: ali a
 * gestora está em pé, entre uma sala e outra, e o que ela abre é a lista de
 * quem precisa de um telefonema. Cadastro, ano letivo e faturas continuam
 * alcançáveis pelo painel, mas fora das abas — fingir que um formulário de
 * matrícula cabe no celular convida a erro de digitação em documento escolar.
 */

const NO_CELULAR = [
  { para: '/gestao/pendencias', rotulo: 'Pendências' },
  { para: '/gestao', rotulo: 'Dia', exato: true },
  { para: '/gestao/comunicados', rotulo: 'Comunicados' },
  { para: '/gestao/turmas', rotulo: 'Turmas' },
];

const NA_LATERAL = [
  {
    titulo: 'Hoje',
    itens: [
      { para: '/gestao', rotulo: 'Painel do dia', exato: true },
      { para: '/gestao/pendencias', rotulo: 'Pendências' },
      { para: '/gestao/turmas', rotulo: 'Turmas' },
      { para: '/gestao/comunicados', rotulo: 'Comunicados' },
      { para: '/gestao/cardapio', rotulo: 'Cardápio da semana' },
    ],
  },
  {
    titulo: 'Escola',
    itens: [
      { para: '/gestao/criancas', rotulo: 'Crianças e cadastro' },
      { para: '/gestao/equipe', rotulo: 'Equipe' },
      { para: '/gestao/acesso', rotulo: 'Acesso das famílias' },
      { para: '/gestao/adesao', rotulo: 'Adesão' },
      { para: '/gestao/rotina', rotulo: 'Tipos de registro' },
      { para: '/gestao/ano-letivo', rotulo: 'Ano letivo' },
      { para: '/gestao/assinatura', rotulo: 'Assinatura e faturas' },
    ],
  },
];

export function LayoutGestao({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  const navegar = useNavigate();
  const usuario = useSessao((estado) => estado.usuario);

  return (
    <div className="flex min-h-full">
      <Lateral nome={usuario?.nome} papel={papelLegivel(usuario?.papeis ?? [])} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="area-segura-topo sticky top-0 z-10 flex items-center gap-3 border-b border-[color:var(--color-borda)] bg-white/95 px-3 pb-2.5 backdrop-blur-md lg:px-6">
          {/* A volta só existe no celular: no computador a lateral já é o
              caminho de volta, e uma seta ali sugeriria um fluxo que não há. */}
          <button
            onClick={() => navegar(-1)}
            aria-label="Voltar"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--color-tinta-suave)] transition active:bg-neutral-100 lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg leading-tight lg:text-xl">{titulo}</h1>
            {descricao && (
              <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">{descricao}</p>
            )}
          </div>

          {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
        </header>

        {/* A largura é travada mesmo em telas grandes: uma tabela de equipe
            esticada em 1440px separa o nome do último acesso por meio metro de
            nada, e ninguém consegue ler a linha inteira sem perder a altura. */}
        <main className="min-w-0 flex-1 px-3 py-4 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>
      </div>

      <AbasDoCelular />
    </div>
  );
}

function Lateral({ nome, papel }: { nome?: string; papel: string }) {
  return (
    <nav className="sticky top-0 hidden h-dvh w-[200px] shrink-0 flex-col border-r border-[color:var(--color-borda)] bg-[color:var(--color-papel)] lg:flex">
      <p className="px-4 py-4 text-lg font-semibold">Diadeles</p>

      <div className="flex-1 overflow-y-auto pb-4">
        {NA_LATERAL.map((grupo) => (
          <div key={grupo.titulo} className="pb-3">
            <p className="px-4 pb-1.5 pt-2 text-2xs font-medium uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)]">
              {grupo.titulo}
            </p>
            {grupo.itens.map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end={item.exato}
                className={({ isActive }) =>
                  `block px-4 py-1.5 text-sm transition ${
                    isActive
                      ? 'bg-(color:--cor-acao-suave) font-semibold text-(color:--cor-acao-forte)'
                      : 'text-[color:var(--color-tinta-suave)] hover:bg-white'
                  }`
                }
              >
                {item.rotulo}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {nome && (
        <div className="flex items-center gap-2.5 border-t border-[color:var(--color-borda)] px-4 py-3">
          <Avatar nome={nome} tamanho="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{nome}</p>
            <p className="truncate text-2xs text-[color:var(--color-tinta-tenue)]">{papel}</p>
          </div>
        </div>
      )}
    </nav>
  );
}

function AbasDoCelular() {
  return (
    <nav className="area-segura-base fixed inset-x-0 bottom-0 z-20 flex border-t border-[color:var(--color-borda)] bg-white/95 pt-1 backdrop-blur-md lg:hidden">
      {NO_CELULAR.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.exato}
          className={({ isActive }) =>
            `flex flex-1 items-center justify-center py-3 text-sm transition ${
              isActive
                ? 'font-semibold text-(color:--cor-acao-forte)'
                : 'text-[color:var(--color-tinta-suave)]'
            }`
          }
        >
          {({ isActive }) => (
            <span
              className={`rounded-(--raio-sm) px-2.5 py-1 ${
                isActive ? 'bg-(color:--cor-acao-suave)' : ''
              }`}
            >
              {item.rotulo}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function papelLegivel(papeis: string[]): string {
  if (papeis.includes('GESTOR')) return 'Gestão';
  if (papeis.includes('COORDENADOR')) return 'Coordenação';
  if (papeis.includes('SECRETARIA')) return 'Secretaria';
  return 'Equipe';
}

/**
 * A tabela das telas de gestão.
 *
 * No computador a coordenação compara linhas — quem acessou, quando, quantas
 * crianças — e comparação é o que a tabela faz e o cartão não. No celular ela
 * rola na horizontal dentro da própria caixa: encolher a coluna até caber
 * transformaria "Berçário II · Maternal I" em "Ber…".
 */
export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-x-auto rounded-(--raio) border border-[color:var(--color-borda)] bg-white"
      style={{ contain: 'paint' }}
    >
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-[color:var(--color-borda)] px-3 py-2 text-2xs font-medium uppercase tracking-[0.1em] text-[color:var(--color-tinta-tenue)] ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}

/** Linha da tabela, com o realce de atenção que a gestão lê antes do texto. */
export function Tr({
  children,
  atencao = false,
}: {
  children: ReactNode;
  atencao?: boolean;
}) {
  return (
    <tr
      className={`border-b border-[color:var(--color-borda)] last:border-b-0 ${
        atencao ? 'bg-[color:var(--color-sol-50)]' : ''
      }`}
    >
      {children}
    </tr>
  );
}
