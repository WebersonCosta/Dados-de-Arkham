# Plano: mesa compartilhada

Plano definido por Weberson em 30/10/2026, guardado aqui como ele escreveu. O objetivo: o Guardião
e até 6 jogadores rolarem dados juntos durante uma sessão de Call of Cthulhu (7ª edição), cada um
no seu celular ou PC. O uso principal será numa call do Discord entre amigos.

Andamento: fase 1 (plano) aprovada em 31/10/2026. Fase 2, passo 1 (preparação) pronto em
31/10/2026: a mesa de teste está no ar e passou no teste dos três aparelhos. Passo 2 (entrar na
mesa), passo 3 (rolagens ao vivo, com rótulo), passo 4 (privada, secreta e suspense) e passo 5
(quedas e encerramento) testados e aprovados por Weberson em 31/10/2026. Antes do passo 6, em
03/11/2026, entrou a versão mínima dos valores do investigador (PV, SAN, Sorte e PM), testada e
aprovada por Weberson. Passo 6 (a sessão real no Discord) feito: Weberson, como Guardião, jogou uma
sessão rápida com dois amigos para testar as funções e não encontrou erro (relatado em 06/11/2026).
**A fase 2 foi publicada na versão 1.2, em 06/11/2026, junto com a mesa oficial.** As decisões, os passos da fase 2, os valores
e a ideia da ficha do personagem estão no fim deste arquivo.

Em 14/11/2026, depois da primeira sessão com o grupo, Weberson reviu as prioridades (a seção logo
abaixo vale mais que a lista de fases original). **A fase 3, o painel do Guardião em versão enxuta
(alertas e remover lugar), foi publicada na versão 1.4, em 14/11/2026, junto com a mesa oficial
atualizada** (veja o fim do arquivo).

## Prioridades depois da primeira sessão (14/11/2026)

Revistas por Weberson depois da primeira sessão com o grupo.

**Critério para novas funcionalidades:** jogamos por voz no Discord, então só vale construir o que
faz algo que a voz não faz.

**Nova ordem das fases.** Na lista de Weberson são os itens 1 a 5; como as fases 1 (o plano) e 2 (a
sala) já foram feitas, aqui eles viram as fases 3 a 7:

3. **Painel do Guardião, versão enxuta** (esta etapa): alertas e remover lugar.
4. **Ficha, primeiro degrau:** carregar a ficha em Markdown e ver dentro do app; PDF só para
   visualizar.
5. **Ficha, segundo degrau:** perícias tocáveis com nível de sucesso e contadores ligados à tabela
   "Valores derivados" da ficha em Markdown.
6. **Documentos e pistas:** o Guardião carrega imagens (mapas, cartas, fotos) e revela para todos ou
   para jogadores específicos, usando a visibilidade que já existe; com um "apontar" num ponto da
   imagem.
7. **Polimento e atmosfera:** velas da cena atual reagindo ao jogo (rolagem secreta, perda de
   Sanidade), trilha sonora e efeitos do Guardião.

**Ideia arquivada (não descartada):** a mesa ritual 3D com a visão de toda a mesa. Na sessão, a aba
de rolagens foi suficiente.

**Ideias para o futuro, sem prioridade:** pedido de rolagem secreto do Guardião para um jogador;
rolagem de grupo; rolar em segredo por um jogador com nível de sucesso (depende da ficha); teste de
Sanidade guiado; Sorte do grupo (rola quem tem a menor Sorte); NPCs salvos para rolagens secretas;
referência rápida de regras escrita com texto próprio; criação guiada de personagem; outros temas e
sistemas.

## Sala e entrada

- O Guardião cria a sala e passa um código; jogadores entram com ele, sem cadastro.
- Até 6 jogadores mais o Guardião.
- Cada jogador entra só com o nome do investigador. Nenhum dado pessoal real.
- Identificador anônimo do aparelho para reconexão automática de quem cair.
- Sala de sessão: apagada automaticamente após algumas horas sem uso.
- Nome do investigador e regras do Guardião ficam salvos no aparelho de cada um.
- Sem turnos: qualquer um rola quando quiser.
- O modo atual, de rolar sozinho sem sala e sem internet, continua igual.

