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

## Estado atual (30/10/2026)

| | Versão | Onde |
| --- | --- | --- |
| Oficial | **1.0** | `main` = tag `v1.0` (3ac132c), https://webersoncosta.github.io/Dados-de-Arkham/ |
| Em teste | **1.1**, ainda não publicada | `desenvolvimento`, https://webersoncosta.github.io/Dados-de-Arkham-teste/ (envio `teste 5`) |

A 1.1 tem: vários dados juntos (fórmulas como 2d6 + 6), o 1d3, atalhos e fórmulas favoritas,
os modos dado único e montagem, e as atualizações sem mistura de versões. Está esperando o teste
no celular e o "pode publicar". O Claude só testou nos navegadores do computador.

Depois de publicar a 1.1: na `desenvolvimento`, mudar `VERSION` em `src/version.js` para `1.2`.

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
- O número no canto: `v1.1` no oficial; `v1.1 · teste 5` no teste (5 é o `RELEASE`).

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

## Ideias para o futuro

- **Outros temas**: por exemplo um de fantasia para D&D, com crítico no d20 (20 é crítico, 1 é
  falha) e vantagem/desvantagem (o exemplo está no README). Copiar `src/themes/arkham`, trocar
  visual, sons, textos e `rules.js`, e registrar o tema em `src/themes/index.js`.
- **Campo de perícia**: informar o valor da perícia (por exemplo 60) antes de rolar o d100, e o
  app mostrar o nível de sucesso da 7ª edição: crítico (01), extremo (até 1/5 da perícia),
  difícil (até a metade), normal (até a perícia), fracasso, e desastre (100, ou 96 a 100 quando
  a perícia é menor que 50).
- **Mesa compartilhada**: os jogadores verem as rolagens uns dos outros em tempo real. O GitHub
  Pages só entrega arquivos; isso precisaria de um serviço online (como Firebase ou Supabase) ou
  de conexão direta entre os aparelhos, e de decidir quem vê o quê.
