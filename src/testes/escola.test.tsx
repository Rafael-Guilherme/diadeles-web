import { afterEach, describe, expect, it } from 'vitest';
import {
  ESCOLA,
  ESCOLA_INICIAL,
  daEscola,
  destinoSemEscola,
  escolaDoCaminho,
  esquecerEscola,
  lembrarEscola,
  migrarSessaoAntiga,
} from '@/shared/escola/escola';

/**
 * A escola vem do endereço (docs/arquitetura.md §17.2), e é ela que escolhe o
 * banco na API. Os defeitos caros aqui são silenciosos: um link antigo que vira
 * "escola não encontrada", um atalho que leva para fora do site, a sessão de
 * uma escola aparecendo na outra.
 */

const endereco = (pathname: string, search = '', hash = '') => ({ pathname, search, hash });

afterEach(() => localStorage.clear());

describe('a escola do endereço', () => {
  it('é o primeiro trecho do caminho', () => {
    expect(escolaDoCaminho('/cantinho-feliz/turma/t1')).toBe('cantinho-feliz');
    expect(escolaDoCaminho('/cantinho-feliz')).toBe('cantinho-feliz');
  });

  it('não existe na página inicial', () => {
    expect(escolaDoCaminho('/')).toBeNull();
    expect(escolaDoCaminho('')).toBeNull();
  });

  /* Link de antes da escola no endereço: é rota do app, não escola. */
  it('não confunde rota do app com escola', () => {
    expect(escolaDoCaminho('/instalar')).toBeNull();
    expect(escolaDoCaminho('/redefinir-senha')).toBeNull();
    expect(escolaDoCaminho('/turma/t1/chamada')).toBeNull();
  });

  it('recusa o que não tem forma de endereço de escola', () => {
    expect(escolaDoCaminho('/pwa-192.png')).toBeNull();
    expect(escolaDoCaminho('/Cantinho Feliz')).toBeNull();
  });

  it('nos testes, sem escola no endereço, é a inicial', () => {
    expect(ESCOLA).toBe(ESCOLA_INICIAL);
  });
});

describe('a página inicial', () => {
  it('leva à escola inicial na primeira visita', () => {
    expect(destinoSemEscola(endereco('/'))).toBe(`/${ESCOLA_INICIAL}/`);
  });

  it('leva à última escola usada no aparelho', () => {
    lembrarEscola('cantinho-feliz');
    expect(destinoSemEscola(endereco('/'))).toBe('/cantinho-feliz/');
  });

  /* O convite impresso antes da mudança continua valendo. */
  it('leva o link antigo para dentro da escola, com a consulta', () => {
    lembrarEscola('cantinho-feliz');
    expect(destinoSemEscola(endereco('/instalar', '?convite=SOF-4K2P'))).toBe(
      '/cantinho-feliz/instalar?convite=SOF-4K2P',
    );
  });

  it('abre a tela que o atalho do app instalado pede', () => {
    lembrarEscola('cantinho-feliz');
    expect(destinoSemEscola(endereco('/', '?ir=/comunicados&origem=pwa'))).toBe(
      '/cantinho-feliz/comunicados?origem=pwa',
    );
  });

  it('não deixa o atalho levar para fora do site', () => {
    expect(destinoSemEscola(endereco('/', '?ir=//outro-site.com'))).toBe(`/${ESCOLA_INICIAL}/`);
    expect(destinoSemEscola(endereco('/', '?ir=https://outro-site.com'))).toBe(`/${ESCOLA_INICIAL}/`);
  });

  /* Endereço digitado errado não pode apagar a escola de verdade. */
  it('volta à escola anterior quando a última não existe', () => {
    lembrarEscola('cantinho-feliz');
    lembrarEscola('nao-existe');
    esquecerEscola('nao-existe');
    expect(destinoSemEscola(endereco('/'))).toBe('/cantinho-feliz/');
  });

  /* Escola que sumiu não pode prender a página inicial num erro. */
  it('esquece a escola que não existe mais', () => {
    lembrarEscola('fechou');
    esquecerEscola('fechou');
    expect(destinoSemEscola(endereco('/'))).toBe(`/${ESCOLA_INICIAL}/`);
  });
});

describe('dados do aparelho por escola', () => {
  it('cada escola guarda com o próprio nome', () => {
    expect(daEscola('diadeles.sessao', 'cantinho-feliz')).toBe('diadeles.sessao.cantinho-feliz');
    expect(daEscola('diadeles.sessao', 'outra')).not.toBe(daEscola('diadeles.sessao', 'cantinho-feliz'));
  });

  /* Quem estava dentro antes do deploy não precisa entrar de novo. */
  it('a sessão de antes vai para a escola que aquele build atendia', () => {
    localStorage.setItem('diadeles.sessao', '{"state":{"accessToken":"t"}}');

    migrarSessaoAntiga();

    expect(localStorage.getItem('diadeles.sessao')).toBeNull();
    expect(localStorage.getItem(daEscola('diadeles.sessao', ESCOLA_INICIAL))).toContain('"t"');
  });

  it('não sobrescreve uma sessão nova com a antiga', () => {
    localStorage.setItem('diadeles.sessao', '{"antiga":true}');
    localStorage.setItem(daEscola('diadeles.sessao', ESCOLA_INICIAL), '{"nova":true}');

    migrarSessaoAntiga();

    expect(localStorage.getItem(daEscola('diadeles.sessao', ESCOLA_INICIAL))).toBe('{"nova":true}');
  });
});
