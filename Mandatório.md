# Remote TV — guia operacional

Guia de decisões e localização, não histórico de conversa. Leia **Entrada** e **Contratos** em toda tarefa; abra as demais seções por necessidade. O [AGENTS.md](AGENTS.md) contém o fluxo curto. Não duplicar suas instruções aqui.

## Entrada: estabelecer a base certa

**Snapshot verificado em 19/09/2026:** `HyakkimaruPY/remote-tv`, `main`, ativação `092d78851bb1c1afde3dd10c3507e11ba09a7b44`, `version=0.34`, release `2026.09.19-remote.34`, 22 módulos. Isso descreve a inspeção, não fixa a próxima versão: reconfirme a ponta remota antes de editar e publicar.

Ordem de evidência: instrução atual do usuário → estado publicado e código ativo → reprodução/logs sanitizados → testes e relatórios com base identificada → histórico como pista. “Publicado” não significa “recebido pela TV” ou “estável no decoder”. A antiga 0.30 foi referência de estabilidade informada; não substitui automaticamente a base atual.

Leitura inicial, na raiz:

```sh
git status --short
git fetch origin main
git log -5 --oneline origin/main
```

Se a árvore não corresponder à base pretendida, preserve-a e use outro worktree/checkout. Não sobreponha arquivos não rastreados. Se git não acessar o remoto, use o conector GitHub para ler ref, commit, manifesto e arquivos do mesmo SHA; não adivinhe a versão.

```sh
python3 - <<'PY'
import json
from pathlib import Path
m = json.loads(Path('manifest.json').read_text())
print('version:', Path('version').read_text().strip(), 'manifest:', m['version'])
for x in m['modules']:
    print(x['id'], x['phase'], x['path'])
PY
```

Se `version` e manifesto divergirem, investigue publicação em andamento/checkout antigo antes de “corrigir”. Na preparação de uma release essa divergência é temporária e intencional.

## Contratos que devem sobreviver às mudanças

- **Plataforma:** Philco PH32C10DSGWVA, WebKit legado, tela 1280×720, JavaScript de produção ES5. Syntax check do Node não prova ES5; parse com versão 5 e confira APIs/CSS usados. Testes no host podem usar JS moderno.
- **Limite remoto:** HTML/CSS/JS, políticas e capacidades já expostas pelo bridge `http://127.0.0.1:8765`. Kernel, flash, ABI, decoder e novos endpoints nativos não surgem por edição de JS. `native_actions` está desativado; não habilitar incidentalmente.
- **Catálogo:** API-first; analisar o link localmente, sem baixar `get.php`. Listagens exigem `category_id`; uma categoria ativa, detalhes sob demanda. Liberar referências antigas e limitar caches.
- **Estado:** preservar favoritos/progresso/continuar e semântica de identidade do catálogo. Não limpar storage para disfarçar defeito. Migração exige compatibilidade explícita e teste dos dados anteriores.
- **Controle:** um comando físico produz uma ação; tratar captura, keydown, keypress, keyup e IR como caminhos relacionados. Foco precisa de saída e retorno definidos em cada tela/overlay.
- **Assíncrono:** callbacks, retries, timers e imagens de tela/sessão antiga não podem reabrir tela, roubar foco ou reiniciar reprodução. Abortar transporte e invalidar resultado são obrigações distintas.
- **Progresso:** chamar seek não confirma retomada; observar a posição. Durante retomada pendente/falha, não substituir o progresso salvo por segundos iniciados em zero. Seek manual tem prioridade.
- **Vídeo:** preservar engines, URLs assinadas, pausa, próximo episódio, aspecto e camadas. Não adicionar fundo opaco que cubra o vídeo. Prévia com segundo vídeo depende do decoder; não prometer frame exato ou decodificação simultânea sem teste físico.
- **Desempenho:** foco antes de trabalho decorativo; repintura parcial; evitar parsing/storage por card, downloads repetidos e arrays globais pesados. Abortar `src`/XHR não prova cancelamento do trabalho nativo. JS não interrompe `JSON.parse` já em execução.
- **Escopo:** YouTube 2/3, Player 2, firmware e `fei-config` são separados. Configuração externa lida pelo projeto não autoriza editá-la.
- **Segredos:** sanitizar DNS/URLs quando necessário, user/pass/tokens/assinaturas e logs. Não publicar respostas brutas de conta/provedor. Não remover sanitização para depurar.

