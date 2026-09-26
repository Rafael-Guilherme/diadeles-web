import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Site } from '@/apps/site/Site';
import { PaginaLegal } from '@/apps/site/paginas/PaginaLegal';
import { DOCUMENTOS, PRIVACIDADE } from '@/apps/site/paginas/conteudo-legal';
import { APP_EDUCADOR, APP_RESPONSAVEL, PLANOS } from '@/apps/site/conteudo';

/** O rodapé linka as páginas legais, e `Link` precisa de um router acima. */
function montar(no: React.ReactNode) {
  return render(<MemoryRouter>{no}</MemoryRouter>);
}

/**
 * A landing não depende da API, então o teste cobre o que de fato pode quebrar:
 * a página monta e os CTAs apontam para os apps certos.
 */
describe('site institucional', () => {
  it('apresenta a proposta e os planos', () => {
    montar(<Site />);

    expect(screen.getByText('A turma inteira registrada antes do café.')).toBeDefined();

    for (const plano of PLANOS) {
      expect(screen.getByText(plano.nome)).toBeDefined();
    }
    expect(screen.getByText('6,90')).toBeDefined();
    expect(screen.getByText('11,90')).toBeDefined();
  });

  it('leva para os dois aplicativos de demonstração', () => {
    montar(<Site />);

    const paraEducador = screen
      .getAllByRole('link')
      .filter((no) => no.getAttribute('href') === APP_EDUCADOR);
    const paraFamilia = screen
      .getAllByRole('link')
      .filter((no) => no.getAttribute('href') === APP_RESPONSAVEL);

    expect(paraEducador.length).toBeGreaterThan(0);
    expect(paraFamilia.length).toBeGreaterThan(0);
    // Links externos precisam de rel="noreferrer" junto de target="_blank".
    for (const link of [...paraEducador, ...paraFamilia]) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
  });

  it('deixa as perguntas no HTML, sem depender de clique', () => {
    montar(<Site />);

    // <details> mantém o conteúdo no documento mesmo fechado — importa para
    // busca e para quem navega por leitor de tela.
    expect(screen.getByText(/A educadora continua registrando normalmente/)).toBeDefined();
    expect(screen.getByText(/Apenas os responsáveis com vínculo ativo/)).toBeDefined();
  });
});

/**
 * As três páginas legais.
 *
 * Enquanto o texto for modelo, o que precisa de teste não é o conteúdo — é o
 * aviso de que ele é modelo. Uma página de termos publicada sem esse aviso
 * passa por definitiva, e é isso que não pode acontecer sem alguém perceber.
 */
describe('páginas legais', () => {
  it('todas avisam que ainda não passaram por revisão jurídica', () => {
    for (const documento of DOCUMENTOS) {
      const { unmount } = montar(<PaginaLegal documento={documento} />);
      expect(screen.getByText(/ainda sem revisão jurídica/i)).toBeDefined();
      unmount();
    }
  });

  it('o rodapé leva às três, por caminho próprio', () => {
    montar(<Site />);

    for (const documento of DOCUMENTOS) {
      const link = screen
        .getAllByRole('link')
        .find((no) => no.getAttribute('href') === `/${documento.slug}`);

      expect(link, `sem link para ${documento.slug}`).toBeDefined();
      expect(link!.textContent).toBe(documento.titulo);
    }
  });

  it('a política de privacidade diz o papel de cada parte', () => {
    montar(<PaginaLegal documento={PRIVACIDADE} />);

    // Quem responde por um incidente depende disto, e é a primeira coisa que
    // uma escola pergunta (plano-produto.md §11).
    expect(screen.getAllByText('controladora').length).toBeGreaterThan(0);
    expect(screen.getAllByText('operadora').length).toBeGreaterThan(0);
  });

  it('não promete galeria de fotos, que não existe no produto', () => {
    const midia = DOCUMENTOS.find((d) => d.slug === 'dados-de-criancas')!;
    montar(<PaginaLegal documento={midia} />);

    expect(screen.getByText(/não guarda foto nem vídeo de criança/i)).toBeDefined();
  });
});
