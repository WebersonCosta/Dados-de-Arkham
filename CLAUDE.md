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

## Estado atual (14/11/2026)

| | Versão | Onde |
| --- | --- | --- |
| Oficial | **1.3**, publicada em 13/11/2026 | `main` = tag `v1.3` (fb4481a), https://webersoncosta.github.io/Dados-de-Arkham/; mesa oficial em https://mesa-arkham.mesa-arkham.workers.dev (a mesma da 1.2: o servidor não mudou) |
| Desenvolvimento | **1.4**: fase 3 da mesa compartilhada, versão enxuta (alertas do Guardião e tirar um lugar), em teste com Weberson | `desenvolvimento`; endereço de teste com o envio `teste 15`; a mesa de teste já tem o servidor novo (tirar um lugar) |

Versões publicadas (tags): `v1.0` (3ac132c), `v1.1` (94cafb6), `v1.2` (d41a027) e `v1.3` (fb4481a). A 1.1
trouxe: vários dados juntos (fórmulas como 2d6 + 6), o 1d3, atalhos e fórmulas favoritas, os modos
dado único e montagem, as atualizações sem mistura de versões e o número da versão no canto. A 1.2
trouxe a mesa compartilhada (fase 2), com os valores do investigador. A 1.3 trouxe a física nova dos
dados: menores (82%), sem tremor, empurrões mais raros e mais discretos, e a mesma física em
qualquer aparelho.

- Próximo envio para o teste: subir o `RELEASE` do `sw.js` para 16.
- **Trabalho atual (14/11/2026): fase 3 da mesa compartilhada, versão enxuta.** Depois da primeira
  sessão com o grupo, Weberson reviu as prioridades (o critério e a nova ordem estão em "Etapa
  atual", abaixo, e no plano) e pediu a fase 3 enxuta: alertas para o Guardião (SAN e PV, com
  lembretes da regra) e tirar um lugar da mesa, com a proteção no servidor. No envio `teste 15`, com
  a mesa de teste já atualizada (teste dos aparelhos: 28 de 28). Falta Weberson testar (PC como
  Guardião, celular ou abas com `?aba` como jogadores). Ao publicar, a mesa oficial vai antes
  (`server/` mudou: `npm run deploy:oficial` e o teste dos aparelhos contra ela). Veja "Mesa
  compartilhada: alertas e tirar um lugar".
- **A física dos dados (versão 1.3, publicada em 13/11/2026).** Weberson notou no celular dados
  tremendo quando quase parados e empurrõezinhos em dados quase parados; pediu menos empurrões e
  mais discretos, dados um pouco menores, sensação de mais peso e um painel de ajuste temporário
  (envio `teste 13`). Testou no celular e no PC (relatado em 13/11/2026): a redução do tamanho foi
  bastante benéfica, sem nenhum problema de 80% a 85%; não percebeu diferença no peso. Fixados
  tamanho 82% e peso 0 em `FEEL` (`src/core/physics.js`) e tirado o painel, no envio `teste 14`
  (veja "Dados e física"), e publicado com o "pode publicar" dele. Conferido no endereço oficial:
  v1.3, sem erros, e a mesa oficial respondendo (uma ligação a um código que não existe recebe
  `room-not-found`, sem gravar nada: um jeito seguro de ver se a mesa está no ar).
- A passagem da 1.0 para a 1.1 ainda dependeu do `sw.js` antigo (o da 1.0, que buscava cada
  arquivo na internet): nos primeiros minutos depois da publicação, quem abriu o app pode ter
  pegado uma página misturada e precisado fechar e abrir de novo. Da 1.1 em diante, as
  atualizações chegam inteiras.

