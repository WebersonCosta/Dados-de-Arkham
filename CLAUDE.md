# Dados de Arkham: notas do projeto

Notas para continuar o trabalho numa conversa nova sem perder nada. O README explica o app para
quem usa; aqui ficam o estado atual, as decisões já tomadas, o jeito de trabalhar e as ideias
para depois. Mantenha este arquivo em dia a cada etapa.

## Quem pede e como trabalhar

- Quem pede o projeto é Weberson Costa, que não programa e fala português: todas as explicações
  são em português simples, sem jargão. Weberson testa no celular e decide; o Claude escolhe as
  ferramentas e faz todo o desenvolvimento.
- A pasta do projeto fica na Área de Trabalho (`Dados de Arkham`, dentro do OneDrive) e é o
  próprio repositório: o que está salvo nela é o que vai para o GitHub.
- **O endereço oficial só muda com um pedido explícito, como "pode publicar".** Todo trabalho
  novo vai para a linha `desenvolvimento` e para o endereço de teste.
- Senhas e tokens nunca vão para o chat. O `git push` usa o login do GitHub que já está guardado
  no Windows (Git Credential Manager).
- Os dois repositórios são públicos. Qualquer mudança que exija mexer na visibilidade de um
  repositório precisa ser perguntada antes.
- Nada de reescrever histórico (`push --force` é bloqueado aqui). O endereço de teste é
  atualizado com um commit novo por cima (veja "Fluxo").
- As mensagens de commit terminam com a linha `Co-Authored-By` que o sistema indicar.
- Quando Weberson pedir para avisar de problemas antes de implementar, explicar o problema e
  perguntar antes de mexer.

## Estado atual (31/10/2026)

| | Versão | Onde |
| --- | --- | --- |
| Oficial | **1.1**, publicada em 30/10/2026 | `main` = tag `v1.1` (94cafb6), https://webersoncosta.github.io/Dados-de-Arkham/ |
| Desenvolvimento | **1.2**: mesa compartilhada, fase 2, passo 6 (a sessão real no Discord) com Weberson | `desenvolvimento`; endereço de teste com o envio `teste 10` |

Versões publicadas (tags): `v1.0` (3ac132c) e `v1.1` (94cafb6). A 1.1 trouxe: vários dados
juntos (fórmulas como 2d6 + 6), o 1d3, atalhos e fórmulas favoritas, os modos dado único e
montagem, as atualizações sem mistura de versões e o número da versão no canto.

- Próximo envio para o teste: subir o `RELEASE` do `sw.js` para 11.
- A passagem da 1.0 para a 1.1 ainda dependeu do `sw.js` antigo (o da 1.0, que buscava cada
  arquivo na internet): nos primeiros minutos depois da publicação, quem abriu o app pode ter
  pegado uma página misturada e precisado fechar e abrir de novo. Da 1.1 em diante, as
  atualizações chegam inteiras.

**Etapa atual: mesa compartilhada.** O Guardião e até 6 jogadores rolando juntos, cada um no seu
aparelho, numa call do Discord. O plano de Weberson (sala com código, visibilidade aberta, privada
ou secreta protegida no servidor, o Guardião, a mesa ritual 3D e as 5 fases) está em
[`docs/plano-mesa-compartilhada.md`](docs/plano-mesa-compartilhada.md): leia antes de mexer nisso.
- Fase 1 (o plano) aprovada em 31/10/2026: as decisões e os 6 passos da fase 2 estão no fim do
  plano. Resumo: um servidor de salas no Cloudflare (Workers + Durable Objects, plano gratuito,
  sem cartão), JavaScript puro, sem biblioteca de interface.
- Fase 2, passo 1 (preparação, o app não mudou) pronto em 31/10/2026: o servidor em `server/`
  (veja "Mesa compartilhada: o servidor" abaixo). A mesa de teste está no ar em
  https://mesa-arkham-teste.mesa-arkham.workers.dev e passou no teste dos três aparelhos (12 de
  12, com o tempo sem uso reduzido a 20 s só para o teste). A mesa oficial ainda não existe; vai
  ser https://mesa-arkham.mesa-arkham.workers.dev, só com o "pode publicar".
