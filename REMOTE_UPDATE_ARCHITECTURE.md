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

Se não for possível extrair credenciais Xtream, o módulo mantém fallback para parsing M3U bruto para não eliminar listas não-Xtream.

## Limite nativo
A lógica de rede é remota sempre que pode ser expressa sobre o endpoint genérico `/fetch` já presente no firmware. O helper MIPS fica como transporte mínimo/estável; alterar binário nativo, decoder, kernel ou ABI ainda exige firmware. Essa separação reduz o risco de boot e permite corrigir política de rede e player pelo GitHub.