## Mapa de leitura por sintoma

Caminhos abaixo foram confirmados na 0.34. `manifest.json` sempre decide o que está ativo; preservar ordem/fases e aliases públicos mesmo com novo sufixo de arquivo. `system/injections/` é o prefixo dos nomes abreviados nesta tabela.

| Assunto | Arquivo ativo / ponto de entrada |
|---|---|
| Atualização não chega | `version`, `manifest.json`; [arquitetura do updater](REMOTE_UPDATE_ARCHITECTURE.md), logs/cache do bootstrap |
| Menu base, live nativo, saída Playroom | `apps/player1/app.remote31.js`: `RawPlayer`, `Q`, handlers do documento |
| Catálogo/rede/autenticação | `xtream-lazy-core-v31.js`: `XT10`, `bridge`, `jreq`, `cancel`; `xtream-auth-guard-v31.js`: `ensureAuth` |
| Foco, categorias, Favoritos/Continuar | `xtream-ui-v34.js`: `RawM3U`, `input31`, `key`, `headMove`, `focusSpecialTab34`, `moveSpecialCard34` |
| Carregamento/retorno visual | UI: `specialReq34`, `pauseImgs34`, `resumeImgs34`, `restorePlaybackScreen34`; `xtream.art.urls.v34` guarda até 30 registros de URLs |
| Confirmação de retomada | UI: `promptResume34`, `specialOpen`, `playMovie`, `playEpisode` |
| Seek, retomada, buffer, próximo episódio | `xtream-vod-player-v34.js`: alias `XTVod29`, `applyResume34`, `seekTo`, `writeState`, `enterSeek32`, `leaveSeek32`, `release` |
| URL/container/fallback | `autovod-v22.js`: `XTAutoVod22`; `xtream-stream-router-v22.js`; `hlsjs-loader-v20.js` |
| TMDB/logo/background | `tmdb-metadata-v31.js`: `XTMeta24`; UI faz pré-carregamento e cache de URLs |
| Eventos/camadas adicionais | `common-player-ui-v17.js` envolve `document.onkeydown`; `live-log-overlay-v31.js` usa captura |
| CSS/visibilidade/política | `apps/player1/style.css`, estilos da UI/VOD, `graphos-skin-v27.js` com `!important`, `system/policy.json`, `system/hooks.js` |

Use `rg -n 'nomeDaFuncao|identificador' arquivo` e leia a região encontrada com `sed`. Em arquivo minificado, evite imprimir repetidamente a linha inteira; extraia trechos ou formate uma cópia temporária, sem reformatar a produção por acidente. Leia chamador, estado e eventual sobrescrita posterior antes de editar.

### Comportamentos de referência da 0.34

- Cabeçalho ↓ retorna à categoria/aba ativa; topo do conteúdo ↑ chega ao cabeçalho. Favoritos/Continuar têm movimento explícito; aba Séries não deve voltar sozinha para Filmes.
- Continuar abre a posição salva automaticamente e resolve `episode_id` para séries. Fora dessa tela, progresso ≥5 s oferece Sim/Não; Não inicia em zero.
- Playback oculta a tela de detalhe e depois reexibe seu DOM/foco, preservando arte carregada.
- Séries: seis episódios em 3×2. Filmes mantêm os botões existentes e arte/metadata.
- VOD: ↑ abre botões, ↑ entra no progresso; ←/→ ajustam 1 s; OK confirma; ↑/Voltar cancela. HUD configurado para 4 s. Conferir implementações e exceções ao alterar overlays.
- Transporte: rewind 412/227/177, forward 417/228/176, play 415, pause 19, stop 413/169. São códigos tratados pelo software, não medição do controle físico. O caminho IR também precisa chegar ao VOD uma única vez.

## Diagnóstico e uso eficiente de ferramentas