- A conta do Cloudflare é de Weberson (plano gratuito, sem cartão). O subdomínio gratuito
  `mesa-arkham.workers.dev` foi criado pelo wrangler no primeiro envio. Este PC guarda o login do
  wrangler (fora do projeto, em `%APPDATA%\xdg.config\.wrangler`), feito só com as permissões de
  Workers: `wrangler login --scopes account:read user:read workers:write workers_scripts:write`.
- Fase 2, passo 2 (entrar na mesa) testado e aprovado por Weberson em 31/10/2026 (PC como
  Guardião, celular como jogador, `?aba` para um terceiro).
- Fase 2, passo 3 (rolagens ao vivo, com rótulo) testado e aprovado por Weberson em 31/10/2026.
- Fase 2, passo 4 (privada, secreta e suspense) testado e aprovado por Weberson em 31/10/2026: a
  escolha de quem vê perto da bandeja (o Guardião rola secreta por padrão), o sinal de suspense
  e as marcas "privada" e "secreta".
- Fase 2, passo 5 (quedas e encerramento) testado e aprovado por Weberson em 31/10/2026: a fila
  das rolagens feitas sem conexão, o aviso "Sem conexão com a mesa" perto da bandeja e o aviso de
  versão (veja "Mesa compartilhada: o app"), com a conferência de versão (`outdated`) na mesa de
  teste. "Encerrar a mesa" e a sala que se apaga sozinha já vinham dos passos 1 e 2.
- Fase 2, passo 6 (a sessão real no Discord, pelo endereço de teste) começou em 31/10/2026,
  esperando a sessão de Weberson; depois dela, os ajustes e o "pode publicar". Antes da sessão: a
  mesa cheia (o Guardião e 6 jogadores rolando ao mesmo tempo, na mesa de teste: cada rolagem
  chegou uma vez a cada um; o teste dos aparelhos agora tem esse caso, 13 de 13 com o da sala que
  se apaga sozinha pulado) e a tela com a mesa cheia e nomes compridos, que trouxe dois ajustes
  (envio `teste 10`): o rótulo que sumia no histórico e a lista de quem está na mesa, que tomava o
  lugar das rolagens (veja "Mesa compartilhada: o app").
- Risco conhecido para a sessão: cada navegador guarda a sua chave de aparelho. Quem entra por um
  caminho e volta por outro (no iPhone, o navegador de dentro do Discord, o Safari e o ícone na
  tela de início guardam coisas separadas) vira outro aparelho e ocupa mais um lugar, e ainda não
  dá para liberar um lugar (isso é do painel do Guardião, fase 3). Orientação dada: entrar e
  voltar sempre pelo link do convite; se a mesa encher, encerrar e criar outra.

## Decisões tomadas (e por quê)

**Dados e física**
- O resultado é sempre a face que ficou para cima depois da física (cannon-es); nada é sorteado
  antes. As faces saem por igual (teste de qui-quadrado normal em milhares de lançamentos).
- d4 a d20, e o d100 feito de **dois d10**: dezenas (00 a 90, de pedra) e unidades (0 a 9, de
  osso). "00" com "0" vale 100.
- Dado que fica torto ou em cima de outro rola de novo (um pulinho para o lugar mais livre da
  mesa); depois de dois pulinhos, é solto de novo num lugar livre. Dado deitado e quase parado é
  segurado. Isso só apressa o fim: o número continua vindo da face.
- Com mais de 4 dados o lançamento é mais suave. Tempos medidos até o resultado (mediana): 2 a
  3 s até 6 dados; uns 4 s com 8 dados misturados com d12.

**Regras de Call of Cthulhu, 7ª edição (só no tema Arkham, em `rules.js`)**
- Crítico: d100 = 01 ("Sucesso crítico"). Desastre: d100 = 100. Sem o valor da perícia não dá
  para usar o desastre de 96 a 100 das perícias abaixo de 50 (veja as ideias para o futuro).
- Dados de bônus e de penalidade (até 2 de cada): cada um é mais um d10 de dezenas na mesa. O
  bônus fica com o menor resultado e a penalidade com o maior, sempre contando "00 + 0 = 100". A
  tela mostra todas as dezenas, com as descartadas riscadas e os dados delas apagados na mesa.
  Crítico e desastre olham o resultado final. Depois de cada lançamento a escolha volta a Normal.
