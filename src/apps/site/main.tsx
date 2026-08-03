import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/ui/estilos.css';
import './tema.css';
import { Site } from './Site';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