**Etapa atual: mesa compartilhada.** O Guardião e até 6 jogadores rolando juntos, cada um no seu
aparelho, numa call do Discord. O plano de Weberson (sala com código, visibilidade aberta, privada
ou secreta protegida no servidor, o Guardião, a mesa ritual 3D e as 5 fases) está em
[`docs/plano-mesa-compartilhada.md`](docs/plano-mesa-compartilhada.md): leia antes de mexer nisso.
- **Prioridades revistas por Weberson em 14/11/2026**, depois da primeira sessão com o grupo (no
  plano, "Prioridades depois da primeira sessão", que vale mais que a lista de fases original):
  - **Critério para novas funcionalidades:** o jogo é por voz no Discord, então só vale construir o
    que faz algo que a voz não faz.
  - **Nova ordem** (na lista dele, itens 1 a 5; aqui, fases 3 a 7): 3. painel do Guardião, versão
    enxuta (alertas e remover lugar); 4. ficha, primeiro degrau (carregar a ficha em Markdown e ver
    no app; PDF só para ver); 5. ficha, segundo degrau (perícias tocáveis com nível de sucesso e
    contadores ligados à tabela "Valores derivados"); 6. documentos e pistas (imagens reveladas a
    todos ou a jogadores escolhidos, com a visibilidade que já existe, e um "apontar" na imagem);
    7. polimento e atmosfera (velas reagindo ao jogo, trilha sonora, efeitos do Guardião).
  - **Arquivada (não descartada):** a mesa ritual 3D. Na sessão, a aba de rolagens bastou.
  - **Ideias sem prioridade:** pedido de rolagem secreto do Guardião para um jogador; rolagem de
    grupo; rolar em segredo por um jogador com nível de sucesso (depende da ficha); teste de Sanidade
    guiado; Sorte do grupo (rola quem tem a menor Sorte); NPCs salvos para rolagens secretas;
    referência rápida de regras com texto próprio; criação guiada de personagem; outros temas e
    sistemas.
- Fase 1 (o plano) aprovada em 31/10/2026: as decisões e os 6 passos da fase 2 estão no fim do
  plano. Resumo: um servidor de salas no Cloudflare (Workers + Durable Objects, plano gratuito,
  sem cartão), JavaScript puro, sem biblioteca de interface.
- Fase 2, passo 1 (preparação, o app não mudou) pronto em 31/10/2026: o servidor em `server/`
  (veja "Mesa compartilhada: o servidor" abaixo). A mesa de teste está no ar em
  https://mesa-arkham-teste.mesa-arkham.workers.dev e passou no teste dos três aparelhos (12 de
  12, com o tempo sem uso reduzido a 20 s só para o teste). A mesa oficial está no ar desde
  06/11/2026 em https://mesa-arkham.mesa-arkham.workers.dev, criada com o "pode publicar".
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
- Fase 2, passo 6 (a sessão real no Discord, pelo endereço de teste) feito: Weberson, como
  Guardião, jogou uma sessão rápida com dois amigos só para testar as funções (as rolagens e a
  visão dos resultados), sem derrubar a internet de propósito, e não encontrou erro (relatado em
  06/11/2026; as quedas já tinham sido testadas no passo 5). Antes da sessão: a
  mesa cheia (o Guardião e 6 jogadores rolando ao mesmo tempo, na mesa de teste: cada rolagem
  chegou uma vez a cada um; o teste dos aparelhos agora tem esse caso, 13 de 13 com o da sala que
  se apaga sozinha pulado) e a tela com a mesa cheia e nomes compridos, que trouxe dois ajustes
  (envio `teste 10`): o rótulo que sumia no histórico e a lista de quem está na mesa, que tomava o
  lugar das rolagens. No envio `teste 11`, o convite que se perdia quando uma versão nova do app
  chegava logo depois de abrir o link (veja "Mesa compartilhada: o app").
- Risco conhecido para a sessão: cada navegador guarda a sua chave de aparelho. Quem entra por um
  caminho e volta por outro (no iPhone, o navegador de dentro do Discord, o Safari e o ícone na
  tela de início guardam coisas separadas) vira outro aparelho e ocupa mais um lugar, e ainda não
  dá para liberar um lugar (isso é do painel do Guardião, fase 3). Orientação dada: entrar e
  voltar sempre pelo link do convite; se a mesa encher, encerrar e criar outra.
- Valores do investigador (PV, SAN, Sorte e PM), pedidos por Weberson em 03/11/2026 antes da sessão
  real (envio `teste 12`): testados e aprovados por ele, com o PC como Guardião e o celular como
  jogador (relatado em 06/11/2026). A mesa de teste passou no teste dos aparelhos (22 de 22; o da
  sala que se apaga sozinha fica pulado). O
  pedido e a ideia da ficha do personagem estão no plano. Ficaram para depois: alertas para o
  Guardião, o painel completo e outras regras da mesa.