**Unidade de trabalho:** sintoma → estado/evento inicial → função responsável → causa comprovada ou hipótese marcada → menor correção → evidência de aceitação. Para defeito incerto, uma leitura/reprodução discriminante antes de outra hipótese. Não produzir longas listas especulativas ou solicitar cadeia de raciocínio do modelo.

| Tipo de tarefa | Esforço necessário |
|---|---|
| Documentação/localização | Conferir fatos, links e diff; não instalar browser nem mudar runtime |
| CSS ou função isolada | Caminho direto, dependências imediatas e teste específico; visual se layout mudar |
| Foco, rede, resume, playback | Estados anterior/atual/seguinte, cancelamento e falha; testar interação das camadas |
| Publicação/rollback | Estado remoto, integridade de todos os módulos, concorrência e ordem de ativação |

Adapte a granularidade à confiança e às ferramentas disponíveis, não ao nome comercial do modelo. Para contexto curto: uma hipótese e um patch por vez, checkpoint compacto entre etapas. Para análises mais amplas: mantenha o mesmo escopo, valide hipóteses antes de expandir. Capacidade maior não justifica reescrever arquitetura; menor não justifica omitir verificações.

- Agrupe buscas/leituras independentes, limite saída e guarde resultados úteis. Pare de buscar quando souber o caminho e o teste capaz de decidir.
- Prefira código local/conector GitHub para fatos deste projeto. Internet só para lacuna concreta de API/plataforma; documentação primária. Não pesquisar genericamente “otimizar TV”.
- Git serve para clone/diff/worktree. Nesta sessão, leitura por git funcionou; publicação anterior exigiu conector GitHub por falta de credencial HTTPS. Isso é observação de ambiente, não limitação permanente.
- Não persistir dependências/caches temporários no repo. Detectar Node, Python, jsdom, acorn, Playwright e executável do browser antes de usá-los. Se indisponíveis, registrar o teste não executado e usar verificação compatível; não chamar parsing de teste funcional.
- Não repetir instalação, busca ou execução sem nova evidência. Ao verificar suficientemente o risco concreto, seguir para entrega; revisão interminável também prejudica consistência.

## Verificação proporcional, com evidência

**Documentação apenas:** validar nomes de arquivos/símbolos, exemplos executáveis de leitura, links, coerência com manifesto e diff restrito. Não simular uma nova release do app.

**Runtime:** verificar sintaxe e ES5 dos módulos alterados; executar teste do cenário e regressões adjacentes. A suíte existente é `tests/remote34.test.cjs` (jsdom/acorn), e o visual é `tests/remote34.browser.cjs` (Playwright/browser). Ler imports/configuração antes de executar; os caminhos das suítes são fixos, portanto testar uma nova versão exige apontá-las aos novos módulos. PASS da versão anterior não valida a nova.

Exemplos, apenas se as dependências/caminhos existirem:

```sh
NODE_PATH=/tmp/remote-tv-test/node_modules node tests/remote34.test.cjs
RTV_CHROMIUM=/caminho/real/do/chromium node tests/remote34.browser.cjs
git diff --check
```

| Mudança | Casos decisivos |
|---|---|
| Foco/IR | Toque, tecla mantida, IR+keydown duplicados, bordas/grade vazia, cabeçalho ↓ e retorno ↑, modal e foco após redraw |
| Imagens/catálogo | Categoria 7→8, resposta tardia após troca/saída, imagem com erro/timeout, preservação do DOM e limite de memória |
| Resume/progresso | 0 s/≥5 s/perto do fim, Sim/Não, Continuar sem modal, episódio correto, seek ignorado/recusado e progresso protegido |
| Seek/playback | Confirmar/cancelar, metadata tardia, pausa, quatro segundos, preview indisponível, próximo episódio, sair durante retry/reconexão |
| Estética/vídeo | 1280×720, seis episódios, foco visível, textos/arte e ausência de camada opaca sobre o vídeo |

