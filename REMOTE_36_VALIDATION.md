# Remote TV 0.36 — retorno simétrico de foco entre cabeçalho e conteúdo

Base publicada: `b9730a031fbcd2994a417a7a3445f274c93bc1a8` (Remote TV 0.35). Release preparada: `2026.09.19-remote.36`.

## Escopo

Correção pequena no M3U bruto/Xtream. O player comum, VOD v34, bridge local, catálogo, favoritos, progresso, engines, CSS e layout permanecem inalterados.

## Evidência e causa

A navegação do 0.35 tinha dois caminhos assimétricos. Na tela de episódios, ↑ sobre a linha de ações (`Voltar` / favorito) era consumido sem mover foco. Em detalhes de filme, ↑ na linha de ações também era consumido. Quando o foco chegava ao cabeçalho por outro caminho, `headMove` tratava ↓ para live, biblioteca, Continuar/Favoritos e log, mas retornava `true` sem mover o foco em `episodes` e `detail`. Isso produz o estado observado de cabeçalho aparentemente preso.

## Mudança

Somente `system/injections/xtream-ui-v36.js` muda no runtime:

- ↑ nas ações de série e filme entra no cabeçalho correspondente;
- ↓ no cabeçalho devolve o foco para o conteúdo da tela atual;
- live, biblioteca, Continuar/Favoritos e log preservam a lógica anterior;
- fallback de retorno procura um controle focável do corpo, evitando um cabeçalho sem saída em vistas auxiliares;
- nenhuma reconstrução adicional de DOM foi introduzida.

O repositório de estudo não foi consultado: a causa está demonstrada na máquina de foco do app e não depende de chip, IR ou hardware.

## Verificações

Branch de validação: `remote36-navfix`.

GitHub Actions run `35456334889`: **39 PASS**.

Inclui:
- parse ES5 dos módulos alterados;
- regressão série → ações → ↑ cabeçalho → ↓ ações;
- regressão filme → ações → ↑ cabeçalho → ↓ ações;
- paginação de episódios;
- supressão de bounce e repetição de direcionais;
- fila de imagens;
- Continue/progresso/retomada;
- navegação e desempenho do player comum;
- catálogo bruto, live, IR, log e saída assíncrona.

Hash/bytes do módulo validado:
- `system/injections/xtream-ui-v36.js`
- SHA-256: `0b37f2887a22ed80143a613b3b7717aebafd0bace0aedaad104418d8c782a2a3`
- bytes UTF-8: `63091`

## Limites

A suíte usa DOM/player/bridge simulados no host. Não substitui o controle físico nem o WebKit da Philco. Como a 0.36 não altera HTML/CSS/layout nem engines, a validação visual do 0.35 continua aplicável ao mesmo DOM; a confirmação física restante é testar ↑/↓ entre conteúdo e cabeçalho em série, filme, Continuar e live após reabrir o app.