## Informação das rolagens

- Histórico ao vivo, acessível de qualquer visão.
- Aviso discreto das rolagens dos outros também na bandeja de dados.
- Rótulo opcional na rolagem (ex.: "Furtividade").

## Visibilidade

- Aberta: todos veem.
- Privada: só o jogador e o Guardião veem.
- Secreta: só o Guardião vê (inclui o Guardião rolar por um jogador, como Psicologia na 7ª
  edição).
- Nas privadas e secretas, os outros recebem só um sinal de suspense, sem o número.
- IMPORTANTE: a proteção deve ser feita no servidor. Quem não pode ver um resultado nunca deve
  recebê-lo no aparelho, nem escondido.

## Guardião

- Rolagens ocultas por padrão, com opção de rolar abertamente.
- Rola em segredo por um jogador; pede rolagem a um jogador (inclusive privada), e o aparelho do
  jogador abre a bandeja já configurada.
- Define regras da mesa na criação da sala e durante o jogo.
- Visão principal proposta: um painel (lista ao vivo + bandeja própria), com a mesa 3D como opção.

## Mesa ritual 3D

- Mesa redonda vista de cima, em ângulo, com velas e atmosfera misteriosa.
- Jogadores como figuras encapuzadas, igualmente espaçados.
- Cada jogador sempre se vê embaixo, no centro, de frente para o Guardião.
- O Guardião fica fora do círculo, numa cabeceira elevada (mesa simétrica com qualquer número de
  jogadores).
- Ordem estável dos lugares, por ordem de entrada.
- Zoom em linha reta até a bandeja para rolar; afastar para a visão geral.
- Dados 3D dos outros não aparecem, só o resultado sobre a figura.
- Desempenho no celular é prioridade.

## Arquitetura

- Manter a base atual (JavaScript puro sem compilação, Three.js, cannon-es, PWA, GitHub Pages).
- Entra um serviço de tempo real, com regras de acesso no servidor e um ambiente de teste separado
  do oficial, como já existe para o site.
- Respeitar a separação mecânica/tema: a lógica da sala é mecânica; a mesa ritual é do tema Arkham.

## Fases

> A ordem abaixo é a do plano original. Desde 14/11/2026 vale a nova ordem de "Prioridades depois da
> primeira sessão", no começo deste arquivo; a mesa ritual 3D ficou arquivada.

1. Plano (esta etapa).
2. Sala funcional: sala com código, entrada com nome do investigador, reconexão, histórico,
   avisos, rótulo, visibilidade e sinal de suspense. Guardião básico (criar sala e rolagens
   secretas). Sem mesa 3D: o app atual com uma lista ao lado. Testaremos numa sessão real.
3. Painel do Guardião completo e regras da mesa.
4. Mesa ritual 3D.
5. Polimento: sons, efeitos, PC e celular, campo de perícia com nível de sucesso.

## Decisões da fase 1 (aprovadas por Weberson em 31/10/2026)

**Serviço: Cloudflare, plano gratuito** (Workers + Durable Objects). Cada sala é um Durable
Object: um pequeno programa no servidor que guarda a sala, entrega a cada pessoa só o que ela
pode ver e se apaga sozinho.
- Por quê: a proteção vira uma entrega filtrada (o número nunca sai do servidor para quem não pode
  ver); o apagamento automático é de graça (um alarme da própria sala); e o app não precisa de
  biblioteca nenhuma para falar com o servidor.
- Descartados: Firebase, porque a limpeza automática (TTL) só funciona com cobrança ativada, com
  cartão, e as bibliotecas dele pesam uns 700 KB; Supabase, porque o projeto grátis é pausado
  depois de 7 dias sem uso e precisa ser reativado à mão.
- As salas rodam no leste dos Estados Unidos (o Cloudflare ainda não cria Durable Objects na
  América do Sul). O atraso é de uma fração de segundo.

**Custos**
- Plano gratuito, sem cartão. Limites por dia: 100 mil pedidos, tempo de servidor e 5 GB
  guardados; uma sessão usa uma pequena parte disso.
