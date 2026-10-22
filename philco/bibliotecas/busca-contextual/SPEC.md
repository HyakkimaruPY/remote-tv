# Busca contextual — especificação

Módulo opcional; restartRequired=true. Botão vermelho abre busca contextual da seção atual: ao vivo/canais, filmes ou séries. Esquerda: teclado virtual e QR code de pareamento; direita: resultados em duas colunas com até seis itens visíveis por coluna, rolagem pelo controle.

Smartphone: página local autenticada por token efêmero e pareamento explícito, sincronização do texto com a TV. O QR code aponta para endereço alcançável pelo telefone na mesma rede, não para localhost da TV; se servidor de pareamento não existir, mostrar indisponibilidade sem quebrar busca pelo controle.

Seleção: canal abre navegação normal na categoria pai/filha e canal; filme/série abre detalhes normais. Ao sair dos detalhes, retornar ao feed inicial conforme pedido, não à busca. Preservar foco, tecla Voltar e paginação.

Não interceptar o botão vermelho quando o módulo estiver desativado. Testar busca sem rede, zero resultados, caracteres Unicode, teclado remoto, foco e encerramento do player.
