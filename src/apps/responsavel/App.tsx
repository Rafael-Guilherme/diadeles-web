import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Baby, CalendarDays, Home, Megaphone } from 'lucide-react';
import { useSessao } from '@/shared/auth/sessao';
import { Entrada } from '@/shared/telas/Entrada';
import { Instalar } from '@/shared/telas/Instalar';
import { Hoje } from './telas/Hoje';
import { Comunicados } from './telas/Comunicados';
import { Cardapio } from './telas/Cardapio';
import { Avisos } from './telas/Avisos';
import { Crianca } from './telas/Crianca';

export function App() {
  const usuario = useSessao((estado) => estado.usuario);

  if (!usuario) {
    return (
      <Entrada
        app="responsavel"
        titulo="Diadeles"
        subtitulo="Veja como uma família acompanha o dia na escola."
      />
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Hoje />} />
          <Route path="/comunicados" element={<Comunicados />} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/crianca" element={<Crianca />} />
          {/* Fora da barra inferior de propósito: o sino no cabeçalho de Hoje é
              o caminho, e uma quarta aba disputaria espaço com o que a família
              abre o app para ver. */}
          <Route path="/avisos" element={<Avisos />} />
          <Route path="/instalar" element={<TelaInstalar />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BarraInferior />
    </div>
  );
}

function TelaInstalar() {
  const navegar = useNavigate();
  return <Instalar voltar={() => navegar('/')} />;
}

function BarraInferior() {
  const itens = [
    { para: '/', rotulo: 'Hoje', Icone: Home },
    { para: '/comunicados', rotulo: 'Comunicados', Icone: Megaphone },
    { para: '/cardapio', rotulo: 'Cardápio', Icone: CalendarDays },
    { para: '/crianca', rotulo: 'Ficha', Icone: Baby },
  ];

  return (
    <nav className="area-segura-base fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md border-t border-[color:var(--color-borda)] bg-white/90 pt-1 backdrop-blur-md">
      {itens.map(({ para, rotulo, Icone }) => (
        <NavLink
          key={para}
          to={para}
          end={para === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-2xs font-semibold transition ${
              isActive ? 'text-(color:--cor-acao)' : 'text-[color:var(--color-tinta-tenue)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* A pílula atrás do ícone é o que marca a aba ativa à distância;
                  só a cor do traço se perde na tela do celular ao sol. */}
              <span
                className={`flex h-7 w-14 items-center justify-center rounded-full transition ${
                  isActive ? 'bg-(color:--cor-acao-suave)' : ''
                }`}
              >
                <Icone size={20} />
              </span>
              {rotulo}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
