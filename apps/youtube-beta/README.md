# YouTube beta — Remote TV Philco

Fork de código incorporado de [NicholasBly/youtube-webos](https://github.com/NicholasBly/youtube-webos), versão 0.8.4, commit identificado em `UPSTREAM.json`. Não é um repositório GitHub separado e não é um pacote IPK para instalar na Philco. `upstream/` preserva o código-fonte GPL; a configuração de build e o adaptador Philco ficam separados.

O botão YouTube do Remote TV agora carrega `player-beta56-6-5-5.js`, com hash verificado pelo feature loader. A compilação contém o userscript real do upstream, polyfills para os built-ins ausentes e JavaScript ES5. Usa a página TV do YouTube e os hooks do fork; o resolver Invidious anterior não é aberto por este botão.

A adaptação busca o documento inicial pelo bridge já instalado e executa a página e o fork em iframe sandbox sem `allow-same-origin`. A página não recebe os favoritos, as credenciais IPTV nem o storage do Remote TV. O storage do fork nesta prévia é isolado e temporário; não oferece login persistente. Funções específicas de LG/webOS são excluídas. Nenhum endpoint nativo novo é pressuposto.

Isso permite experimentar a parte web sem atualizar o firmware, mas não moderniza o TLS do navegador, o WebKit, MSE/EME ou os decoders. Os recursos secundários da página e as APIs do YouTube continuam sujeitos a TLS, CORS/origem opaca, codecs e compatibilidade do navegador. O bootstrap pode não iniciar na Philco. Documento buscado, userscript iniciado, interface disponível e vídeo avançando são estados distintos no Diagnóstico. Um erro/time-out permanece explícito. Não existe alegação de reprodução real comprovada.

O iframe é destruído ao sair; respostas de sessão anterior não o recriam. Para voltar usando o controle, o adaptador escuta o documento pai e o documento isolado.

## Reproduzir o build

```sh
npm ci --prefix apps/youtube-beta --ignore-scripts
npm run build --prefix apps/youtube-beta
node tools/build-youtube655.cjs
```

O último comando recompõe o módulo lazy, atualiza seu hash e prepara os manifestos; **não altera `version`**. Conferir concorrência e integridade remota antes de ativar o marcador.

Licenças: `upstream/LICENSE` e `THIRD_PARTY_NOTICES.txt`. A fonte correspondente, o adaptador e as instruções de build acompanham o bundle neste repositório.

## Correção 6.5.6

O adaptador de 10 KB agora é um módulo obrigatório do manifesto e abre a tela antes de buscar o userscript de aproximadamente 475 KB. O userscript é um arquivo separado, verificado por SHA-256 e com timeout de 30 s. OK/IR duplicados não fecham a tela no mesmo comando físico. Erros de download ou integridade permanecem visíveis com Voltar funcionando. O build desta correção usa `node tools/build-network656.cjs`; o script 655 acima é histórico e recompõe a release 655. Os limites de reprodução real/TLS/CORS descritos acima permanecem.