- Versão 1.2 publicada em 06/11/2026, com o "pode publicar" de Weberson. Primeiro a mesa oficial
  (`npm run deploy:oficial`; nos primeiros instantes o Cloudflare respondeu "error code: 1042" e
  logo passou), testada com os aparelhos simulados (22 de 22; outras origens recebem 403), e depois
  o app. Os valores do investigador guardados no endereço de teste não passam para o oficial (cada
  endereço guarda os seus).
- Fase 3, versão enxuta (pedida em 14/11/2026): alertas para o Guardião e tirar um lugar, no envio
  `teste 15` (veja "Trabalho atual", acima).

## Decisões tomadas (e por quê)

**Dados e física**
- O resultado é sempre a face que ficou para cima depois da física (cannon-es); nada é sorteado
  antes. As faces saem por igual (teste de qui-quadrado normal em milhares de lançamentos).
- d4 a d20, e o d100 feito de **dois d10**: dezenas (00 a 90, de pedra) e unidades (0 a 9, de
  osso). "00" com "0" vale 100.
- Dado que fica torto ou em cima de outro rola de novo. O primeiro empurrão é o menor que
  costuma resolver: escorado na borda ou num vizinho, um pulinho baixo para longe do apoio e para
  o lado mais livre; em cima de outro dado, rola para fora; de pé numa aresta, só na mesa, uma
  inclinada. Os dois seguintes são pulinhos de verdade para o lugar mais livre; depois, o dado é
  solto de novo num lugar livre. Escorado e parado (0,2 s) o empurrão vem logo, enquanto os
  outros ainda assentam; torto e se mexendo devagar, depois de 1 s. Dado deitado e quase parado
  dorme (`body.sleep()`: fica parado de vez até outro dado bater nele com força). Isso só apressa
  o fim: o número continua vindo da face.
