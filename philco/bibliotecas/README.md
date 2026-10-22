# Bibliotecas Philco — Beta 6.4

Sistema de extensão remoto, independente do player LG. O player nativo Xtream/AutoHLS/VOD continua a base. Uma biblioteca só pode solicitar operações expostas por contratos específicos; ela não pode modificar o firmware, decoder, rede nativa ou drivers.

## Estrutura publicada
- `manager.beta56-6-4.js`: gerenciador ES5, preferências, indicadores, ações Testar/Ativar/Desativar/Reiniciar, verificação de compatibilidade WASM.
- `nucleo-wasm/`: código-fonte C e binário `dist/core.wasm` real de 170 bytes. O gerenciador embute exatamente esse binário para carregar sob WebAssembly quando disponível.
- `diagnostico/`: contadores de eventos e erros, opt-in.
- `estabilidade/`: watchdog passivo com limite de tempo, opt-in, não interfere no motor.
- `rede-ssl/`: dois módulos de testes manuais (rede local e HTTPS via bridge).
- `busca-contextual/`: ativação opt-in e exigência de reinício; teclado, Xtream e QR no `system/readable/`.
- `teclado-remoto/server.cjs`: Node HTTP opcional com tokens separados e validade de 5 minutos; precisa de execução em host alcançável.
- `vendor/qrcode.js` e licença MIT: geração QR local sem CDN.
- `SPEC.md`, `INTEGRACAO.md` e `REMOTE_BETA56_6_4_VALIDATION.md`: documentação e testes.

Módulos sempre devem conter `module.json`, `src/`, `SPEC.md`, `README.md`, `dist/` quando houver binário compilado. WASM não cria suporte ao WebAssembly num navegador QtWebKit antigo; nesse caso o núcleo mantém funcionalidade ES5 equivalente.

## Segurança e rollback
- Manifesto remoto fixa SHA-256 e tamanho de todos os scripts carregados.
- Busca é desativada por padrão; só começa a capturar o botão vermelho após reinício solicitado.
- Nunca executar buscas globais de Xtream, nem salvar informações de autenticação em QR.
- Sem dependência do servidor remoto de teclado para usar player e busca pelo controle; falta de relay exibe aviso.
- Para desligar todos os módulos de 6.4, retornar à release 6.3 validada via marcador + manifesto de rollback, sem limpar favoritos ou progresso.
