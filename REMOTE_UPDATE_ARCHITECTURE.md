# Remote TV — arquitetura de atualização remota

## Regra central
O firmware é somente o bootstrap confiável. A lógica do Player 1, M3U/Xtream, roteamento HTTP, política HLS, layout, parser, fallbacks e diagnóstico vivem no repositório `HyakkimaruPY/remote-tv`.

## Gate de entrada do player
1. Ao abrir o player, o bootstrap consulta primeiro o arquivo `version`.
2. Se o valor for igual ao `manifest.version` da cópia ativa validada, abre imediatamente essa cópia local sem baixar os módulos novamente.
3. Se o valor mudou, busca `manifest.json`, exige que `manifest.version == version`, baixa todos os módulos, valida SHA-256, grava em staging e relê o staging.
4. Só depois da validação completa a release nova substitui a ativa e é aplicada na mesma abertura do player.
5. Se GitHub/bridge não responder no gate, usa a última release ativa validada; se ela estiver corrompida, usa a release anterior; por último usa o fallback embutido.

`version` deve ser atualizado **por último** em toda publicação. Ele é o commit/activation marker. Isso evita a TV enxergar uma versão nova antes de todos os módulos e o manifesto estarem publicados.

## Estado persistente
- `remote-tv.active.v2`: release ativa completa e validada.
- `remote-tv.previous.v2`: release anterior completa.
- `remote-tv.staging.v2`: área temporária de download/validação.
- `remote-tv.netlog.v1`: log do bootstrap/rede.
- `rawnetlog.v1`: log funcional do M3U/Xtream.

## Xtream Codes
O módulo M3U remoto aceita URLs de formatos diferentes e tenta extrair `DNS`, `username` e `password`. O DNS da API é normalizado para HTTP. A autenticação é feita em `player_api.php` e o catálogo usa endpoints oficiais de live/VOD/series. URLs de log têm credenciais, tokens e caminhos username/password mascarados.

Formatos reconhecidos incluem:
- `get.php?username=...&password=...`
- `?user=...&pass=...`
- `/live/user/pass/...`
- `/movie/user/pass/...`
- `/series/user/pass/...`
- `http://user:pass@host:porta/...`

O endereço M3U serve somente como fonte de `DNS + username + password`. Depois da extração, `get.php` não é requisitado. Se as três credenciais não puderem ser extraídas, o módulo encerra com diagnóstico e **não baixa o M3U bruto**. A primeira chamada de IPTV é sempre `player_api.php` (GET info), seguida de validação de `auth`, `status` e `exp_date` contra o timestamp do servidor antes de carregar categorias.

## Política lazy de catálogo — remote.10
A aplicação não mantém o catálogo Xtream inteiro em memória. O estado é deliberadamente limitado ao que está sendo usado naquele momento:

1. Depois da autenticação, apenas listas leves de categorias (`category_id` + nome) podem permanecer em cache JS.
2. Não são permitidas chamadas globais de `get_live_streams`, `get_vod_streams` ou `get_series` sem `category_id` no fluxo do Player M3U.
3. Ao abrir uma categoria, a chamada contém obrigatoriamente `category_id` e somente os itens daquela categoria ficam no array ativo.
4. Ao trocar de categoria ou de tipo (Ao vivo/Filmes/Séries), a requisição anterior é abortada quando possível, callbacks antigos são invalidados e o array de itens/URLs anterior é liberado antes da próxima chamada.
5. Informações detalhadas de filme são buscadas somente ao abrir o filme, por `get_vod_info&vod_id=...`.
6. Episódios são buscados somente ao abrir uma série, por `get_series_info&series_id=...`, e são liberados ao sair da tela da série.
7. A URL final de reprodução é construída somente quando o item vai ser reproduzido.
8. Antes de substituir grids/telas, o módulo remove `src` de imagens antigas para retirar referências do DOM e facilitar a coleta de memória pelo WebKit.
9. Cache HTTP, cache de imagens e buffers internos do navegador/decoder podem continuar existindo temporariamente; a política garante que o aplicativo não mantenha referências JS desnecessárias a catálogos anteriores.

A `remote.9` dividia respostas grandes por categoria, mas reunia novamente todas as categorias em um único array. A `remote.10` substitui esse comportamento: não existe etapa de agregação global.

## Diagnóstico de JSON
Respostas Xtream são validadas antes de uso. Em erro de `JSON.parse`, o log informa o endpoint lógico, `category_id` quando aplicável, tamanho da resposta, classificação aproximada (`vazio`, `não-JSON`, `provável truncamento` ou `malformado`) e início/fim sanitizados. Há um único retry com cache-buster; o player não transforma silenciosamente um JSON quebrado em catálogo válido.

## Navegação do Log
O Log do Player M3U é navegável pelo controle remoto:
- `↑` a partir do botão de limpar seleciona o painel;
- `OK` entra no modo de rolagem;
- `↑/↓` rolam o conteúdo;
- `OK` novamente sai do modo de rolagem;
- `←/→` também saem do painel para evitar aprisionar o foco.

## Limite nativo
A lógica de rede é remota sempre que pode ser expressa sobre o endpoint genérico `/fetch` já presente no firmware. O helper MIPS fica como transporte mínimo/estável; alterar binário nativo, decoder, kernel ou ABI ainda exige firmware. Essa separação reduz o risco de boot e permite corrigir política de rede e player pelo GitHub.

## Invariante API-first
- `get.php` é proibido como transporte de catálogo.
- O link fornecido pelo GitHub é analisado localmente apenas para extrair DNS/usuário/senha.
- A primeira chamada ao provedor é `http://DNS/player_api.php?username=...&password=...`.
- Categorias usam `get_live_categories`, `get_vod_categories` e `get_series_categories`.
- Conteúdo de categoria usa `get_live_streams`, `get_vod_streams` ou `get_series` **sempre com `category_id`**.
- Detalhes usam `get_vod_info` e `get_series_info` somente sob demanda.
- Credenciais permanecem reais internamente; `***` existe somente no sanitizador de logs.
