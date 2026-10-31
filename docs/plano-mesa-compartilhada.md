# Plano: mesa compartilhada

Plano definido por Weberson em 30/10/2026, guardado aqui como ele escreveu. O objetivo: o Guardião
e até 6 jogadores rolarem dados juntos durante uma sessão de Call of Cthulhu (7ª edição), cada um
no seu celular ou PC. O uso principal será numa call do Discord entre amigos.

Andamento: **fase 1 (plano)**. A fase 2 só começa com a aprovação de Weberson.

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
