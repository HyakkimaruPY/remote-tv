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

A fila de logos mantém um download ativo. Os testes verificam que teclas repetidas não o cancelam. A navegação de browser usa intervalos reais de 180 ms; Voltar usa 450 ms para respeitar a proteção contra duplicação do controle.

Os arquivos de mídia são gerados, não enviados ao repositório. Estudos de firmware ficam em repositório privado separado.

## Rodada beta 3

```sh
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-3.live.cjs
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-3.vod.cjs
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-3.youtube.cjs
node local-lab/test-browser.cjs
node local-lab/test-youtube.cjs
```

O último comando usa metadados e HLS de fixture para testar o código YouTube, não o serviço real. O servidor executa sempre o app especificado pelo manifesto atual, sem override. `ARCHITECTURE_BETA3.md` documenta as classes e o limite de resolução externa.

## Rodada beta 4: orçamento de imagens e VOD

```sh
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-4.artwork.cjs
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-4.vod.cjs
node local-lab/test-vod-budget.cjs
node local-lab/test-browser.cjs
```

`make-media.sh` também gera `media/vod.webm` com vídeo e áudio sintéticos. O cenário VOD usa capas HTTP com corpo menor quando há parâmetros de tamanho e backdrop atrasado em 3 s. Verifica prontidão dos controles, foco sem reconstruir a grade, geometria estável ao focar, cancelamento de arte no play e decodificação de áudio no Chromium. Saída em `results/vod-budget-beta4.json`. Não simula timestamps/codecs do arquivo do usuário nem o decoder da Philco; detalhes em `REMOTE_BETA56_4_VALIDATION.md`.

## Rodada beta 5: lotes, logos e foco

```sh
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-5.artwork.cjs
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-5.vod.cjs
NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-5.live.cjs
node local-lab/test-vod-budget-beta5.cjs
node local-lab/test-artwork-beta5.cjs
node local-lab/test-browser.cjs
```

As fixtures agora incluem séries, temporadas, seis episódios e logos transparentes. O teste visual verifica 5:7 nos posters, seis miniaturas horizontais, seletor branco de 1 px, divisória/rodapé visíveis e três downloads simultâneos. Resultados beta5 em `results/`, sem substituir métricas beta4. Limites físicos e diagnóstico de startup em `REMOTE_BETA56_5_VALIDATION.md`.
