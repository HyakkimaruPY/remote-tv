# Remote TV Philco 0.56-beta.6.5.7 — inicialização completa do M3U

Base: `658e5e2f727be1dec7bedd7d76b82a5d76d6c053` (6.5.6).

## Evidência da TV

A fotografia enviada pelo usuário mostra cache 6.5.6 pronto, seguida de `GET legacy.html`, configuração remota HTTP 200/85 bytes, repetição de configuração/autenticação, conta HTTP 200/513 bytes e `UI · M3U bruto aberto`. Não mostra o corpo JSON da conta nem uma resposta de categorias. O HTTP 200 não prova sozinho autenticação válida.

O módulo app 6.5.2 usado até a 6.5.6 contém um fallback síncrono que avalia `legacy.html` quando RawM3U ainda não existe. A UI remota atual não precisa desse arquivo. O log confirma entrada no caminho legado, mas não determina por que os módulos esperados estavam ausentes/fora de ordem na TV. Testes de UI/core isolados anteriores não cobriam essa fronteira completa de inicialização.

## Correção

O app 6.5.7 incorpora o núcleo de runtime, entrada, transporte/autenticação, live/VOD, metadata, UI, estilos, atualização e adaptador YouTube numa única execução. Fontes correspondentes e gerador permanecem no repositório. O bundle ES5 minificado tem 206.606 bytes, abaixo de 256 KiB e do limite de 512 KiB do bootstrap. Não há novo endpoint, ação nativa, firmware, WebKit ou parser de playlist integral.

- A aplicação não faz mais XHR/eval de `legacy.html`.
- `ready(player1)` só ocorre após o núcleo estar completo. O bootstrap mantém sua regra de rollback se a inicialização falhar.
- Os 49 IDs/fases do manifesto são mantidos. Os recursos independentes do núcleo permanecem disponíveis com guardas que evitam reinstalação após o app completo, preservando estado, foco e transações em andamento.
- A entrada captura o clique no M3U antes de handlers antigos, restaura o alias da UI remota e chama a instância estável. Uma segunda ativação com a tela aberta não inicia nova autenticação.
- `BOOT657` registra núcleo completo; `ENTRY657` registra abertura pela entrada remota. O core de rede 6.5.6 e a UI 6.5.5 continuam sendo as revisões internas correspondentes; a release da aplicação é 6.5.7.
- Mantém correções 6.5.5/6.5.6, favoritos, histórico, renderização, retomada, proteção de credenciais e YouTube beta com bundle separado.

## Verificação executada

`tests/beta56-6-5-7.startup.cjs`: seis cenários em jsdom, com scripts reais do candidato e transporte/conta fictícios:

1. Aplicação dos 49 módulos em ordem, sem legacy, ready único, uma configuração + uma autenticação, categoria/canal carregados.
2. Bootstrap de compatibilidade executando apenas policy/shell/style/app, sem core previamente instalado: mesmo resultado.
3. Alias RawM3U e handler do botão substituídos por implementação antiga antes do clique: entrada estável impede chamada antiga.
4. Recursos JS do manifesto reaplicados durante a autenticação: não reinicializam core/UI nem cancelam a transação.
5. Voltar durante autenticação: transporte cancelado e nenhum canal/tela reaberto por callback tardio.
6. Conta expirada: erro explícito, sem liberar catálogo.

`tests/beta56-6-5-7.browser.cjs`: Chromium headless real, 1280×720, bundle compacto do candidato, inicialização só pelo app, alias/handler antigos, OK do teclado, reaplicação de recursos e carregamento de categoria/canal. Nenhum `legacy.html`, uma configuração e uma autenticação, sem erro JS. Rede e conta são simuladas; nenhum dado real do provedor foi enviado.

Bytes/SHA-256 e parse ES5 dos 49 módulos aprovados localmente. Workflow 6.5.7 mantém os testes anteriores de rede, abertura YouTube, renderização, retomada e recuperação de live/VOD.

## Limites e publicação

Não há validação física nem confirmação de autenticação na conta real. A mudança elimina o caminho legado observado e permite distinguir o fluxo novo no log; eventual falha posterior da API deverá ser analisada pela resposta/etapa efetiva.

Publicar código/manifestos mantendo `version=0.56-beta.6.5.6`, conferir blobs e CI e só então ativar `version=0.56-beta.6.5.7` em commit separado. Na TV: Atualizar, fechar/reabrir completamente, conferir release 6.5.7 e procurar `BOOT657`/`ENTRY657` no log do M3U. Não limpar os dados da aplicação.

## Reproduzir o build

```sh
npm ci --prefix apps/youtube-beta --ignore-scripts
node tools/build-startup657.cjs
```

O gerador usa as fontes referenciadas pelo manifesto arquivado 6.5.6, cria o app compacto e os recursos com guardas, recompõe o manifesto 6.5.7 e não altera `version`.
