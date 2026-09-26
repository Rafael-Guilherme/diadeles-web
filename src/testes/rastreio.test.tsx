import { afterEach, describe, expect, it, vi } from 'vitest';
import { dadosDoElemento, observarSecoes } from '@/apps/site/rastreio';

/**
 * O rastreio do site institucional. O que importa aqui é contar certo — cada
 * seção uma vez só, e os dados do clique lidos do próprio elemento — porque
 * um número inflado leva a decisão comercial errada.
 */

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('dados do clique', () => {
  it('lê cada data-evento-* como um campo', () => {
    const a = document.createElement('a');
    a.dataset.evento = 'plano-escolher';
    a.dataset.eventoPlano = 'Essencial';
    a.dataset.eventoPeriodo = 'anual';

    expect(dadosDoElemento(a)).toEqual({ plano: 'Essencial', periodo: 'anual' });
  });

  it('sem campos, sem dados', () => {
    const a = document.createElement('a');
    a.dataset.evento = 'hero-ver-planos';
    expect(dadosDoElemento(a)).toBeUndefined();
  });
});

describe('seções vistas', () => {
  it('conta cada seção uma vez, quando aparece', async () => {
    let avisar: (entradas: Array<{ target: Element; isIntersecting: boolean }>) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof avisar) {
          avisar = callback;
        }
        observe() {}
        unobserve() {}
      },
    );

    document.body.innerHTML = '<main><section id="planos"></section><section id="perguntas"></section></main>';
    const planos = document.getElementById('planos')!;
    const perguntas = document.getElementById('perguntas')!;
    const vistas: string[] = [];

    observarSecoes((secao) => vistas.push(secao));

    avisar([{ target: planos, isIntersecting: false }]);
    avisar([{ target: planos, isIntersecting: true }]);
    avisar([{ target: planos, isIntersecting: true }]);
    avisar([{ target: perguntas, isIntersecting: true }]);

    expect(vistas).toEqual(['planos', 'perguntas']);
  });

  /* As seções nascem depois do primeiro render do React. */
  it('espera as seções existirem', async () => {
    const observadas: string[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe(el: Element) {
          observadas.push(el.id);
        }
        unobserve() {}
      },
    );

    observarSecoes(() => undefined);
    document.body.innerHTML = '<main><section id="experimentar"></section></main>';
    await new Promise((r) => setTimeout(r, 250));

    expect(observadas).toEqual(['experimentar']);
  });
});
