# Remote TV LG 1.0.2 — checkpoint de entrega

**Base revisada:** `HyakkimaruPY/remote-tv`, `main`, player online 1.0.1 e pacote LG webOS 1.0.0. O código da Philco na raiz não foi modificado. A release da LG usa seu próprio `Remote TV LG/version`.

## Alterações

- Criada a atualização 1.0.2 do **player** e do **launcher LG**. O manifesto `appinfo.json` do IPK informa 1.0.2, enquanto o rótulo exibido usa a versão verificada do player em cache/online e informa a base instalada. O shell de inicialização continua embutido para uso offline.
- Atualizador mantém `active`, `previous` e `staging` validados por tamanho/hash; evita regressão automática para número remoto menor, promove apenas após `aura-ready`, recusa dados remotos malformados e permite consulta manual. Releases 1.0.3+ usarão o mesmo protocolo sem exigir um novo IPK.
- Fila das imagens não espera cada lote: até 4 imagens independentes em paralelo, logotipos de canal sem fila exclusiva, carregamento imediato dos posters e apresentação por imagem concluída. Cancelamento de telas e prioridade do foco preservados. Restaura redimensionamento automático de imagens TMDB/servidor na função `asset` do porte.
- Mantida a base `remote-tv 0.56-beta.5` e as correções 1.0.1 importadas e explicitadas nos patches. Não altera a reprodução de mídia, configuração Xtream, favoritos, lista M3U ou credenciais.

## Sequência de publicação

1. GitHub Actions: `/.github/workflows/lg-remote-102.yml` instala as dependências, roda `build.py --update-embedded`, `npm test` e teste em Chromium `tests/remote102.cjs`.
2. O teste de navegador usa imagem inicial com atraso intencional (4,8 s), valida início independente da quinta capa, simula a entrega remota da futura 1.0.3 sem clicar no botão Atualizar, valida execução/cache offline, controles, login, filmes, séries, vídeo MP4, prévia ao vivo e retorno de tela cheia.
3. Gera `com.srhell.aura.lg_1.0.2_all.ipk` com `ares-package`, publica artifact GitHub Actions e preserva 1.0.0.
4. Verifica concorrência: recusa publicar se `main` tiver avançado; publica 1.0.2 HTML/manifesto/backup/IPK, depois o **marcador de ativação** `Remote TV LG/version` em um segundo commit. Nenhum indicador de 1.0.2 deve ser dado como ativo antes desse marco.

## Limites da entrega

O IPK é para TVs LG **webOS**. Nenhuma TV física está conectada ao runner GitHub; testes de decodificação real, WebKit/webOS antigo e controle remoto físico devem ser observados na TV. O launcher IPK já instalado não pode substituir o próprio binário via atualização HTML — a atualização remota é do player/experiência web, mantendo o fallback do pacote.

**Evidência a preencher pelo workflow:** link da execução GitHub Actions, conclusão de testes, hash do IPK compilado, commit de ativação e confirmação do download remoto de 1.0.2.
