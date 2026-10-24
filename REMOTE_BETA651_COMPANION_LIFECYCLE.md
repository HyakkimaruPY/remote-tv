# Philco — ciclo de vida do companion 6.5.1

Base: `afa8f30b62a18b2c197db5ef06dffd698cc574de`, 24/10/2026.

## Problema e alteração

O supervisor executava o companion em primeiro plano e tratava TERM apenas
liberando o lock. O filho podia continuar ativo; durante a desinstalação, o
supervisor também podia entrar no retry antes da remoção do executável.

O supervisor agora aguarda um filho identificado, encerra esse filho ao receber
sinal e só então libera o lock. A pausa de retry segue o mesmo ciclo. A remoção
elimina primeiro o alvo de lançamento e sinaliza o supervisor identificado pelo
PID e pelo argumento exato do script; o fallback legado também compara argumentos
inteiros, em vez de aceitar qualquer substring no cmdline.

## Verificação

- `python3 tests/philco-companion-lifecycle.py`: cinco testes PASS no host.
  Processos reais com executável de teste inofensivo: início único, TERM com
  coleta do filho, TERM durante retry, retry após falha e desinstalação sem respawn.
  A descoberta em `/proc` na desinstalação usa uma fixture sob `PHILCO_ROOT`;
  os sinais e a espera dos processos são reais. Não é teste do firmware físico.
- `sh -n` nos dois scripts alterados: PASS.
- `git diff --check`: PASS.
- CI inclui a nova suíte, além dos testes existentes, build MIPSLE e empacotamento.
  O resultado da execução remota deve ser conferido no commit publicado.

## Publicação e próximo passo

Somente scripts do companion, testes, workflow e documentação foram alterados.
`version`, manifestos, código do player e árvore LG permanecem na base.
O pacote gerado pela CI precisa ser instalado para aplicar os scripts na TV;
o manifesto HTML não entrega executáveis nativos.

Permanece pendente o ciclo físico do Hello World descrito em
`REMOTE_BETA56_6_5_1_PORTAL.md`: registrar, abrir nos Apps Philco, remover e
conferir após reboot. A validação de processos no host não confirma esse ciclo.
