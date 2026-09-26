import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@/shared/ui/estilos.css';
import './tema.css';
import { destinoSemEscola, escolaDoCaminho, lembrarEscola } from '@/shared/escola/escola';
import { migrarFilaAntiga } from '@/shared/offline/fila';
import { App } from './App';

const cliente = new QueryClient({
  defaultOptions: {
    queries: {
      // O educador volta ao app dezenas de vezes por turno: refetch ao focar é
      // o que mantém a grade coerente entre duas pessoas na mesma sala.
      refetchOnWindowFocus: true,
      staleTime: 15_000,
      retry: 1,
    },
  },
});

/*
 * A escola vem do endereço (shared/escola/escola.ts). Sem ela — a página
 * inicial, um atalho do app instalado, um link antigo —, a pessoa é levada
 * para a última escola usada neste aparelho, e nada é montado antes disso.
 */
const escola = escolaDoCaminho(window.location.pathname);

if (!escola) {
  window.location.replace(destinoSemEscola(window.location));
} else {
  lembrarEscola(escola);

  // A fila de antes da escola no endereço vai para o banco da escola certa.
  void migrarFilaAntiga().catch(() => undefined);

  createRoot(document.getElementById('raiz')!).render(
    <StrictMode>
      <QueryClientProvider client={cliente}>
        <BrowserRouter basename={`/${escola}`}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}
