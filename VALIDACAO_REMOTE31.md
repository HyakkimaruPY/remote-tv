# Remote TV 0.31 — validação e mudanças

Base: 0.30 / 40a146d. Checkpoint de arquitetura: f1c7dc9.

## Correções
- Controle: filtro de repetição, interrupção de imagem ativa, retomada após ociosidade e respostas de catálogo processadas após a navegação. Imagens live/favoritos também usam fila limitada.
- Cabeçalho: Voltar chama a saída nativa existente para o Playroom. Callbacks antigos não reabrem a tela nem roubam foco após a saída.
- Séries: seis episódios por página em 3×2; miniaturas 246×138; sinopse/temporadas reposicionadas; divisórias removidas; logo quando disponível, título como fallback. Temporadas fora da área visível continuam acessíveis pelo controle.
- Filmes: composição inferior esquerda com arte de fundo, logo e botões existentes.
- Streaming: preserva motores/rotas atuais; impede reconexão de sessão encerrada, repetição infinita após três falhas consecutivas, alteração de URL assinada e recuperação durante pausa intencional.
- API: retries agendados respeitam cancelamento; JSON inválido tem diagnóstico sem exceção de funções ausentes; autenticação pode ser reaberta após cancelamento.
- Guia permanente: Mandatório.md + AGENTS.md.

## Evidência
14 testes passaram em tests/remote31.test.cjs, incluindo ES5, séries de 6/7/13 episódios, repetição do controle, imagem abortada/erro/timeout, saída, JSON inválido, API durante navegação, reconexão obsoleta, pausa, limite de retries e reabertura de autenticação.

Chromium em 1280×720, com app/common/UI reais e bridge/API/decoder simulados: seis cartões em três colunas e duas linhas; último cartão termina em (1234,677); logo carregado; borda divisória zero; primeira e sexta temporadas acessíveis; filme renderizado; saída ao Playroom invocada uma vez; nenhum erro de página. Capturas inspecionadas visualmente com arte sintética.

Todos os módulos do manifesto tiveram bytes e SHA-256 recalculados e conferidos. A ativação usa version publicado depois dos módulos e manifesto. Arquivos e manifesto 0.30 permanecem preservados.

## Limites e teste na TV
Não foi possível medir latência física do controle, estabilidade de um provedor real ou comportamento do decoder. Abortar src/XHR no WebKit não garante cancelar o trabalho já iniciado no bridge nativo; o transporte de streaming não é interrompido por setas. JSON.parse/decodificação já em execução não são preemptáveis por JavaScript.

Após reabrir o player, verificar release 0.31 no Log. Observar navegação durante carga, clique único e tecla mantida, saída do cabeçalho ao Playroom, paginação/temporadas e reprodução longa com pausa/retomada. A validação no aparelho permanece pendente; os testes locais não garantem eliminar travamentos do firmware ou do provedor.
