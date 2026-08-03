import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Site } from '@/apps/site/Site';
import { APP_EDUCADOR, APP_RESPONSAVEL, PLANOS } from '@/apps/site/conteudo';

/**
 * A landing não depende da API, então o teste cobre o que de fato pode quebrar:
 * a página monta e os CTAs apontam para os apps certos.
 */
describe('site institucional', () => {
  it('apresenta a proposta e os planos', () => {
    render(<Site />);

    expect(screen.getByText('O dia deles, para quem não pode estar lá.')).toBeDefined();

    for (const plano of PLANOS) {
      expect(screen.getByText(plano.nome)).toBeDefined();
    }
    expect(screen.getByText('6,90')).toBeDefined();
    expect(screen.getByText('11,90')).toBeDefined();
  });

  it('leva para os dois aplicativos de demonstração', () => {
    render(<Site />);

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
    render(<Site />);

    // <details> mantém o conteúdo no documento mesmo fechado — importa para
    // busca e para quem navega por leitor de tela.
    expect(screen.getByText(/A educadora continua registrando normalmente/)).toBeDefined();
    expect(screen.getByText(/Apenas os responsáveis com vínculo ativo/)).toBeDefined();
  });
});
