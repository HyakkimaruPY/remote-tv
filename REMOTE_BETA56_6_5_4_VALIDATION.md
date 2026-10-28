# Remote TV Philco 0.56-beta.6.5.4 — Continuar assistindo

Base publicada: `29b5dab3cff5294e4d7403046dea5050a5b6e4d6` (0.56-beta.6.5.3). Código candidato: `ef646dab433c6fefca4cd6dd32d145544013904e`.

## Resultado

Continuar assistindo abre diretamente o filme ou o episódio salvo, passando a posição registrada ao player. Em categorias, o filme com progresso mostra Continuar e inicia nessa posição sem confirmação adicional. A informação de série passa a oferecer Assistir/Continuar; Continuar escolhe o episódio salvo, inclusive em outra temporada, em vez de depender da temporada exibida. Um episódio selecionado explicitamente retoma seu próprio progresso.

A mudança fica nos módulos versionados `xtream-ui.beta56-6-5-4.js` e `xtream-vod-player.beta56-6-5-4.js`, mantendo os 48 módulos, aliases, fases e recursos da 6.5.3.

- A posição do filme é consultada na ação, com suporte ao registro já existente de Continuar quando necessário. O botão é atualizado ao retornar da reprodução. Cards já renderizados consultam novamente o registro persistido antes de abrir, evitando posição antiga após sair e clicar no mesmo card.
- Série resolve `episode_id` por identidade (string ou número), com suporte ao objeto `episode` já persistido. Sem registro de Continuar, usa o progresso mais recente dos episódios disponíveis. Registro apontando para episódio ausente nunca inicia silenciosamente o episódio um; explica a ausência e conserva os dados.
- Filme antigo sem extensão resolve somente a metadata necessária em segundo plano, sem abrir a informação. Respostas de uma tela já abandonada não iniciam reprodução.
- OK nos cards de Favoritos/Continuar é consumido pela UI uma única vez; navegação horizontal alcança a nova ação na informação de série.
- O gate de retomada não considera o setter de `currentTime` como confirmação. Exige observar a posição em uma chamada posterior, com seek concluído, antes de liberar o play HTML5. Seek ignorado ou que volta a zero conserva o progresso e não libera início em zero. Término por relógio aguarda retomada confirmada.
- Nenhuma migração/limpeza de favoritos, progresso ou storage; esquema existente preservado. Recuperação de congelamento da 6.5.3 mantida.

## Evidência executada

[GitHub Actions aprovado](https://github.com/HyakkimaruPY/remote-tv/actions/runs/40736199250).

`node tests/beta56-6-5-4.resume.cjs`: 14 cenários de integração com os módulos completos de UI e player, DOM jsdom e fixtures de mídia/rede/relógio:

1. Continuar filme por OK abre direto na posição salva; sair e clicar novamente no mesmo card, sem redesenhar a lista, usa novo progresso.
2. Continuar série resolve episódio de outra temporada e ID textual sem abrir informações.
3. Filme por categoria oferece Continuar, inicia sem diálogo e atualiza posição ao voltar.
4. Série por categoria oferece Continuar para o episódio salvo em outra temporada, com acesso por direcional.
5. Registro existente de Continuar filme, sem registro individual, fornece posição e rótulo.
6. Progresso individual de episódios, sem registro de série, seleciona o mais recente.
7. Filmes e séries inéditos mantêm Assistir/início.
8. Episódio salvo ausente não é substituído pelo primeiro e conserva storage.
9. Voltar durante a consulta de série invalida reprodução tardia.
10. Filme antigo sem extensão resolve metadata sem tela de informação.
11. Voltar durante metadata de filme invalida a resposta tardia.
12. Seek assíncrono pendente não libera play antes de terminar.
13. Seek recusado não começa em zero nem substitui progresso.
14. Setter informa o alvo e volta a zero depois: não produz confirmação falsa.

Regressões executadas: `tests/beta56-6-5-3.vod.cjs` apontando para o **player 6.5.4** (19 cenários, incluindo reconexão, pausa, nativo e sessões simuladas); `tests/beta56-5.artwork.cjs` e testes live apontando para a **UI 6.5.4**; base de refinamento 6.5.2; regressão VOD 6.5 original. Todas aprovadas. Os arquivos de regressão anteriores são referências separadas; seus resultados não substituem os cenários sobre o candidato.

Bytes/SHA-256 dos 48 módulos e parse ES5 de todos os módulos JS aprovados no Actions. `node --check` dos dois módulos alterados e nova suíte, e `git diff --check`, aprovados localmente.

## Limites e ativação

Os testes usam mídia, rede e relógio simulados; não houve reprodução no decoder físico nem uso da conta/CDN do usuário. A confirmação na TV permanece separada: abrir Continuar com filme e série, verificar episódio/posição, sair/reabrir e conferir Continuar nas categorias. Nenhuma afirmação de reprodução física é feita.

Publicar código e manifestos mantendo o marcador 6.5.3; conferir hashes remotos e `main`; ativar `version=0.56-beta.6.5.4` em commit separado. Fechar/reabrir completamente o Player 1 e conferir a versão no Log. Não requer APK nem firmware.