- 1d3: rolado com um d6 de pedra (para não confundir com os d6 comuns); 1-2 vale 1, 3-4 vale 2
  e 5-6 vale 3. O resultado mostra a conversão ("5→3") e lembra a regra.
- Atalhos prontos: 3d6 (FOR CON DES APA POD), 2d6+6 (TAM INT EDU), 1d3 (soco), 1d4, 1d6, 1d10.

**Vários dados** (`src/core/formula.js`)
- Fórmula = grupos de dados iguais mais um número fixo (de −99 a +99). Limite de **8 dados** na
  mesa: com 10, a mesa do celular vira um amontoado e o resultado passa de 7 s.
- O d100 nunca entra numa fórmula; fica à parte, com bônus e penalidade.
- Resultado: o total grande e a conta embaixo ("5 + 3 + 6 = 14"), com a fórmula.
- Favoritas: até 12, guardadas no aparelho (`localStorage`), separadas entre oficial e teste.

**Montar e trocar dados** (`tapKind` em `src/main.js`; desenho de Weberson para a 1.1)
- **Modo dado único** (ao abrir e depois do ×): um toque em outro dado troca; toque duplo em
  outro dado soma os dois e entra no modo montagem; tocar no dado já escolhido soma mais um e
  entra no modo montagem; − e + também entram no modo montagem.
- **Modo montagem**: todo toque num dado soma; o d100 troca e sai do modo; o × sai do modo e
  volta a um dado só (o último tocado); depois de lançar, a fórmula continua montada.
- Toque duplo = dois toques no mesmo dado em menos de 350 ms (no mouse vale também o clique
  duplo do sistema). O primeiro toque já troca na hora, sem esperar; se o segundo vier, o dado
  que estava afundando volta para o mesmo lugar e os dois ficam somados. Consequência, explicada
  e aceita ("pela velocidade"): para ir de 1d4 a 2d20 é preciso uma pausa entre os dois toques.
- Saindo do d100, o toque duplo começa a montagem só com aquele dado. Atalhos de um dado só
  deixam no modo dado único; os de vários dados entram no modo montagem. Ao abrir o app, uma
  fórmula montada volta no modo montagem.
- Indicação do modo montagem: a fórmula acende e a legenda muda de "fórmula" para "somando"; o ×
  só fica ativo no modo montagem.

**Tema separado da mecânica**
- `src/core/` (física, formas, fórmulas, tela) vale para qualquer tema. `src/themes/arkham/` tem
  o visual, os sons, os textos e as regras do jogo (`rules.js`).
- O que um tema oferece (`theme.js`): `id`, `title`, `css`, `fonts`, `texts`, `view`,
  `createScene`, `createAudio`, `dieMaterial`, `dimDie`, `critical(setId, result)`, `modes`
  (rolagens especiais por conjunto: `'d100'` ou a fórmula sem espaços, como `'1d20'`), `kinds`
  (dados a mais, como o d3), `shortcuts` e `haptics`.
- O caminho para vantagem e desvantagem de D&D (2d20, fica o maior ou o menor) está pronto e
  explicado no README ("Rolagens especiais"), e foi testado.

**Atualizações e os dois endereços**
- O `sw.js` guarda cada versão inteira (`dados-de-arkham-v<RELEASE>` no oficial,
  `dados-de-arkham-teste-v<RELEASE>` no teste) e o app sempre abre dela. A versão nova é baixada
  com `?v=<RELEASE>` (para o GitHub mandar o arquivo recém-publicado, e não uma cópia de até 10
  minutos atrás), tudo ou nada. Quando ela assume, a página recarrega antes do primeiro toque ou
  quando sai da tela; página que abriu quebrada recarrega na hora. O registro do `sw.js` fica no
  `index.html`, e não no `main.js`, para funcionar mesmo se o app quebrar.
  - Por quê: no teste da 1.1, o Chrome do PC mostrou a ★ e os botões + e − sem responder. O
    `sw.js` antigo buscava cada arquivo na internet, e logo depois de um envio o GitHub ainda
    servia alguns arquivos antigos, misturando versões.
- **Suba o `RELEASE` do `sw.js` a cada envio que mude o app**; sem isso os aparelhos não baixam
  a versão nova. Arquivo novo do app entra em `APP_FILES`.