- Se um limite estourar, a mesa compartilhada para até 21h de Brasília (00:00 UTC), sem
  cobrança, e rolar sozinho continua funcionando. Nunca mudar para o plano pago.

**Privacidade**
- No servidor, só enquanto a sala existe: o código, os nomes dos investigadores, um resumo da
  chave aleatória de cada aparelho (a chave em si nunca fica guardada) e as rolagens.
- Ninguém da mesa cria conta. A única conta é a de Weberson no Cloudflare.
- A sala se apaga 6 horas depois do último uso, ou na hora, pelo "Encerrar sessão" do Guardião.
- O servidor não grava registros (logs) nem endereços de internet. O histórico não fica guardado
  no aparelho: ao voltar, o servidor manda de novo o que aquela pessoa pode ver.

**Visibilidade e proteção**
- O servidor monta, para cada pessoa, a versão da rolagem que ela pode ver. Para os outros vai só
  o sinal de suspense: quem rolou e quando, sem número, sem dados e sem rótulo. Vale também para
  o histórico mandado a quem reconecta.
- Jogador: Aberta ou Privada. Guardião: Secreta (o padrão) ou Aberta. A secreta é só do Guardião,
  porque os dados rolam no aparelho de quem rola. Rolar por um jogador (fase 3) acontece no
  aparelho do Guardião; nas secretas, nem para quem foi aparece.
- O servidor confia no número que o aparelho manda, mas recusa números impossíveis (fora do
  mínimo e do máximo da fórmula).
- Um teste automático simula o Guardião e dois jogadores, registra tudo o que cada aparelho
  recebe e falha se aparecer algo proibido. Ele roda antes de cada envio do servidor.

**Teste e oficial**
- Dois servidores separados, a mesa de teste e a mesa oficial, na mesma conta. O app escolhe pelo
  endereço em que foi aberto (o `data-place`). No computador, um simulador local do servidor.
- A mesa de teste é atualizada junto com o endereço de teste; a mesa oficial só muda com o "pode
  publicar", junto com o app oficial. Publicar fora do dia de jogo: a sala confere a versão do
  app e avisa quem estiver desatualizado.

**Interface**
- JavaScript puro, sem biblioteca. Reavaliar Preact + htm no começo da fase 3.
- No celular, a lista vira uma gaveta (mais os avisos); ao lado, só no PC.
- Link de convite além do código. No iPhone o link abre no Safari, e não no app instalado; por
  isso o código continua sendo o caminho principal.
- Mesa ritual 3D (fase 4): um protótipo simples medido no celular antes do visual completo, e a
  vista em lista como opção para todos.

## Fase 2 em passos

Cada passo termina com o endereço de teste atualizado, o link e como testar.

1. **Preparação** (o app não muda): a conta do Cloudflare; a mesa de teste no ar, com a sala e a
   proteção; o teste automático dos três aparelhos.
2. **Entrar na mesa**: o botão "Mesa"; o Guardião cria a sala e vê o código; o jogador entra com
   o código e o nome do investigador; a lista de quem está na mesa, na ordem de entrada; o nome
   guardado no aparelho; quem cai volta sozinho para o mesmo lugar; o link de convite.
3. **Rolagens ao vivo, com rótulo**: o histórico (gaveta no celular, ao lado no PC), o aviso
   discreto perto da bandeja e o rótulo opcional, com os últimos usados à mão.
4. **Privada e secreta**: a escolha da visibilidade, o sinal de suspense, o Guardião rolando
   oculto por padrão e vendo tudo.
5. **Quedas e encerramento**: o "Encerrar sessão", a sala que se apaga sozinha, o aviso
   "reconectando…", a rolagem feita sem sinal enviada quando a conexão volta, o aviso de versão.
6. **Sessão real no Discord**, pelo endereço de teste. Depois dos ajustes, o "pode publicar" põe
   no ar o app e a mesa oficial juntos.

## Valores do investigador (pedido de Weberson em 03/11/2026)

Versão mínima de PV, Sanidade, Sorte e Pontos de Magia, antes da primeira sessão real.

- Cada jogador informa o máximo de cada valor e ajusta o atual com + e −, de forma rápida no
  celular.