- Com mais de 4 dados o lançamento é mais suave.
- A física da versão 1.3 (13/11/2026; o que se descobriu, com a ferramenta `tools/medir-dados.js`):
  - Tremor: a biblioteca devolvia quique de qualquer toque. A cada passo a gravidade dá ao dado
    parado uns 0,4 de velocidade, e a mesa devolvia isso como um pulinho: o dado quase parado
    tremia. Agora, no contato com a mesa, abaixo de 1,2·`pace` de velocidade de aproximação o
    quique é zero (`world.solver.solve` embrulhado). Entre dados e na borda o quique fica: sem
    ele, os dados ficavam mais escorados (medido).
  - Ritmo da tela: a física já andava em passos fixos de 1/120 s, mas a biblioteca
    (`world.step(dt, tempo, max)`) desiste dos passos quando um quadro passa de 8,3 ms de física,
    e os relógios do lance (`track`) contavam o tempo da tela uma vez por quadro. Num celular
    lento, ou num pico (no PC houve passos de 5 a 46 ms), os dados andavam em câmera lenta e os
    relógios corriam. Agora `step` faz os passos ele mesmo (até 8 por quadro), `track` roda a
    cada passo com o tempo da física e o desenho fica entre os dois últimos passos.
  - Tamanho e peso (`FEEL`, `setFeel`): `size` multiplica a forma da física e o desenho (`mesh.scale`
    em `syncMeshes`); `weight` de 0 (como na 1.2) a 10 muda gravidade (34 a 60), quique e atrito da
    mesa, freio do giro e do movimento; o lançamento acompanha a gravidade (`pace` = √(g/34)),
    para os dados ainda atravessarem a mesa. Dados e borda continuam lisos. Fixados em 13/11/2026:
    tamanho 82% e peso 0 (veja "A escolha", abaixo).
  - No envio `teste 13` (a proposta: 88% e peso 4), medido na mesa do PC (mediana até o resultado;
    lances com empurrão), antes → depois: d6 1,78 s → 1,47 s (2,3% → 4,6%); d20 2,67 → 2,08 s (5%
    → 4%); d100 com 2 de bônus 2,87 → 2,25 s (25% → 27%); 8d6 3,2 → 2,3 s (62% → 66%, tirados do
    lugar 0,18 → 0,18 por lance); 8 misturados 3,95 → 2,83 s (68% → 69%; tirados 0,37 → 0,2 por
    lance). Tremor (segundos de pulinhos por lance) de 0,08 → 0,01 com 1 dado e de 0,9 → 0,2 com 8.
    Mais peso deixa mais dados escorados (eles quicam menos e param onde caem): peso 9 tem o dobro
    de empurrões do peso 3. Experimentos que pioraram e foram desfeitos: rampinha no pé da borda e
    borda inclinada para fora (o dado fica mais escorado), empurrão leve repetido (com muitos
    dados, falha na metade).
  - A escolha (13/11/2026). Weberson testou o painel no celular e no PC: a redução do tamanho foi
    bastante benéfica, sem nenhum problema de 80% a 85%; não percebeu diferença no peso. Medido de
    500 a 1.000 lances de cada conjunto (d6, 3d6, d20, d100, d100 com 2 de bônus, 8d6 e 8
    misturados, `2d4+2d6+2d10+2d20`) em cada combinação (80%, 82% e 84% com pesos 0, 2 e 4; 82% com
    1 e 3): o peso muda mais que o tamanho. Na média dos 7 conjuntos, lances com empurrão: 23% com
    peso 0, 25% com 2, 27% com 4 (24,8% na 1.2), e o resultado 10%, 17% e 23% mais rápido que na
    1.2; de 80% a 84%, de 24,6% a 25,8%. Ficou 82% (o meio do que Weberson achou ideal) e peso 0
    (menos empurrões, o pedido dele, e ainda mais rápido que na 1.2). Com 82% e peso 0, contra a
    1.2: d6 1,83 s (1,77) e 2,9% com empurrão (4%); 3d6 2,05 s (2,0) e 12,8% (12%); d20 2,42 s
    (2,65) e 3,1% (4%); d100 2,4 s (2,63) e 9,7% (10%); d100 com 2 de bônus 2,53 s (2,85) e 22,8%
    (26,3%); 8d6 2,38 s (2,98) e 44% (56%), tirados do lugar 0,09 por lance (0,16); 8 misturados
    2,98 s (3,75) e 61% (62%), tirados 0,19 por lance (0,36). Tremor: 0,02 s por lance com 1 dado,
    0,23 com 8. A 1.2 foi medida com menos lances (de 200 a 400): a mesma medição feita duas vezes
    deu, por exemplo, 56% e 62% no 8d6.
  - Justiça conferida com o qui-quadrado, com 82% e peso 0 (de 1.500 a 3.000 lances): d4 p=0,82;
    d6 0,39; d8 0,87; d10 0,09; d12 0,12; d20 0,42; d100 dezenas 0,60 e unidades 0,98; d100 com 2
    de bônus, dezenas 0,42 e unidades 0,48. (No envio `teste 13`: d4 0,69; d6 0,25; d8 0,10; d10
    0,14; d12 0,67; d20 0,14; d100 0,58 e 0,84; com 2 de bônus, 0,26 e 0,89.)
- O painel de ajuste temporário (`src/tune-panel.js`, aberto com `?ajuste` fora do oficial: tamanho
  e peso, "Padrão", "Como era" e o tempo e os empurrões de cada lance) ficou só no envio `teste
  13` e saiu no `teste 14`, depois da escolha (está no histórico, no commit 0f84d50). Para
  comparar outros valores no computador: `__dados.table.setFeel({ size, weight })` e
  `tools/medir-dados.js`.

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
  (dados a mais, como o d3), `shortcuts`, `counters` (os valores do personagem na mesa
  compartilhada: `{ id, short, name }`), `alerts(change, memory)` (o que esses valores avisam ao
  Guardião; veja "Mesa compartilhada: alertas e tirar um lugar") e `haptics`.
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
  Lugares: `g` (o Guardião, quem criou a sala) e `j1`, `j2`… na ordem de entrada, até 6 jogadores
  ao mesmo tempo. O mesmo aparelho volta sempre para o mesmo lugar. O número de um lugar nunca se
  repete numa mesa (`nextSeat`: o maior já usado mais 1): quem chega depois de um lugar tirado pelo
  Guardião não herda as rolagens privadas dele.