- Oficial e teste ficam no mesmo site (webersoncosta.github.io) e não se misturam: caminhos
  diferentes, manifesto próprio do teste (`manifest-teste.webmanifest`, "Arkham Teste", outro
  `id`), cópias guardadas com nomes diferentes (cada um só apaga as suas) e preferências
  separadas (`arkham-dice-prefs` e `arkham-dice-prefs-teste`). O `index.html` descobre onde está
  pelo caminho e marca `data-place` (`oficial`, `teste` ou `local`).
- O número no canto: `vX.Y` no oficial (`v1.1`); `vX.Y · teste N` no teste, em que N é o
  `RELEASE` (`v1.1 · teste 5`).

**Mesa compartilhada: o servidor** (`server/`; o plano e o porquê em `docs/plano-mesa-compartilhada.md`)
- Cloudflare Workers + Durable Objects (SQLite), plano gratuito. Cada sala é um Durable Object
  (`Room`, em `worker.js`), achado pelo código (`idFromName`). As regras ficam em `room.js`, sem
  nada do Cloudflare, para testar com `node --test`.
- Código da sala: 6 caracteres de `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sem 0, O, 1, I e L).
  Lugares: `g` (o Guardião, quem criou a sala) e `j1` a `j6`, na ordem de entrada. O mesmo
  aparelho volta sempre para o mesmo lugar.
- Aparelho: o app sorteia uma chave (22 a 64 caracteres, base64url) e a guarda só nele; o
  servidor guarda só o SHA-256 dela, e a chave nunca volta em mensagem nenhuma.
- Conversa: `POST /rooms` cria a sala (`{ protocol, device, name }` → `{ code }`); `/rooms/<código>`
  é o WebSocket. Primeira mensagem do app: `hello` (`{ protocol, device, name, app }`); resposta:
  `room` (o lugar, os membros e as últimas 100 rolagens, já filtradas). Depois chegam `members`,
  `roll`, `outdated`, `error` e `ended`; o app manda `roll` e, o Guardião, `end`. `PROTOCOL` (hoje
  1) muda quando app e servidor deixam de se entender (o `hello` é recusado com `version`). "ping"
  recebe "pong" sem acordar a sala.
- Versão do app (passo 5): o `hello` leva `app` (o `VERSION` de `src/version.js`, como '1.2';
  sem ele, ou fora do formato, conta como '0.0'), guardado junto com o lugar na conexão
  (`serializeAttachment({ seat, app })`). A cada chegada, quem está conectado com uma versão mais
  velha que a mais nova da mesa recebe `{ type: 'outdated', newest }` (`compareVersions` compara
  número, então 1.10 vem depois de 1.9). Só a versão publicada conta: os envios de teste da mesma
  versão não se avisam.
- Rolagem: `{ id, vis, set, name, total, text, label?, detail?, note?, pieces? }`. `set` é
  `'d100'` ou a fórmula sem espaços (`'2d6+6'`; guardada com `-` comum no lugar de `−`). O
  servidor confere o formato, recusa total fora do mínimo e do máximo da fórmula (`impossible`) e
  secreta de jogador (`guardian-only`); a privada do Guardião vira secreta. O crítico não viaja:
  cada app calcula com o seu tema. A mesma `id` mandada de novo conta uma vez só.
- Quem vê o quê (`seenBy`): aberta, todos; privada, quem rolou e o Guardião; secreta, só o
  Guardião. Para os outros vai só `{ id, seq, seat, at, vis }`, uma lista fechada de campos.
- A sala se apaga (`deleteAll()`) 6 horas depois do último `hello` ou `roll` (o alarme;
  `IDLE_SECONDS`) ou no `end` do Guardião. Um código que não existe não grava nada: as tabelas
  só nascem no `create`.
- Pelo navegador, só a origem do app passa (`ORIGINS`; na mesa de teste, também localhost). Sem
  registros no Cloudflare (`observability` desligada) e sem métricas do wrangler
  (`send_metrics = false`).
- O wrangler roda por `npx wrangler@4.151.3` (versão fixa): fica no cache do npm, fora do
  OneDrive, e o projeto não tem `node_modules`.

**Mesa compartilhada: o app** (`src/core/room-link.js`, `src/room-panel.js`, `src/room-log.js` e
`src/room-label.js`)
- `room-link.js` (mecânica, sem tela): `createRoom` (POST com corpo em texto simples, para o
  navegador não fazer a consulta prévia de CORS) e `connect`, que manda o `hello`, guarda um
  "ping" a cada 25 s (sem "pong" em 8 s, abre outra conexão), tenta de novo depois de 0,5, 1, 2,
  4, 8 e 15 s, e reconecta na hora quando o app volta para a tela ou a internet volta. Recusa na
  entrada (`room-not-found`, `room-full`, `version`, `name`, `invalid`) e `ended` encerram a
  ligação (`final: true`). Medido: uma queda é percebida na hora e a conexão volta em ~1 s.
- `room-panel.js` (a tela): o servidor vem do `PLACE` (`oficial` → mesa oficial; `teste` e
  `local` → mesa de teste). Guardado no aparelho em `arkham-mesa` (no teste, `arkham-mesa-teste`):
  `{ device, name, room: { code, guardian }, labels }`. Ao abrir o app, volta sozinho para `room`.
  Fora do oficial, `?aba` no endereço faz da aba um aparelho à parte (tudo da mesa em
  `sessionStorage`), e o título da aba mostra quem é quem.
- Convite: `<endereço do app>#mesa=K7QX3M` (no fim do endereço, depois do `#`: não chega ao
  GitHub nem muda a cópia guardada). Abre o painel com o código preenchido, também com o app já
  aberto (`hashchange`), e sai do endereço depois de lido. No celular (toque e `navigator.share`)
  abre o compartilhar; no PC, copia o texto com o link.