- Só o jogador altera os próprios valores. O Guardião não altera e não tem contadores próprios.
- Os valores ficam salvos no aparelho, ligados ao nome do investigador, e voltam sozinhos na próxima
  sessão.
- O Guardião vê os valores de todos em tempo real, na lista de quem está na mesa.
- Ao criar a sala, o Guardião escolhe se os outros jogadores também veem os valores de todos. Se
  não, a proteção é feita no servidor, como nas rolagens privadas: quem não pode ver não recebe os
  números.

Fica para depois: alertas para o Guardião (PV baixo, perda grande de Sanidade), o painel completo
do Guardião e outras regras da mesa. (Os alertas entraram na fase 3, versão enxuta: veja o fim do
arquivo.)

**Como foi feito**

- O aparelho é quem sabe os valores; a mesa só recebe o resultado e entrega a quem pode ver. Assim
  ninguém consegue mudar os valores de outra pessoa: a mensagem não diz de quem são, vale o lugar da
  conexão, e o Guardião não tem como mandar.
- Quais são os contadores é o tema que diz (`counters`, em `rules.js`); o servidor confere só o
  formato. Outro tema pode ter outros contadores sem mudar o servidor.
- Um botão perto da bandeja mostra os dois primeiros valores e abre a folha com os quatro, embaixo,
  perto do polegar. Quem entra com um investigador ainda sem valores começa por essa folha.
- Para o Guardião (e para todos, se ele deixou), a lista de quem está na mesa vira uma tabela, uma
  linha por pessoa, para caber junto com as rolagens.

## Ideia para depois: a ficha do personagem

Weberson quer, no futuro, carregar a ficha de personagem dentro do app, em dois formatos. A ficha
ainda não foi feita; os contadores foram feitos para ela entrar sem refazer nada.

- **Markdown, o formato completo.** A ficha terá uma tabela "Valores derivados", com as colunas
  "Máximo" e "Atual", e os contadores devem poder ler e atualizar essa tabela. As perícias também
  poderão virar botões de rolagem.
- **PDF, só para visualizar a ficha dentro do app.** Nesse caso, os contadores continuam sendo
  ajustados à mão.

Como isso entra:

- Cada linha da tabela já tem a forma de um contador: "Máximo" e "Atual" são o `{ max, cur }` de
  `src/core/counters.js`. O tema já traz os dois nomes de cada um (`short` e `name`, como "PV" e
  "Pontos de Vida"), para achar a linha certa na tabela.
- Ler: o que vier da tabela passa por `cleanCounters` e entra nos valores do personagem.
- Atualizar: toda mudança passa por um único ponto (`changed()`, em `src/room-counters.js`); é ali
  que a ficha reescreve a coluna "Atual".
- A ficha fica no aparelho, ao lado dos valores e ligada ao mesmo nome do investigador
  (`saved.characters`; um PDF, por ser grande, pediria outro lugar de guardar). A mesa não muda: ela
  continua recebendo só os contadores, e a ficha nunca sai do aparelho.

## Fase 3: o painel do Guardião, versão enxuta (pedido de Weberson em 14/11/2026)

Weberson é o Guardião e ainda está aprendendo as regras. O objetivo: o app avisar o que pode passar
despercebido no meio da cena.

**Alertas para o Guardião.** Com base nos valores que cada jogador ajusta, avisar o Guardião (e só
ele), com um lembrete curto da regra, escrito com texto próprio:

- perda de 5 ou mais de SAN de uma vez: pede teste de INT para insanidade temporária;
- perda de SAN igual ou maior que um quinto da SAN atual durante a sessão: possível insanidade
  indefinida;
- SAN chegou a zero: insanidade permanente;
- perda de PV igual ou maior que metade do máximo de uma vez: ferimento grave;
- PV chegou a zero: inconsciente, ou morrendo se houver ferimento grave.

Os alertas são lembretes: quem decide é o Guardião. Várias mudanças seguidas em poucos segundos
contam como uma única perda. O alerta aparece como um aviso que o Guardião dispensa, com o jogador
destacado na lista e um registro no histórico, visível só para o Guardião. Os jogadores não recebem
nada.

