import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { CalendarDays, Home, Megaphone } from 'lucide-react';
import { useSessao } from '@/shared/auth/sessao';
import { Entrada } from '@/shared/telas/Entrada';
import { Instalar } from '@/shared/telas/Instalar';
import { Hoje } from './telas/Hoje';
import { Comunicados } from './telas/Comunicados';
import { Cardapio } from './telas/Cardapio';

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
    { para: '/comunicados', rotulo: 'Avisos', Icone: Megaphone },
    { para: '/cardapio', rotulo: 'Cardápio', Icone: CalendarDays },
  ];

  return (
    <nav className="area-segura-base fixed inset-x-0 bottom-0 z-20 flex border-t border-[color:var(--color-borda)] bg-white/95 pt-1 backdrop-blur">
      {itens.map(({ para, rotulo, Icone }) => (
        <NavLink
          key={para}
          to={para}
          end={para === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold ${
              isActive ? 'text-[--cor-acao]' : 'text-neutral-400'
            }`
          }
        >
          <Icone size={20} />
          {rotulo}
        </NavLink>
      ))}
    </nav>
  );
}