- O Guardião entra com o nome `texts.guardian`; os nomes do papel e do personagem vêm do tema
  (`texts.guardian` = "Guardião", `texts.character` = "investigador"), porque são termos de Call
  of Cthulhu. "Sair da mesa" guarda o lugar; o "Encerrar a mesa" do Guardião (previsto para o
  passo 5, trazido antes porque o Guardião precisa de uma saída) pede confirmação e apaga a mesa.
- Cabeçalho: o título não quebra mais; em tela estreita os botões descem, e o "Mesa", último da
  fila, fica embaixo do "Som" e do "Ambiente". Medido em 375 e 360 px: título numa linha,
  subtítulo inteiro, cabeçalho de 58 para 78 px.
- Duas folhas e um painel: a folha de entrar/criar (no alto, por causa do teclado) fica aberta
  até a mesa responder ("Entrando na mesa…"; um erro aparece nela; fechar desiste de entrar). Dentro
  da mesa, o painel (código, convite, quem está, rolagens, sair) é uma gaveta no celular; com a
  tela a partir de 960 px de largura, fica à direita, sempre à vista (`body.docked`, `--side` =
  `clamp(280px, 26vw, 360px)`), e a mesa de dados, o cabeçalho, a bandeja e o resultado ocupam o
  resto (`stage.fit` usa a largura do `canvas`). No PC, o "Mesa" e o "Fechar" escondem e mostram o
  painel. Quem está na mesa virou uma fileira de etiquetas, para caber junto com as rolagens;
  cada etiqueta ocupa no máximo meia linha (passo 6: com a mesa cheia e nomes compridos, a lista
  ia a 7 linhas; com o limite, 4, e o painel do Guardião num notebook de 1366×640 passou de 2
  para 4 rolagens à vista). O nome inteiro aparece no histórico.
- Rolagens (passo 3): no toque que lança, `roomPanel.take()` pega o rótulo e quem vê
  (`{ label, vis, veil }`; null fora de uma mesa) e volta os dois ao padrão; quando os dados param,
  `showResult` → `roomPanel.share(table, roll)` manda `{ id, vis, label, set, total, text, detail,
  note, pieces }`: `note` é só a opção do d100 ("1 dado de bônus"), `pieces` as dezenas com as
  descartadas. O nome de quem rolou vem de
  `members`; o "2d6 + 6" é escrito a partir do `set` (o `name` do servidor corta em 40 letras);
  crítico e desastre são calculados em cada aparelho com `theme.critical`. A própria rolagem só
  entra no histórico quando a mesa devolve (o histórico é o que a mesa recebeu).