- Aparelho: o app sorteia uma chave (22 a 64 caracteres, base64url) e a guarda só nele; o
  servidor guarda só o SHA-256 dela, e a chave nunca volta em mensagem nenhuma.
- Conversa: `POST /rooms` cria a sala (`{ protocol, device, name, rules }` → `{ code }`);
  `/rooms/<código>` é o WebSocket. Primeira mensagem do app: `hello` (`{ protocol, device, name, app,
  join? }`; `join: true` só quando a pessoa entrou de propósito, pela folha com o código); resposta:
  `room` (o lugar, as regras, os membros e as últimas 100 rolagens, já filtrados). Depois chegam
  `members`, `roll`, `counters`, `outdated`, `removed`, `error` e `ended`; o app manda `roll`, o
  jogador manda `counters` (os dele) e o Guardião manda `remove` (`{ seat }`) e `end`. `PROTOCOL` (hoje
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
- Contadores (os valores do investigador): `{ type: 'counters', counters: { hp: { max, cur }, … } }`,
  só de jogador (o Guardião recebe `players-only`) e sempre do lugar da conexão: a mensagem não diz
  de quem são. O servidor confere só o formato (`readCounters`: até 8, máximo de 1 a 999, atual de 0
  ao máximo); quais são é o tema do app que diz. Ficam em `seats.counters` (JSON; null sem nenhum).
  A regra da mesa vem no `POST /rooms` e fica em `room.rules` (`cleanRules`; `counters`: `guardian`,
  o padrão, ou `all`). `seesCounters`: o próprio, o Guardião e, com `all`, todos. Quem vê recebe `{
  type: 'counters', seat, counters }` ao vivo (menos a conexão que mandou), e `members` e `room` são
  montados para cada lugar: para quem não vê, o campo `counters` nem existe. Os mesmos valores de
  novo não avisam ninguém, e mudar um contador conta como uso (`touch`).
- A sala se apaga (`deleteAll()`) 6 horas depois do último `hello` ou `roll` (o alarme;
  `IDLE_SECONDS`) ou no `end` do Guardião. Um código que não existe não grava nada: as tabelas
  só nascem no `create`.
- Pelo navegador, só a origem do app passa (`ORIGINS`; na mesa de teste, também localhost). Sem
  registros no Cloudflare (`observability` desligada) e sem métricas do wrangler
  (`send_metrics = false`).
- O wrangler roda por `npx wrangler@4.151.3` (versão fixa): fica no cache do npm, fora do
  OneDrive, e o projeto não tem `node_modules`.

**Mesa compartilhada: o app** (`src/core/room-link.js`, `src/core/counters.js`, `src/room-panel.js`,
`src/room-log.js`, `src/room-label.js` e `src/room-counters.js`)
- `room-link.js` (mecânica, sem tela): `createRoom` (POST com corpo em texto simples, para o
  navegador não fazer a consulta prévia de CORS) e `connect`, que manda o `hello`, guarda um
  "ping" a cada 25 s (sem "pong" em 8 s, abre outra conexão), tenta de novo depois de 0,5, 1, 2,
  4, 8 e 15 s, e reconecta na hora quando o app volta para a tela ou a internet volta. Recusa na
  entrada (`room-not-found`, `room-full`, `version`, `name`, `invalid`) e `ended` encerram a
  ligação (`final: true`). Medido: uma queda é percebida na hora e a conexão volta em ~1 s.
- `room-panel.js` (a tela): o servidor vem do `PLACE` (`oficial` → mesa oficial; `teste` e
  `local` → mesa de teste). Guardado no aparelho em `arkham-mesa` (no teste, `arkham-mesa-teste`):
  `{ device, name, room: { code, guardian }, labels, pending, characters }`. Ao abrir o app, volta
  sozinho para `room`.
  Fora do oficial, `?aba` no endereço faz da aba um aparelho à parte (tudo da mesa em
  `sessionStorage`), e o título da aba mostra quem é quem.
- Convite: `<endereço do app>#mesa=K7QX3M` (no fim do endereço, depois do `#`: não chega ao
  GitHub nem muda a cópia guardada). Abre o painel com o código preenchido, também com o app já
  aberto (`hashchange`). Sai do endereço quando a folha termina (entrou ou fechou), e não ao ser
  lido: se uma versão nova do app chega logo depois de abrir o link, a página recarrega antes do
  primeiro toque, e a folha precisa abrir de novo com o código (passo 6). Dentro de uma mesa, ou
  com um código que não vale, sai na hora. No celular (toque e `navigator.share`) abre o
  compartilhar; no PC, copia o texto com o link.
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
- Valores do personagem (`room-counters.js`; as contas em `core/counters.js`; a lista vem de
  `theme.counters`): um botão na linha perto da bandeja mostra os dois primeiros ("PV 9 · SAN 55";
  sem valores, "PV · SAN", aceso e pulsando) e abre a folha: − atual + e o máximo de cada um,
  embaixo, perto do polegar (ela sobe só enquanto um campo está em foco, por causa do teclado). O
  máximo vale ao sair do campo, e não a cada letra; o primeiro começa cheio, quem está cheio continua
  cheio e os outros só não passam do máximo novo; vazio ou 0 apaga o contador. − e + repetem
  segurando (`holdRepeat`, agora em `lib/util.js`), com `aria-disabled` em vez de `disabled`: um botão
  desligado no meio do toque não avisaria que o dedo saiu, e a repetição não pararia. Em tela até 400
  px, os quatro botões ficam mais justos (em 360 px cabem sem cortar; em 320 px, quem encolhe é o
  rótulo). O Guardião não tem o botão.
- Guardados em `saved.characters` (`{ chave do nome: { name, counters } }`, sem diferenciar
  maiúsculas): sobrevivem a sair da mesa e ao fim dela, e outro nome começa vazio. O aparelho é quem
  sabe os valores: a mesa os recebe a cada `room` (mudados sem conexão, ou de outro personagem) e, a
  cada mudança, no máximo a cada 300 ms (`shareCounters`). Quem entra pela folha com um personagem
  sem valores vai direto para a folha dos valores, em vez da gaveta da mesa.
- Ao criar a mesa (`askRules`): "Os jogadores veem os valores uns dos outros (PV, SAN, Sorte e PM)?",
  com "Não: só o Guardião vê" e "Sim: todos veem", sem padrão; a resposta já cria a mesa. A folha dos
  valores diz quem vê.
- Na lista de quem está na mesa: para quem vê os valores (o Guardião, ou todos com `all`), uma tabela
  (`renderValues`) com atual/máximo de cada um, e o título diz quem vê; para os outros, a fileira de
  etiquetas. O próprio jogador vê os valores do aparelho, que são os mais novos. Medido com a mesa
  cheia: 25 px por linha, tabela de 190 px; no notebook de 1366×640 sobram 201 px para as rolagens
  (de 3 a 4 à vista); o nome fica com 127 px no painel de 355 px e 83 px no de 280 px.

**Mesa compartilhada: alertas e tirar um lugar** (fase 3, versão enxuta, pedida em 14/11/2026;
`src/room-alerts.js`, `src/core/counter-watch.js`, `alerts` em `src/themes/arkham/rules.js`; o pedido
e o porquê no fim do plano)
- Alertas só no aparelho do Guardião, com os valores que a mesa já entrega a ele (`room`, `members`,
  `counters`): nada novo no servidor, nada para os jogadores. `room-panel.js` passa os valores dos
  jogadores a `alerts.see(seat, counters)` só quando `room.you === 'g'`.
- Toques seguidos (`counter-watch.js`, `QUIET` = 4 s): cada valor de cada lugar abre uma mudança no
  primeiro toque (`state.from`) e ela termina quando o valor fica 4 s sem mudar; vai do valor de
  antes do primeiro toque ao de depois do último. `state.top` guarda o maior valor da sessão (recomeça
  no primeiro valor visto e num máximo novo). Tudo em `saved.alerts` (`{ code, watch, memory,
  entries }`, ligado ao código da mesa): o app aberto de novo no meio de uma mudança a continua, e o
  que mudou com o Guardião fora conta como uma mudança. Sai ao encerrar a mesa (`alerts.clear()`).
- As regras (`alerts(change, memory)`, no tema): só perdas com o mesmo máximo (mexer no máximo é
  acerto da ficha). SAN: 0 → permanente (só esse lembrete); perdeu `top − atual` ≥ um quinto do `top`
  → indefinida (uma vez por jogador na mesa, `memory.indefinite`); perda ≥ 5 → teste de INT. PV: perda
  ≥ metade do máximo → ferimento grave (`memory.wounded`); 0 → morrendo se esta perda foi ferimento
  grave ou se já houve um na mesa, senão inconsciente, mais o lembrete da morte por um golpe do PV
  máximo (o PV não desce abaixo de zero). Metades e quintos arredondam para baixo (com mínimo 1).
  Textos próprios, curtos; quem decide é o Guardião. Testes em `tests/alertas.test.js` (relógio de
  mentira).
- Regras conferidas em 14/11/2026 nas páginas de regras da Chaosium (cocwiki.chaosium.com: Sanity;
  Hit Points, Wounds and Healing) e em fontes secundárias (indefinida e permanente não estão nas
  páginas grátis). Avisado a Weberson como incerto: a base da indefinida ("SAN atual" num mesmo dia de
  jogo: o começo do dia?) e o arredondamento da metade com PV máximo ímpar.
- Tela: avisos logo abaixo do cabeçalho (`#alerts`, dentro do `.hud-top`, por cima da faixa das velas),
  o mais novo em cima, até "Entendi"; à vista até 3 no PC e 1 até 600 px de largura (os outros
  esperam, com "mais N alertas esperando"); até 6 esperando. O jogador com aviso à vista fica em
  vermelho com "!" na lista (`is-alert`); valores em zero ficam em vermelho na tabela. No histórico,
  `log.notes()` põe os alertas entre as rolagens (logo acima da última que tinha chegado, `after`),
  com "!" e "só você vê"; até 60 guardados.
- Tirar um lugar: o botão "Tirar alguém", ao lado de "Na mesa", só para o Guardião, mostra o × de
  cada jogador (sempre à vista, ele apertava demais os nomes no painel); o × pede `confirm` e manda
  `{ type: 'remove', seat }`. O servidor confere que é o Guardião (`guardian-only`) e que é um lugar
  de jogador ativo (`invalid`), muda o papel para `removed` (fica o nome, para o histórico; os valores
  saem) e manda `{ type: 'removed' }` às conexões daquele lugar, que são desligadas. Qualquer mensagem
  de um lugar que não está mais ativo é recusada com `removed`. No `hello`, o aparelho de um lugar
  tirado só entra com `join: true` (e com vaga: senão continua marcado e não volta sozinho quando abrir
  uma); aí o lugar antigo perde o aparelho (`removed:jN`) e ele senta num lugar novo. O app trata
  `removed` (mensagem ou erro) como final: esquece a mesa e avisa "O Guardião tirou você desta mesa".
  Na lista, os lugares `removed` não aparecem, mas continuam em `members` para o histórico dizer quem
  rolou.

## Fluxo: desenvolver, testar e publicar

- Repositório principal: https://github.com/WebersonCosta/Dados-de-Arkham (`main` = oficial,
  publicada pelo GitHub Pages; `desenvolvimento` = trabalho novo).
