# Um Dockerfile, três imagens.
#
# O repositório produz três builds do mesmo código — site, educador e família —
# e cada um vira uma aplicação com domínio próprio. `APP` escolhe qual: no
# Coolify é um build argument por aplicação.
#
#   docker build --build-arg APP=educador \
#                --build-arg VITE_API_URL=https://api.diadeles.com.br .
#
# As três `VITE_*` são de **build**, não de runtime: o Vite substitui
# `import.meta.env` por texto na hora de compilar. Trocar o domínio da API
# depois exige rebuild — restart não resolve, e o app continuaria chamando o
# endereço antigo.
ARG APP=educador

# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app

# Dependências antes do código: enquanto o lockfile não muda, o install inteiro
# vem do cache do Docker.
#
# `--prod=false` explícito: o pnpm pula as devDependencies sozinho quando
# enxerga `NODE_ENV=production`, e o Coolify injeta as variáveis da aplicação
# como build args. Sem a flag o build morre em `vite: not found` — o Vite, o
# TypeScript e o Tailwind são todos devDependencies.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .

ARG APP
ARG VITE_API_URL
ARG VITE_APP_EDUCADOR
ARG VITE_APP_RESPONSAVEL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_EDUCADOR=$VITE_APP_EDUCADOR
ENV VITE_APP_RESPONSAVEL=$VITE_APP_RESPONSAVEL

# `build:$APP` e não `build`: compilar os três e jogar dois fora triplicaria o
# tempo de cada deploy.
RUN pnpm run "build:${APP}"

# ── Release ───────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS release
ARG APP
ARG VITE_API_URL

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-seguranca.inc /etc/nginx/seguranca.inc

# A origem da API entra na CSP aqui, no build, porque é aqui que ela é
# conhecida. `VITE_API_URL` já vem sem barra final e sem caminho — é a origem.
RUN sed -i "s|__API_ORIGEM__|${VITE_API_URL}|g" /etc/nginx/seguranca.inc \
  && nginx -t

COPY --from=build /app/dist/${APP} /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/index.html || exit 1
