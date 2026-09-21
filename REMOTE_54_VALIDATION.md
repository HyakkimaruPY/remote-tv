# Remote TV 0.54 — YouTube 3

Base: Remote TV **0.53**, preservada como baseline estável de live.

## Escopo

Somente o caminho do **YouTube 3 teste** muda. Live, VOD, Xtream, M3U comum, M3U bruto e o botão de atualização da 0.53 permanecem nos mesmos módulos.

## Sintomas físicos recebidos

- o embed abre, mas a superfície permanece preta;
- não há áudio nem imagem;
- os direcionais não permitem chegar com segurança ao Log.

## Correção

- o iframe não pode mais capturar foco (tabindex=-1);
- ↑ abre a interface e seleciona diretamente **Log**;
- ←/→ percorrem **Voltar / Fallback / Log** explicitamente, sem depender do spatial navigation do WebKit;
- com o Log aberto, ↑/↓ rolam o painel;
- OK executa o botão focado em vez de sempre virar play/pause;
- iframe.onload continua não sendo considerado prova de vídeo;
- embed sem estado de reprodução cai em fallback após uma janela curta;
- ordem de recuperação: embed padrão → extração remota → nocookie;
- na rota remota, a URL de mídia tenta primeiro o QjyMediaPlayer/MediaPlayer nativo da Philco, com superfície fullscreen e alpha de vídeo;
- durante o player nativo, os blocos base são ocultados para não cobrir o plano de vídeo por hardware;
- sem avanço do relógio nativo, a rota cai para HTML5 direto e depois continua o ciclo de fallback.

## Atualização

O mecanismo padrão continua sendo o bootstrap por version → manifest.json. O botão **Atualizar** da 0.53 não substitui esse fluxo; continua sendo somente fallback para limpar staging/release ativa e recarregar o bootstrap quando necessário.

## Validação de preparação

- parse JavaScript dos módulos novos: PASS;
- compatibilidade ES5 por inspeção sintática: PASS;
- assertions de navegação, watchdog e player nativo: PASS;
- composição live/VOD 0.53 preservada no manifesto: PASS;
- teste reproduzível: tests/youtube3-v54.test.cjs.

A confirmação de imagem/áudio continua dependendo da TV física e do formato que o YouTube entregar à rota remota.