- Repositório do teste: https://github.com/WebersonCosta/Dados-de-Arkham-teste (só a `main`,
  publicada no endereço de teste; no git local, o atalho `teste`).
- A cada etapa: trabalhar na `desenvolvimento` → subir o `RELEASE` → commit → `git push origin
  desenvolvimento` → atualizar o teste com um commit novo por cima (comandos no README, "Para
  quem mexe no código") → conferir o endereço de teste no navegador (o canto mostra o envio
  novo; pode levar alguns minutos) → mandar o link e explicar como testar.
- O guia de uso (`docs/guia-de-uso.md`, pedido por Weberson em 31/10/2026) descreve, para quem
  usa, as funções e as limitações atuais. Atualizá-lo junto com o README a cada etapa que mude o
  que o app faz, inclusive a data e as versões do alto e a tabela de versões.
- Publicar, só depois do "pode publicar": a `main` vira cópia exata da `desenvolvimento`
  (`git restore --source=desenvolvimento ...`), commit "Versão X.Y", tag `vX.Y`, push da `main`
  e da tag, conferir o endereço oficial, voltar para a `desenvolvimento` e subir `VERSION`. Da 1.2
  em diante, a mesa oficial vai antes (`npm run deploy:oficial` e o teste dos aparelhos contra ela,
  com `MESA_ORIGEM=https://webersoncosta.github.io`, a única origem que ela aceita), para o botão
  "Mesa" do app oficial já encontrá-la. Um servidor recém-criado pode responder "error code: 1042"
  por alguns instantes. Isso só quando `server/` mudou desde a última publicação (`git diff --stat
  vX.Y desenvolvimento -- server/`); na 1.3 não mudou, e a mesa oficial ficou como estava.
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
- `tools/medir-dados.js` (no console de http://localhost:8766): centenas de lances direto na
  física, com tempo até o resultado, empurrões e o motivo de cada um, tremor, custo de cada passo,
  um celular imitado (`celular: 12`) e o qui-quadrado (`justica: true`). Os lances rodam sem pausa:
  com o painel de navegador escondido, a página fica lenta para as pausas, e uma chamada passa de
  45 s com muitos lances (divida). Outro tamanho ou peso: `__dados.table.setFeel({ size, weight })`
  antes. Para medir muito: abrir duas ou três abas do localhost e, em cada uma, rodar os lotes em
  segundo plano, com uma pausa de `MessageChannel` entre eles (as pausas de `setTimeout` de uma
  aba escondida demoram), guardando os resultados numa variável da página para ler depois; uma
  aba ocupada só responde quando o lote dela termina.
- No painel de navegador do Claude, se o painel estiver escondido, as capturas de tela podem vir
  atrasadas (tire duas). Os avisos "Blocked call to navigator.vibrate" nos testes são normais.
- Alertas do Guardião: `node --test tests/alertas.test.js` (na pasta do projeto; o Node 24 lê os
  arquivos do app como módulos sem precisar de package.json). No navegador: uma aba com `?aba` cria
  a mesa (Guardião) e outras com `?aba` entram; o − e o + respondem a `click()` (o `holdRepeat` aceita
  o clique sem `detail`), e o `confirm` do "Tirar alguém" pode ser trocado por `() => true`.
- Servidor da mesa: `npm test` (dentro de `server/`) testa as regras da sala sem servidor. O
  simulador local (`npm run local`, que usa o `workerd`) não abre neste PC: o Visual C++ do
  Windows é de 2017 (14.16) e o `workerd` quebra ao iniciar ("access violation"). Instalar o
  Visual C++ Redistributable mais novo (x64) resolveria; até lá, o teste dos três aparelhos roda
  contra a mesa de teste publicada.

## Ideias para o futuro

- **Outros temas**: por exemplo um de fantasia para D&D, com crítico no d20 (20 é crítico, 1 é
  falha) e vantagem/desvantagem (o exemplo está no README). Copiar `src/themes/arkham`, trocar
  visual, sons, textos e `rules.js`, e registrar o tema em `src/themes/index.js`.
- **Nível de sucesso**: o nível de sucesso da 7ª edição no d100: crítico (01), extremo (até 1/5 da
  perícia), difícil (até a metade), normal (até a perícia), fracasso, e desastre (100, ou 96 a 100
  quando a perícia é menor que 50). Desde 14/11/2026 entra com a ficha, no segundo degrau (fase 5 da
  nova ordem: perícias tocáveis com nível de sucesso), e não mais como um campo à parte.
- **Mesa compartilhada**: virou a etapa atual (veja "Estado atual" e
  `docs/plano-mesa-compartilhada.md`). A mesa ritual 3D ficou arquivada em 14/11/2026, e as ideias
  sem prioridade (rolagem de grupo, teste de Sanidade guiado, Sorte do grupo…) estão em "Etapa
  atual".
- **Ficha do personagem** (Markdown, que os contadores leem e atualizam, e PDF, só para ver): as
  fases 4 e 5 da nova ordem. O pedido e como a ficha entra sem refazer os contadores estão no plano.
  Os alertas para o Guardião já foram feitos (fase 3, versão enxuta).
