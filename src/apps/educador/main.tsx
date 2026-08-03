import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@/shared/ui/estilos.css';
import './tema.css';
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

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <QueryClientProvider client={cliente}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
