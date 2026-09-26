import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@/shared/ui/estilos.css';
import './tema.css';
import { Site } from './Site';
import { PaginaLegal } from './paginas/PaginaLegal';
import { DOCUMENTOS } from './paginas/conteudo-legal';
import { iniciarRastreio } from './rastreio';

/*
  O site ganhou rotas por causa das três páginas legais.

  Caminho e não âncora: "Política de privacidade" é um documento que se manda
  por link, se cita em contrato e se abre sozinho — enterrá-lo num `#` no fim
  da landing tornaria impossível linkar só ele. O `nginx.conf` já devolve
  `index.html` para qualquer caminho, então nada muda no deploy.
*/
// Só com VITE_ANALYTICS_URL e VITE_ANALYTICS_SITE no build (rastreio.ts).
iniciarRastreio();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Site />} />
        {DOCUMENTOS.map((documento) => (
          <Route
            key={documento.slug}
            path={`/${documento.slug}`}
            element={<PaginaLegal documento={documento} />}
          />
        ))}
        {/* Endereço desconhecido devolve a landing: é um site institucional,
            e uma página de 404 aqui não serviria a ninguém. */}
        <Route path="*" element={<Site />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
