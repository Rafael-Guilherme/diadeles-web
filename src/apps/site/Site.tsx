import { Cabecalho } from './secoes/Cabecalho';
import { Hero } from './secoes/Hero';
import { ComoFunciona } from './secoes/ComoFunciona';
import { Publicos } from './secoes/Publicos';
import { Experimentar } from './secoes/Experimentar';
import { Diferenciais } from './secoes/Diferenciais';
import { Planos } from './secoes/Planos';
import { Perguntas } from './secoes/Perguntas';
import { Rodape } from './secoes/Rodape';

/**
 * Site institucional. Não depende da API e não é instalável — é a porta de
 * entrada que leva para a demonstração dos dois aplicativos.
 */
export function Site() {
  return (
    <>
      <Cabecalho />
      <main>
        <Hero />
        <ComoFunciona />
        <Publicos />
        <Experimentar />
        <Diferenciais />
        <Planos />
        <Perguntas />
      </main>
      <Rodape />
    </>
  );
}
