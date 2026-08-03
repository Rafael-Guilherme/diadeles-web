import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useSessao } from '@/shared/auth/sessao';
import { iniciarSincronizacao } from '@/shared/offline/sincronizador';
import { Entrada } from '@/shared/telas/Entrada';
import { Instalar } from '@/shared/telas/Instalar';
import { Turmas } from './telas/Turmas';
import { Grade } from './telas/Grade';
import { Chamada } from './telas/Chamada';
import { Pendencias } from './telas/Pendencias';

export function App() {
  const usuario = useSessao((estado) => estado.usuario);

  useEffect(() => iniciarSincronizacao(), []);

  if (!usuario) {
    return (
      <Entrada
        app="educador"
        titulo="Diadeles"
        subtitulo="Escolha um perfil para experimentar o app do educador."
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Turmas />} />
      <Route path="/turma/:turmaId" element={<Grade />} />
      <Route path="/turma/:turmaId/chamada" element={<Chamada />} />
      <Route path="/turma/:turmaId/pendencias" element={<Pendencias />} />
      <Route path="/instalar" element={<TelaInstalar />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function TelaInstalar() {
  const navegar = useNavigate();
  return <Instalar voltar={() => navegar('/')} />;
}
