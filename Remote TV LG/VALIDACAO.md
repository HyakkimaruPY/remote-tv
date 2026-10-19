# Validação · Aura LG 1.0.0

Base: Remote TV **0.56-beta.5**, commit `d39ea99d9dcc6dfcde9e6358a7dd8daa7f2b241a`. Data: 19/10/2026.

## Resultado executado

- Os quatro fontes originais da beta conferem em bytes e SHA-256 com o manifesto upstream.
- Todos os JavaScripts próprios e o HTML final foram parseados com Acorn em `ecmaVersion: 5`.
- SHA-256 conferido contra Node Crypto: vazio, ASCII, português, chinês, emoji e texto longo.
- Manifesto conferido contra o payload final em bytes UTF-8 e SHA-256.
- Parser M3U: grupos, nomes, tipo de conteúdo e resolução de URL relativa.
- URL Xtream com usuário `001` e senha contendo caracteres reservados: preservados; primeira requisição é `player_api.php`; `get.php` não foi baixado.
- Conta sem autorização recusada antes de carregar o catálogo.
- Chromium headless real: abertura offline do fallback embutido, exatamente dois botões no launcher e três opções de fonte no player.
- API Xtream simulada: 9 consultas, categorias e itens com `category_id`, detalhes de filme e série, seis episódios por página, sem download global.
- Interface beta verificada em 960×540, 1280×720, 1920×1080 e 3840×2160, com inspeção de limites dos cards e capturas locais de filme/série.
- MP4 H.264 gerado localmente foi decodificado no Chromium; duração de 40 segundos observada. O servidor de teste implementa respostas HTTP Range/206 reais.
- Seek pendente não alterou a posição; cancelar preservou a posição; confirmar moveu a reprodução para ~10 segundos. Progresso e identificação do episódio foram persistidos; voltar recuperou a grade.
- Atualização com payload alterado rejeitada sem mudar a cópia ativa.
- Atualização íntegra 1.0.1 simulada: staging, sinal de boot e promoção; versão anterior 1.0.0 preservada.
- Candidato 1.0.2 simulado, com hash válido mas sem sinal de inicialização: watchdog recuperou a versão 1.0.1.
- M3U genérica conectada pela interface e exibida na mesma UI beta.
- CLI oficial `@webos-tools/cli` **3.2.6** gerou e inspecionou o IPK com sucesso.

## Reproduzir

```sh
npm install
python3 build.py
npm test
ffmpeg -f lavfi -i color=c=black:s=320x180:r=10 -t 40 -c:v libx264 -pix_fmt yuv420p -an -movflags +faststart -y /tmp/aura-fixture.mp4
AURA_CHROMIUM=/caminho/do/chromium AURA_TEST_VIDEO=/tmp/aura-fixture.mp4 npm run test:browser
npm run package
ares-package -I dist/com.srhell.aura.lg_1.0.0_all.ipk
```

Ferramentas executadas nesta sessão: Node 24.19.0, Acorn 8.19.0, jsdom 30.1.3, Playwright 1.62.1 e Chromium 153.0.8010.0. Não foi usado um emulador LG: testes de navegador e respostas de provedor simuladas são identificados acima.

## Artefatos finais

- IPK: `com.srhell.aura.lg_1.0.0_all.ipk`
- IPK bytes: `52430`
- IPK SHA-256: `1385eaf48bb3930d60acc4346954aaf8a0d06cc26d98320a7c1d3d9c2a7673fd`
- HTML bytes: `203332`
- HTML SHA-256: `190d9e99f5951412554f63c11f099739258fad007f83a7da139610081252a31a`

## Validação física pendente

Não houve acesso a uma TV LG ou a contas reais de provedores nesta sessão. O teste H.264 no Chromium não certifica o decoder da LG, HLS nativo, controle Magic Remote, CORS/TLS dos provedores, persistência após desligamento elétrico ou todas as gerações webOS. O alvo legado foi tratado no código/ES5, sem declarar homologação física universal.

O IPK é para **webOS**, não para NetCast. O código e o empacotamento estão preparados; instalação, reprodução do provedor e retomada após desligamento devem ser confirmados na TV.
