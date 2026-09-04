# Cabeçalhos de segurança, repetidos em cada `location` de propósito.
#
# `add_header` no nginx não soma: um `add_header` dentro de um bloco descarta
# todos os herdados. Um arquivo incluído em cada lugar é mais chato de ler do
# que um bloco no topo, e é a única forma de os cabeçalhos existirem em todas
# as respostas.

add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "same-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# A CSP fecha o app em si mesmo. Não há script de terceiro, fonte de CDN nem
# analytics: as fontes são self-hosted (shared/ui/fontes) justamente para que
# esta linha possa ser estrita numa página que mostra o dia de uma criança.
#
# `style-src` precisa de 'unsafe-inline' porque o React escreve `style="..."`
# em atributo — é o preço dos tokens de tema aplicados por elemento, e não
# abre caminho para execução de código.
#
# `connect-src` libera a origem da API porque ela vive noutro subdomínio.
# `frame-ancestors 'none'` impede que a tela da família seja embutida em
# qualquer página de terceiro.
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' __API_ORIGEM__; worker-src 'self'; manifest-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'" always;