**Remover um lugar.** O Guardião pode tirar um jogador da mesa (um lugar ocupado por engano, ou de
quem trocou de aparelho), com confirmação. A pessoa pode entrar de novo pelo código, se houver lugar.
A proteção é feita no servidor: só o Guardião pode remover.

**Como foi feito** (envio "teste 15"; publicado na versão 1.4, em 14/11/2026)

- Os alertas são calculados no aparelho do Guardião, com os valores que a mesa já entrega a ele: nada
  de novo vai para a mesa, nem para os jogadores. Quais mudanças viram alerta, e o texto, é o tema que
  diz (`alerts`, em `src/themes/arkham/rules.js`); juntar os toques é mecânica
  (`src/core/counter-watch.js`); a tela é `src/room-alerts.js`.
- Toques seguidos: quando um valor fica 4 segundos sem mudar, a mudança vai do valor de antes do
  primeiro toque ao de depois do último. Quem erra e corrige nesse tempo fica só com o resultado.
  Limites, ditos nos lembretes: duas perdas de verdade em menos de 4 segundos viram uma só ("se veio de
  uma rolagem só", "se foi um golpe só"), e uma pausa maior que 4 segundos divide uma perda em duas.
  Mexer no máximo (acertar a ficha) não é perda.
- "Durante a sessão" é desde que o jogador entrou nesta mesa, a partir do maior valor de SAN que ele
  teve nela. O app guarda isso no aparelho do Guardião, e continua certo se o app for fechado e
  aberto no meio da sessão (o que mudou enquanto ele estava fora conta como uma mudança).
- Metades e quintos arredondam para baixo, como os valores difícil e extremo das perícias.
- PV zero: "morrendo" se esta perda já foi um ferimento grave, ou se o app viu um nesta mesa; o app não
  sabe dos ferimentos de sessões anteriores, e o lembrete diz isso. Lembra também que um golpe do PV
  máximo ou mais mata na hora: o PV não desce abaixo de zero, e o app não vê o tamanho do golpe.
- Como aparece: um aviso logo abaixo do cabeçalho (até 3 no PC, 1 no celular, com "mais N alertas
  esperando"); o registro no histórico, marcado "só você vê"; e o jogador em vermelho, com "!", na
  lista. Valores em zero aparecem em vermelho na tabela do Guardião.
- Ajuste pedido por Weberson depois de testar a 1.4 (14/11/2026; publicado na versão 1.5, no mesmo
  dia): os alertas não precisam ficar para
  sempre. O aviso no alto some sozinho depois de alguns segundos se ninguém tocar em "Entendi" (ficou
  em 10 s; com o mouse em cima, espera). No histórico, o alerta só sai por uma ação de propósito do
  Guardião: o "Apagar" de cada um. O destaque na lista acompanha o histórico (fica enquanto o jogador
  tiver algum alerta lá). Aberto de novo, o app mostra os alertas do histórico, mas o aviso no alto
  não volta.
- Remover lugar: o botão "Tirar alguém", ao lado de "Na mesa" (só para o Guardião), mostra um × em
  cada jogador; o × pede confirmação. A mesa confere que quem pede é o Guardião. O lugar tirado
  continua na lista só com o nome, para o histórico (os valores saem); as conexões dele são avisadas e
  desligadas. A pessoa só volta entrando de propósito pelo código (o app voltando sozinho é recusado),
  num lugar novo: o número de um lugar nunca se repete numa mesa, para quem chega depois não herdar as
  rolagens privadas do lugar tirado.
- Regras conferidas nas páginas de regras da Chaosium e em outras fontes (insanidade temporária,
  ferimento grave, morrendo, morte por um golpe do PV máximo). Pontos incertos, avisados a Weberson: a
  insanidade indefinida fala em "um quinto da SAN atual num mesmo dia de jogo", sem deixar claro (nas
  fontes conferidas) se a base é a SAN do começo do dia; e, com PV máximo ímpar, se a metade arredonda
  para baixo.
- Testado: os testes dos alertas (`tests/alertas.test.js`) e das regras da sala, o teste dos aparelhos
  simulados contra a mesa de teste (com o lugar tirado) e, no navegador, o Guardião e dois jogadores em
  abas com `?aba`.
