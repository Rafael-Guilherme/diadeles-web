import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ehDaGestao, useSessao } from '@/shared/auth/sessao';
import { iniciarSincronizacao } from '@/shared/offline/sincronizador';
import { Entrada } from '@/shared/telas/Entrada';
import { Instalar } from '@/shared/telas/Instalar';
import { Turmas } from './telas/Turmas';
import { Grade } from './telas/Grade';
import { Chamada } from './telas/Chamada';
import { Pendencias } from './telas/Pendencias';
import { FichaCrianca } from './telas/FichaCrianca';
import { RegistrarOcorrencia } from './telas/RegistrarOcorrencia';
import { Gestao } from './telas/Gestao';
import { Equipe } from './telas/Equipe';
import { Acesso } from './telas/Acesso';
import { Criancas } from './telas/Criancas';
import { CriancaCadastro } from './telas/CriancaCadastro';
import { AcessoDaCrianca } from './telas/AcessoDaCrianca';
import { AnosLetivos } from './telas/AnosLetivos';
import { TurmasGestao } from './telas/TurmasGestao';
import { ComunicadosGestao } from './telas/ComunicadosGestao';
import { CardapioGestao } from './telas/CardapioGestao';
import { Adesao } from './telas/Adesao';
import { RotinaGestao } from './telas/RotinaGestao';
import { Pareceres } from './telas/Pareceres';
import { ParecerEditor } from './telas/ParecerEditor';

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
      <Route path="/turma/:turmaId/pareceres" element={<Pareceres />} />
      <Route path="/turma/:turmaId/parecer/:parecerId" element={<ParecerEditor />} />
      <Route path="/turma/:turmaId/crianca/:criancaId" element={<FichaCrianca />} />
      <Route
        path="/turma/:turmaId/crianca/:criancaId/ocorrencia"
        element={<RegistrarOcorrencia />}
      />

      {/* As rotas de gestão só existem para quem a API deixa entrar nelas. Um
          educador que digitasse /gestao veria três telas de erro 403; mandá-lo
          de volta para as turmas é a resposta honesta. */}
      {ehDaGestao(usuario.papeis) && (
        <Route path="/gestao">
          <Route index element={<Gestao />} />
          <Route path="equipe" element={<Equipe />} />
          <Route path="acesso" element={<Acesso />} />
          <Route path="criancas" element={<Criancas />} />
          {/* "nova" cai no mesmo componente, que abre em branco — cadastrar e
              editar têm exatamente os mesmos campos. */}
          <Route path="criancas/:criancaId" element={<CriancaCadastro />} />
          <Route path="criancas/:criancaId/acesso" element={<AcessoDaCrianca />} />
          <Route path="ano-letivo" element={<AnosLetivos />} />
          <Route path="turmas" element={<TurmasGestao />} />
          <Route path="comunicados" element={<ComunicadosGestao />} />
          <Route path="cardapio" element={<CardapioGestao />} />
          <Route path="adesao" element={<Adesao />} />
          <Route path="rotina" element={<RotinaGestao />} />
        </Route>
      )}

      <Route path="/instalar" element={<TelaInstalar />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function TelaInstalar() {
  const navegar = useNavigate();
  return <Instalar voltar={() => navegar('/')} />;
}
