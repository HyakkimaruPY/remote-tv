# Aura Remote — atualização mobile 1.3 (fonte)
Atualizado o bundle HTML/CSS/JS do canal `phone` para acompanhar a base compilada 1.2: destaque visual na biblioteca, grade de pôsteres 5:7, detalhes em tela cheia, backdrop com fallback para pôster, temporadas, episódios e recomendações locais.

**Estado:** código-fonte preparado; **a atualização automática do APK instalado ainda não está publicada**.

O APK 1.2 só aceita novas revisões assinadas com a chave RSA original, cujo par público está em `android/app/src/main/assets/update_pub.der`. A chave privada nunca deve entrar neste repositório. Após testar a interface:
1. Executar em ambiente seguro `python3 android/tools/publish_release.py --channel phone --revision 3 --key /CAMINHO/PRIVADA.pem`.
2. Conferir os três hashes e a assinatura com `python3 -m unittest discover -s android/tests -v`, adaptando os testes que fixam a revisão 1 quando publicar a nova revisão.
3. Publicar `android/phone/releases/3/{index.html,style.css,app.js}`, depois `android/phone/manifest.json` e **por último** `android/phone/version`.

Nunca subir o marcador antes da assinatura e dos arquivos. `android/tv` permanece inalterado.
A correção do fundo preto de `PlayerView` foi incluída no Java e depende da compilação e instalação de um novo APK: arquivos remotos HTML/CSS/JS não conseguem alterar o compositor nativo do Media3.

Limitações atuais dos dados: a API nativa 1.2 não devolve backdrop próprio, nota, ano ou recomendações globais no detalhe. A interface usa o pôster como fundo quando necessário e sugere outros títulos já carregados na mesma categoria; só mostra metadados realmente disponíveis.