Cada resultado informa base/arquivo, comando, esperado, observado e limite. Não relaxar assertions ou apagar teste falho para justificar publicação. Investigar se a falha é de ambiente, mock ou produção. Relatórios `REMOTE_32_VALIDATION.md`, `REMOTE_33_VALIDATION.md`, `REMOTE_34_VALIDATION.md` registram testes parciais e suites completas não executadas nas respectivas sessões; não convertê-los em PASS retroativo. TV real permanece uma validação separada.

## Publicação: preparar, conferir, ativar

Aplicar quando atualização remota estiver no escopo autorizado. Documentação isolada usa commit próprio e **não altera `version`, manifesto ou módulos**.

1. Atualizar a referência de `main`; identificar base e próximas versões já usadas. Nunca publicar rascunho antigo sobre uma versão mais nova. Preservar alterações alheias e arquivos das releases anteriores.
2. Criar novos arquivos versionados apenas para módulos alterados. Manter aliases, ordem/fases, política e bootstrap mínimo salvo necessidade comprovada. Gerar manifesto ativo e arquivo `manifest.remoteN.json` com a mesma descrição completa da release.
3. Calcular SHA-256 e bytes sobre conteúdo final UTF-8, não número de caracteres. Conferir todos os módulos, inclusive os inalterados. Alteração após o cálculo invalida o resultado.
4. Publicar módulos, manifesto arquivado, manifesto ativo e relatório/checkpoint. Manter `version` anterior durante preparação. Registrar SHA do commit.
5. Ler remoto e comparar árvore/blobs/conteúdo com o material validado. Reconferir `main`; se mudou, comparar, reconciliar e repetir apenas verificações afetadas. Atualização de ref deve ser fast-forward, nunca forçada. Não sobrescrever versão de outra sessão.
6. Só então publicar `version` em commit separado, com valor igual ao `manifest.version` preparado. Confirmar por leitura remota ref, `version`, manifesto e módulos. GitHub atualizado não prova propagação de cache/CDN nem aplicação na TV.
7. Orientar reabertura completa e leitura da versão no Log. Em falha, identificar camada: marcador/cache/CDN, hash/download, staging, watchdog/ready, app ou decoder. Não mandar limpar todos os dados como primeiro diagnóstico.

Verificação local de integridade, para a preparação de runtime (também pode ser usada em auditoria somente leitura):

```sh
python3 - <<'PY'
import hashlib, json
from pathlib import Path
m = json.loads(Path('manifest.json').read_text())
ids = [x['id'] for x in m['modules']]
assert len(ids) == len(set(ids)), 'IDs duplicados'
for x in m['modules']:
    b = Path(x['path']).read_bytes()
    assert len(b) == x['bytes'], x['path']
    assert hashlib.sha256(b).hexdigest() == x['sha256'], x['path']
print('Integridade local OK; confirmar remoto antes de ativar')
PY
```

**Rollback:** bootstrap mantém active/previous/staging e fallback embutido, conforme a arquitetura documentada. Para rollback remoto, conferir o gate do bootstrap instalado antes de escolher restaurar marcador antigo ou criar nova release com módulos anteriores. Não presumir comparação numérica de versões nem reflashear como primeira ação. Preservar evidência sanitizada e dados do usuário.

## Continuidade sem inflar contexto

O guia mantém mapa/contratos atuais; relatórios por release guardam detalhes e git guarda o histórico. Atualize somente o que mudou e remova instruções obsoletas, preservando informação histórica em seus relatórios/commits. Não anexar a conversa inteira ou listas intermináveis de checkpoints.

Formato de passagem: **base remota; objetivo; arquivos/funções; feito; evidência; pendência/bloqueio; próximo comando útil; publicação/ativação**. Diferenciar fato, hipótese e teste pendente. Ao mudar de sessão/modelo, ler esse checkpoint e reconferir o remoto antes de continuar.

**Checkpoint desta revisão:** base 0.34 / `092d788`; os 22 módulos conferem em bytes/SHA-256 e marcador/manifesto coincidem. Pedido ativo: melhorar somente estes dois guias. O rascunho local de outra 0.32 foi cancelado e não integra esta revisão. Fonte da arquitetura: código ativo, manifesto e relatórios do próprio repo. Não foram executadas suites de runtime nem teste físico para esta edição documental.
