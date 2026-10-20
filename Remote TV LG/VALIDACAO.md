# Validação · atualização online Aura LG 1.0.1

Base remota conferida: `ba37e97b4d900ccf930ae796e288994f8cecd524` (LG remoto 1.0.0; Philco 0.56-beta.5). Origem das correções: IPK 1.1.1 fornecido pelo usuário. Entrega: **somente player remoto 1.0.1**, sem novo IPK.

## Comparação e reprodução

- IPK recebido SHA-256: `1a9147bec803f79c47a0aca8e71144c6efd7964883712dc1022d46cee53f4e01`.
- HTML recebido: `211457` bytes, SHA-256 `a5a66508a108fe94ae183a95c7d20c8a29bb3f24848cf6505f8b343bce9ae248`; hash interno validado.
- HTML publicado: `211457` bytes, SHA-256 `afdedacb0bc20305268adc614f9199b188f5cbac5e867eb2fbff93d3a4ddf02f`.
- O HTML final coincide exatamente com o recebido após normalizar as versões 1.1.1 → 1.0.1 e os rótulos beta.6 → beta.5. Nenhuma correção de runtime foi descartada.
- Os módulos upstream beta.5 permaneceram intactos. As alterações derivadas estão em `src/patches/`; o build exige correspondência exata do contexto de cada patch.
- `app/` e `dist/` continuam byte a byte iguais à base publicada. O bootstrap instalado e o IPK 1.0.0 não foram alterados.
- As diferenças do launcher minificado recebido foram analisadas separadamente: piso mínimo do fallback, comparação numérica de versão e atalhos de teclado. O SHA-256 recebido apresentou a mesma implementação reformatada/minificada; não foi necessário substituir o SHA do pacote original.

## Testes executados

`npm test` (Acorn ES5, manifesto, SHA UTF-8, M3U, credenciais, API-first e rejeição de conta) passou contra a release 1.0.1.

`tests/remote101.cjs`, Chromium real usando os arquivos **originais inalterados de app/** e endpoints de GitHub/provedor simulados:

- Sem clicar em Atualizar, o launcher 1.0.0 consultou `version`, manifesto e HTML 1.0.1 e fez staging.
- Executar abriu a versão 1.0.1, recebeu ready e promoveu a cópia corrigida para o cache.
- Verificado HTTPS preservado no parser de credenciais Xtream.
- Eventos sintéticos de controle (OK código 41, sem clique nativo do navegador): escolha de fonte, checkbox com alternância única, login e botões superiores Filmes, Séries, Favoritos, Continuar e Log funcionaram.
- Cards de filme e episódios abriram por OK; séries apresentaram seis episódios.
- H.264 MP4 local de 40 segundos foi decodificado no Chromium. Busca confirmada moveu para ~10 s e retornar restaurou a grade.
- Ao vivo: entrar em tela cheia e Voltar restaurou a prévia, com retângulo igual a `.pv14`, camada z-index 100 e right/bottom auto; a mídia continuou carregada. O retângulo em tela cheia usou z-index 700.
- Tecla 33 trocou do canal A ao B e atualizou OSD.
- Reabrir não baixou o payload repetidamente; sem rede, a cópia 1.0.1 do cache abriu.
- Nenhuma chamada `get.php` para acessar catálogo; nenhum erro JavaScript.

Reprodução:

```sh
python3 build.py
npm test
AURA_CHROMIUM=/caminho/chromium AURA_TEST_VIDEO=/caminho/video-local-40s.mp4 npm run test:browser
```

## Limite comprovado do launcher recebido 1.1.1

O launcher do IPK recebido foi executado isoladamente em jsdom, fornecendo marcador remoto 1.0.1. Ele fez apenas a consulta de `version`, mostrou “Você já está na versão mais recente.” e **não buscou manifesto nem payload**. A comparação está no código local e não pode ser removida por um HTML remoto que esse launcher ainda não baixou. Portanto, atualização automática 1.0.1 sem reinstalação foi validada para o launcher original 1.0.0, não para esse pacote local 1.1.1. Não foi adotado número remoto falso/maior para contornar a regra.

## Limites físicos

Nenhuma TV LG esteve acessível nesta sessão. Os eventos, geometria, vídeo MP4 e cache foram testados no navegador; decoder LG/HLS nativo, persistência após corte de energia e controle físico seguem dependentes do hardware. O usuário relatou bom funcionamento das correções recebidas em webOS antigo; isso não foi convertido em uma homologação medida por nós.

O relatório anterior 1.0.0 permanece em `VALIDACAO-1.0.0.md`.
