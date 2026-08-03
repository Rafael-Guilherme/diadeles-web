/**
 * Gera os ícones PNG dos dois PWAs sem dependência externa.
 *
 * Ícone instalado é requisito real: é por ele que o usuário reencontra o app na
 * tela de início. Os dois apps têm identidades distintas de propósito — o pai
 * instala algo sobre o filho, o educador instala uma ferramenta de trabalho
 * (docs/plano-produto.md §5).
 *
 *   node scripts/gerar-icones.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const APPS = {
  educador: {
    fundo: [31, 111, 92], // verde-escuro: ferramenta de trabalho
    marca: [255, 255, 255],
    destaque: [214, 226, 220],
    forma: 'grade',
  },
  responsavel: {
    fundo: [255, 176, 92], // laranja quente: o dia da criança
    marca: [93, 51, 20],
    destaque: [255, 232, 205],
    forma: 'sol',
  },
  // O site não é instalável — precisa só do favicon.
  site: {
    fundo: [31, 111, 92],
    marca: [255, 176, 92],
    destaque: [255, 232, 205],
    forma: 'sol',
  },
};

function crc32(buf) {
  let c;
  const tabela = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = tabela[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function png(largura, altura, pixels) {
  const assinatura = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  const linhas = [];
  for (let y = 0; y < altura; y++) {
    linhas.push(Buffer.from([0])); // filtro none
    linhas.push(pixels.subarray(y * largura * 4, (y + 1) * largura * 4));
  }
  return Buffer.concat([
    assinatura,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(linhas), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function desenhar(tamanho, config, maskable) {
  const pixels = Buffer.alloc(tamanho * tamanho * 4);
  const centro = tamanho / 2;
  // Maskable precisa de zona segura: o sistema recorta as bordas.
  const escala = maskable ? 0.62 : 0.82;
  const raio = (tamanho / 2) * escala;

  const por = (x, y, [r, g, b], a = 255) => {
    const i = (y * tamanho + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  };

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      por(x, y, config.fundo);
    }
  }

  if (config.forma === 'sol') {
    // Um sol: o dia deles.
    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        const dx = x - centro;
        const dy = y - centro;
        const dist = Math.hypot(dx, dy);
        if (dist <= raio * 0.5) {
          por(x, y, config.marca);
        } else if (dist >= raio * 0.62 && dist <= raio) {
          // 8 raios finos e destacados do corpo — sem o gap fica engrenagem
          const angulo = Math.atan2(dy, dx);
          const volta = ((angulo + Math.PI) / (Math.PI * 2)) * 8;
          const dentro = volta - Math.floor(volta);
          if (dentro > 0.34 && dentro < 0.66) por(x, y, config.marca);
        }
      }
    }
  } else {
    // Uma grade de registros — a tela onde o educador vive.
    const celula = raio * 0.42;
    const inicio = centro - celula * 1.5 - celula * 0.15;
    for (let linha = 0; linha < 3; linha++) {
      for (let coluna = 0; coluna < 3; coluna++) {
        const x0 = Math.round(inicio + coluna * celula * 1.15);
        const y0 = Math.round(inicio + linha * celula * 1.15);
        const cor = linha === 2 && coluna === 2 ? config.destaque : config.marca;
        for (let y = y0; y < y0 + celula && y < tamanho; y++) {
          for (let x = x0; x < x0 + celula && x < tamanho; x++) {
            if (x >= 0 && y >= 0) por(x, y, cor);
          }
        }
      }
    }
  }

  return png(tamanho, tamanho, pixels);
}

for (const [app, config] of Object.entries(APPS)) {
  const destino = resolve(raiz, 'public', app);
  mkdirSync(destino, { recursive: true });

  writeFileSync(resolve(destino, 'pwa-192.png'), desenhar(192, config, false));
  writeFileSync(resolve(destino, 'pwa-512.png'), desenhar(512, config, false));
  writeFileSync(resolve(destino, 'pwa-maskable-512.png'), desenhar(512, config, true));
  writeFileSync(resolve(destino, 'favicon.png'), desenhar(64, config, false));

  console.log(`✓ ícones de ${app} em public/${app}/`);
}