- Fila (passo 5): toda rolagem entra em `saved.pending` (`[{ at, msg }]`, até 20, guardada no
  aparelho) e sai quando a mesa a devolve. Enquanto espera, aparece no histórico em cima de todas,
  apagada, com "enviando…". A cada `room` (entrar, voltar de uma queda, abrir o app), as que a
  mesa já tem (pelo id, no histórico que ela manda) saem da fila e as outras vão de novo; a mesa
  conta uma rolagem repetida uma vez só. Sem conexão na hora de rolar: "Sem conexão: a rolagem vai
  para a mesa quando a conexão voltar". Se a conexão parecia aberta mas a mesa não devolve em 4 s,
  o app confere na hora (`link.check()`: um "ping"; sem "pong" em 8 s, abre outra conexão), em
  vez de esperar o próximo "ping" (até 33 s). Recusada pela mesa: sai da fila. Sair da mesa
  esvazia a fila. Testado: sem conexão, com o app fechado e aberto, com a confirmação perdida
  (não repete) e com a conexão morta sem avisar (volta em ~15 s).
- Aviso que fica perto da bandeja (`log.banner`, embaixo dos avisos que passam): "Sem conexão com
  a mesa · reconectando…" (com "· N rolagens esperando") quando a conexão some por mais de 3 s
  (as quedas rápidas passam sem aviso); "Versão nova do app · toque para atualizar" com o
  `outdated`; e, se a mesa recusar o `hello` com `version` ao voltar, "App desatualizado · toque
  para atualizar e voltar à mesa" (status `old`: a mesa e a fila continuam guardadas). Os dois de
  versão são botões: um toque recarrega a página, a versão nova chega pelo `sw.js` e o app volta
  sozinho para a mesa. Entrando pela folha, a recusa `version` continua sendo um erro na folha.
- Histórico (`room-log.js`): a mais nova em cima, até 100 (como o servidor); ao entrar ou voltar,
  o servidor manda tudo de novo. A rolagem de outra pessoa que acabou de chegar acende uma vez,
  quando aparece. Quem rolou e o rótulo ficam na mesma linha quando cabem; com um nome comprido,
  o rótulo desce inteiro para a linha de baixo ("· Ocultismo"; antes, sumia nas reticências).
- Quem vê (passo 4, em `room-panel.js`): um botão na linha perto da bandeja, que troca com um
  toque. Jogador: "Aberta" (padrão) ou "Privada"; Guardião: "Secreta" (padrão) ou "Aberta" (o
  Guardião não tem privada: para ele, a mesa já trata privada como secreta). Depois de cada
  lançamento volta ao padrão, como o bônus e o rótulo (decisão: um segredo nunca é revelado por
  esquecimento; se Weberson preferir que fique, é só não voltar). Privada e secreta ficam em
  vermelho (`--c-penalty`) e tracejadas: o botão, a marca no resultado ("Furtividade · privada"),
  a marca no histórico de quem vê e o aviso. O sinal de suspense (rolagem sem `total`, a lista
  fechada de campos do servidor) aparece como "?" e "Guardião rolou em segredo" / "Ana rolou só
  para o Guardião", no histórico e no aviso (o "?" pulsa). Testado com três abas, guardando tudo o
  que chegava ao aparelho de um jogador: nenhum número nem rótulo de rolagem que ele não podia ver,
  nem ao vivo nem no histórico mandado ao voltar.
- Aviso perto da bandeja: só das rolagens dos outros, ao vivo (não das que chegam ao voltar de uma
  queda); some em 5 s; até 3 empilhados. No celular, o botão "Rolagens" conta as que chegaram
  desde a última vez que o histórico esteve à vista (as que já estavam na mesa ao entrar contam
  como vistas).
- Rótulo (`room-label.js`): a linha "quem vê · Rótulo · Rolagens" aparece acima da bandeja só
  dentro de uma mesa (a área dos dados encolhe uns 44 px; `relayout` é chamado ao entrar e sair).
  O rótulo vai com a próxima jogada (pego no toque que lança, como o bônus) e se apaga; aparece
  também no resultado, acima do número. Escolhido, ele aparece no próprio botão, aceso; se faltar
  espaço na linha, é ele que encolhe (com reticências). Até 30 letras; os 8 últimos usados ficam
  em `saved.labels` (sem repetir, sem diferenciar maiúsculas). Sair da mesa apaga o rótulo e a
  escolha de quem vê.

