# Laboratório local da beta 0.56

Este laboratório executa o manifesto beta real em Chromium, 1280×720, sem GitHub Actions. O adapter implementa QJY/MediaPlayer e os endpoints de controle com fixtures; não emula o processador MIPS, o decoder MStar nem o WebKit da TV.

## Reprodução dos testes

Na raiz de remote-tv, com Node, Python 3, ffmpeg e Chromium disponíveis:

```sh
npm install --prefix /tmp/philco-lab-deps acorn@8 jsdom@26 playwright
export NODE_PATH=/tmp/philco-lab-deps/node_modules
sh local-lab/make-media.sh
node tests/beta56.test.cjs
node tests/beta56.vod.cjs
RTV_CHROMIUM=/caminho/para/chromium node local-lab/test-browser.cjs
```

`RTV_CHROMIUM` seleciona um browser instalado; o teste usa o Playwright disponível no runtime ou via NODE_PATH. O servidor vincula somente loopback, nas portas 18765 e 18766. Fixtures usam credenciais fictícias `demo`, 96 canais e logos SVG. Os resultados ficam em `local-lab/results/`.

Para testar o helper Go recuperado do kit privado, use `philco-estudos` no commit `27aa597594dffcaf31ce4c50641a5b5723985944`, Go ≥1.20 e:

```sh
KIT_ROOT=/caminho/philco-estudos sh local-lab/build-kit-host.sh
PHILCO_REAL_BRIDGE=1 PHILCO_HELPER=/tmp/philco-kit-host/helper node local-lab/test-browser.cjs
```

O teste inicia o helper como subprocesso, na mesma rede local do browser, e o encerra ao terminar. O manifesto e os segmentos passam pelo código Go real de `/hls` e `/fetch`; controle, catálogo sintético e ABI permanecem adaptados. O adapter aguarda o manifesto/segmento e então decodifica o WebM de referência no host: não comprova decodificação TS/H.264 na TV.

A fonte completa encontrada é v7.2. Os arquivos posteriores do kit incluem patches resumidos, trechos `...` e uma base v7.3.3 ausente. Não se inventou uma reconstrução integral v7.3.6. O bundle CA do host também difere do firmware; nada desse laboratório deve ser instalado como firmware.

A fila de logos mantém um download ativo. Os testes verificam que teclas repetidas não o cancelam. A navegação de browser usa intervalos reais de 180 ms; Voltar usa 450 ms para respeitar a proteção contra duplicação do controle.

Os arquivos de mídia são gerados, não enviados ao repositório. Os fontes privados do kit também não são copiados para este repositório público.
