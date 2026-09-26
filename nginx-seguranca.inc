# Cabeçalhos de segurança, repetidos em cada `location` de propósito.
#
# `add_header` no nginx não soma: um `add_header` dentro de um bloco descarta
# todos os herdados. Um arquivo incluído em cada lugar é mais chato de ler do
# que um bloco no topo, e é a única forma de os cabeçalhos existirem em todas
# as respostas.

# HSTS: uma vez visitado por HTTPS, o navegador recusa voltar para HTTP neste
# domínio pelo próximo ano — inclusive contra downgrade em rede hostil, que é o
# Wi-Fi da escola. `includeSubDomains` porque os quatro domínios são HTTPS.
#
# Sem `preload`: entrar na lista embutida dos navegadores vale para o domínio
# inteiro, leva meses para sair e quebraria qualquer subdomínio futuro que
# subisse sem certificado. É uma decisão de infraestrutura, não de arquivo de
# configuração, e não se toma de passagem.
#
# O Traefik do Coolify termina o TLS e repassa; o cabeçalho sai daqui porque é
# aqui que ele acompanha a resposta em todo `location` (ver a nota acima).
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "same-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# A CSP fecha o app em si mesmo. Não há script de terceiro, fonte de CDN nem
# analytics: as fontes são self-hosted (shared/ui/fontes) justamente para que
# esta linha possa ser estrita numa página que mostra o dia de uma criança.
#
# A exceção é o site institucional, e só ele: `__ANALYTICS_ORIGEM__` vira a
# origem do Umami quando o build é do site e há `VITE_ANALYTICS_URL`, e vira
# nada em todos os outros casos — os apps nunca carregam analytics.
#
# `style-src` precisa de 'unsafe-inline' porque o React escreve `style="..."`
# em atributo — é o preço dos tokens de tema aplicados por elemento, e não
# abre caminho para execução de código.
#
# `connect-src` libera a origem da API porque ela vive noutro subdomínio.
# `frame-ancestors 'none'` impede que a tela da família seja embutida em
# qualquer página de terceiro.
add_header Content-Security-Policy "default-src 'self'; script-src 'self' __ANALYTICS_ORIGEM__; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' __API_ORIGEM__ __ANALYTICS_ORIGEM__; worker-src 'self'; manifest-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'" always;