## Fluxo: desenvolver, testar e publicar

- Repositório principal: https://github.com/WebersonCosta/Dados-de-Arkham (`main` = oficial,
  publicada pelo GitHub Pages; `desenvolvimento` = trabalho novo).
- Repositório do teste: https://github.com/WebersonCosta/Dados-de-Arkham-teste (só a `main`,
  publicada no endereço de teste; no git local, o atalho `teste`).
- A cada etapa: trabalhar na `desenvolvimento` → subir o `RELEASE` → commit → `git push origin
  desenvolvimento` → atualizar o teste com um commit novo por cima (comandos no README, "Para
  quem mexe no código") → conferir o endereço de teste no navegador (o canto mostra o envio
  novo; pode levar alguns minutos) → mandar o link e explicar como testar.
- Publicar, só depois do "pode publicar": a `main` vira cópia exata da `desenvolvimento`
  (`git restore --source=desenvolvimento ...`), commit "Versão X.Y", tag `vX.Y`, push da `main`
  e da tag, conferir o endereço oficial, voltar para a `desenvolvimento` e subir `VERSION`.
- Voltar a uma versão anterior ("volte o app oficial para a versão 1.0"): `git restore
  --source=vX.Y ...` na `main`, commit e push. Os comandos estão no README.
- Servidor da mesa (dentro de `server/`): a mesa de teste (`npm run deploy:teste`, que roda os
  testes das regras antes) vai junto com o envio para o endereço de teste que precisar dela;
  depois, o teste dos três aparelhos contra ela (`MESA_URL=... npm run test:mesa`). A mesa oficial
  (`npm run deploy:oficial`) só com o "pode publicar", junto com o app oficial.

## Testar no computador

- `python tools/servidor-local.py` → http://localhost:8766 (sem cópia guardada: cada mudança
  aparece na hora). Há uma configuração "dados" em `.claude/launch.json` (fora do git).
- `python tools/servidor-caminhos.py` → http://localhost:8767/Dados-de-Arkham-teste/ ou
  `/Dados-de-Arkham/`: como publicado, com a cópia guardada. Para testar uma atualização, suba o
  `RELEASE` e chame `registration.update()`; depois volte o número e apague as cópias e os
  registros de teste.
- Em `localhost` a página expõe `window.__dados` (`tapKind`, `setFormula`, `showResult`,
  `table`, `tick`…) para testes. Para simular a física rápido: pare o laço
  (`window.requestAnimationFrame = () => 0`), troque `__dados.stage.render` por uma função vazia
  e chame `__dados.tick(1/60)` quantas vezes precisar.
- No painel de navegador do Claude, se o painel estiver escondido, as capturas de tela podem vir
  atrasadas (tire duas). Os avisos "Blocked call to navigator.vibrate" nos testes são normais.
- Servidor da mesa: `npm test` (dentro de `server/`) testa as regras da sala sem servidor. O
  simulador local (`npm run local`, que usa o `workerd`) não abre neste PC: o Visual C++ do
  Windows é de 2017 (14.16) e o `workerd` quebra ao iniciar ("access violation"). Instalar o
  Visual C++ Redistributable mais novo (x64) resolveria; até lá, o teste dos três aparelhos roda
  contra a mesa de teste publicada.

## Ideias para o futuro

- **Outros temas**: por exemplo um de fantasia para D&D, com crítico no d20 (20 é crítico, 1 é
  falha) e vantagem/desvantagem (o exemplo está no README). Copiar `src/themes/arkham`, trocar
  visual, sons, textos e `rules.js`, e registrar o tema em `src/themes/index.js`.
- **Campo de perícia**: informar o valor da perícia (por exemplo 60) antes de rolar o d100, e o
  app mostrar o nível de sucesso da 7ª edição: crítico (01), extremo (até 1/5 da perícia),
  difícil (até a metade), normal (até a perícia), fracasso, e desastre (100, ou 96 a 100 quando
  a perícia é menor que 50). Entra na fase 5 da mesa compartilhada.
- **Mesa compartilhada**: virou a etapa atual (veja "Estado atual" e
  `docs/plano-mesa-compartilhada.md`).
