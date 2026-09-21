# Remote TV 0.53 — validação

Base funcional de TV ao vivo: **0.49**.

## Causa da atualização presa

O estado anterior tinha `version=0.51` e `manifest.json.version=0.52`. O bootstrap exige igualdade entre o marcador e o manifesto antes de aceitar uma release; por isso uma TV cuja última cópia válida era 0.49 podia continuar nela.

## Escopo

- Live preservado em `apps/player1/app.remote49.js`, `xtream-stream-router-v22.js` e `xtream-ui-v49.js`.
- Novo shell versionado adiciona **Atualizar** como último botão do menu.
- `force-update-v53.js` remove somente `remote-tv.staging.v2` e `remote-tv.active.v2`, preservando `previous`, favoritos, progresso e demais dados; depois recarrega o bootstrap.
- VOD 0.53 mantém o aviso de próximo episódio visível durante os 120 segundos finais, permite OK em **Reproduzir agora** e avança automaticamente por evento `ended` ou relógio final.
- Reconexão VOD ficou mais conservadora: buffer útil mantém a conexão e o reset destrutivo exige falha persistente por mais tempo.

## Verificação

- Integridade remota dos 21 módulos por bytes e SHA-256: PASS.
- Parse JavaScript dos módulos: PASS.
- Checagem de compatibilidade ES5 dos módulos novos: PASS.
- Contrato live 0.49 no manifesto: PASS.
- Assertions focadas de updater, próximo episódio e reconexão: PASS.
- `tests/remote53.test.cjs` registra o gate reproduzível em Node.

## Limite

Decoder, controle e propagação/cache do bootstrap ainda dependem da TV física. `version` deve ser o último marcador da publicação.
