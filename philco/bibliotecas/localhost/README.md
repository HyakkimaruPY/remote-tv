# Localhost Philco — QR automático de uso único

A TV usa o WebKit legado e um bridge em `127.0.0.1:8765`; o bridge v7.2 tem apenas `/health`, `/hls`, `/fetch`, escuta **somente loopback** e recusa chamadas proxy para `127.0.0.1`. Um script JS remoto **não consegue abrir um servidor HTTP LAN**. Esta biblioteca contém duas partes:

- `src/client.beta56-6-4-2.js`: cliente ES5 injetado automaticamente com o manifesto. A busca tenta `http://127.0.0.1:8766/pair/new` sem solicitar IP ao usuário. Falha não interrompe a busca pelo controle.
- `main.go`: companion nativo opcional. Precisa ser instalado e iniciado uma vez na TV por um método autorizado (SSH/acesso físico ou imagem de firmware validada). **Atualizar o manifesto JS não instala este binário.** O companion escuta TV em `127.0.0.1:8766` e celular na LAN em `0.0.0.0:8767`, detectando o IPv4 privado de Wi‑Fi/Ethernet no momento de criar a sessão. Sem IP privado, a funcionalidade permanece indisponível.
- `src/module.js`: módulo ativável com teste manual do serviço nativo.

## Compilar sem tocar no firmware original

```bash
cd philco/bibliotecas/localhost
go test main.go main_test.go
GOOS=linux GOARCH=mipsle GOMIPS=softfloat CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o philco-localhost-mipsle main.go
```

A arquitetura MIPS little-endian/software-float é **candidata**, baseada nos estudos do firmware; confirmar ABI do binário executável original e CPU real antes de instalar. Não atualizar o sistema operacional ou substituir o bridge estável. O GitHub Actions também compila o artefato para teste/instalação supervisionada, mas não o distribui automaticamente na TV.

## Vida útil e segurança

Cada entrada na busca cria ID, chave QR e token de controle novos de 192 bits. O primeiro GET válido para `/pair/open?key=...` consome a chave, envia um cookie HttpOnly e mostra teclado. Reutilização do mesmo endereço retorna HTTP 410. Ao sair da busca, o browser solicita `/pair/close`; sem comunicação, a sessão expira em no máximo 5 minutos. O celular nunca recebe senhas IPTV. As rotas /pair/new, /pair/poll e /pair/close não são expostas na porta pública 8767.

Usar somente em Wi‑Fi/LAN confiável, sem encaminhamento de portas no roteador: o serviço usa HTTP local, não HTTPS com autenticação de aparelho. Não expor o serviço na internet. A operação independe de certificados expirados do WebKit.
