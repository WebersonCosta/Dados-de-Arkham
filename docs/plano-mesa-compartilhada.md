# Plano: mesa compartilhada

Plano definido por Weberson em 30/10/2026, guardado aqui como ele escreveu. O objetivo: o Guardião
e até 6 jogadores rolarem dados juntos durante uma sessão de Call of Cthulhu (7ª edição), cada um
no seu celular ou PC. O uso principal será numa call do Discord entre amigos.

Andamento: fase 1 (plano) aprovada em 31/10/2026. Fase 2, passo 1 (preparação) pronto em
31/10/2026: a mesa de teste está no ar e passou no teste dos três aparelhos. Passo 2 (entrar na
mesa) testado e aprovado por Weberson em 31/10/2026. **Passo 3 (rolagens ao vivo, com rótulo) no
endereço de teste desde 31/10/2026, esperando o teste de Weberson.** As decisões e os passos da
fase 2 estão no fim deste arquivo.

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
