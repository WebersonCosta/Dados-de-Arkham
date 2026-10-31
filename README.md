# Dados de Arkham

Rolador de dados 3D para RPG, feito para abrir no navegador do celular e instalar na tela inicial.
Dados: d4, d6, d8, d10, d12, d20 e d100 (dois d10: dezenas + unidades). Dá para rolar vários dados
juntos com um número fixo (como "2d6 + 6"), e há o 1d3 e os dados de bônus e de penalidade de
Call of Cthulhu (7ª edição).

**Endereço do app:** https://webersoncosta.github.io/Dados-de-Arkham/

**Endereço de teste** (próxima versão, ainda em teste): https://webersoncosta.github.io/Dados-de-Arkham-teste/

## Rolar vários dados

Para lançar, escolha o dado na bandeja e toque na mesa. Para montar uma rolagem com vários
dados, o app tem dois modos.

**Modo dado único** (quando o app abre, e depois de limpar no **×**)

- **Um toque em outro dado troca:** no 1d4, tocar no d20 deixa **1d20**.
- **Toque duplo** (dois toques rápidos) **em outro dado soma** e entra no modo montagem: no 1d4,
  um toque duplo no d20 deixa **1d4 + 1d20**. No computador, é o clique duplo.
- **Tocar no dado que já está escolhido soma mais um** e entra no modo montagem: no 1d6, tocar
  no d6 deixa **2d6**.
- Os botões **−** e **+** do número fixo também entram no modo montagem.

**Modo montagem** (a partir da primeira soma)

- **Cada toque num dado soma mais um:** no 2d6 + 1d4 + 3, tocar no d20 deixa
  **2d6 + 1d4 + 1d20 + 3**. O número em cima do botão mostra quantos dados daquele tipo há.
- A fórmula acende e a palavra **somando** aparece em cima dela: é o aviso de que o próximo toque
  soma, e não troca.
- Depois de lançar, a fórmula continua montada, para rolar o mesmo dano quantas vezes quiser.
- O **×** sai do modo montagem e volta a um dado só (o último que você tocou).
- O **d100** nunca entra na soma: tocar nele troca para o d100 e sai do modo montagem.

**Detalhes**

- O toque duplo não atrasa a troca: o primeiro toque já troca o dado na hora; se o segundo vier
  logo (em menos de ⅓ de segundo), o dado de antes volta para a mesa e os dois ficam somados.
  Por isso, para ter **2d20** estando no 1d4, toque no d20, espere um instante e toque de novo.
- Saindo do d100, um toque duplo num dado começa a montagem só com ele.
- **Número fixo:** os botões **−** e **+** somam ou tiram um número fixo (segure para ir mais
  rápido), como em **2d6 + 6** ou **1d10 + 2**.
- **Atalhos (★):** fórmulas prontas de Call of Cthulhu (3d6 para FOR, CON, DES, APA e POD; 2d6+6
  para TAM, INT e EDU; 1d3 para o soco; 1d4, 1d6 e 1d10) e as suas fórmulas favoritas. Para
  guardar uma, monte a fórmula, abra os atalhos e toque em **Salvar**. Ficam guardadas no
  aparelho (até 12), e o **×** de cada uma apaga. Atalhos de um dado só (1d3, 1d4…) ficam no
  modo dado único; os de vários dados (3d6, 2d6+6) já vêm no modo montagem. O soco com bônus de
  dano (1d3 + 1d4) é o atalho 1d3 e um toque duplo no d4.
- **1d3:** como em Call of Cthulhu, é rolado com um d6 (de pedra, para não se confundir com os
  outros d6): 1-2 vale 1, 3-4 vale 2 e 5-6 vale 3. O resultado mostra a conversão (por exemplo,
  "5→3") e lembra a regra.
- **No resultado:** o total grande e, embaixo, a conta com o valor de cada dado e o número fixo
  ("5 + 3 + 6 = 14").
- **Limite de 8 dados na mesa de uma vez.** Com mais que isso, a mesa do celular vira um
  amontoado e o resultado demora para sair.

## Dados de bônus e de penalidade (d100)

Com o d100 escolhido, aparece uma fileira acima da bandeja: **penalidade 2 · 1**, **Normal** e
**bônus 1 · 2**. Cada dado de bônus ou de penalidade é mais um dado de dezenas (de pedra) que cai
na mesa e é lançado junto com os outros.

- **Bônus:** cada dezena é somada à mesma unidade e fica o **menor** resultado.
- **Penalidade:** fica o **maior** resultado.
- Como "00" com unidade "0" vale 100, nesse caso a dezena "00" é o pior resultado, e não o melhor
  (é assim que o livro manda contar).
- Na tela do resultado aparecem todas as dezenas: as descartadas vêm riscadas, e os dados delas
  ficam apagados na mesa. Crítico (01) e desastre (100) olham o resultado final.
- Depois de cada lançamento, a escolha volta sozinha para **Normal**.

## Instalar na tela inicial

**Android (Chrome)**
1. Abra o endereço acima no Chrome.
2. Toque no menu ⋮ (canto de cima, à direita).
3. Toque em **Instalar app** (em alguns aparelhos aparece **Adicionar à tela inicial**) e confirme.

**iPhone (Safari)**
1. Abra o endereço acima no **Safari** (no iPhone, só o Safari instala apps assim).
2. Toque no botão **Compartilhar** (o quadrado com uma seta para cima).
3. Role a lista e toque em **Adicionar à Tela de Início**, depois em **Adicionar**.

O ícone aparece junto dos outros apps e abre em tela cheia. Depois da primeira abertura, ele
funciona mesmo sem internet. No iPhone, deixe o modo silencioso desligado para ouvir os sons.

## Versões: desenvolver, testar e publicar

O app tem dois endereços:

| | Endereço | Para quê |
| --- | --- | --- |
| **Oficial** | https://webersoncosta.github.io/Dados-de-Arkham/ | A versão publicada, que os amigos usam |
| **Teste** | https://webersoncosta.github.io/Dados-de-Arkham-teste/ | A próxima versão, para testar antes de publicar |

O número da versão aparece pequeno no canto de baixo da tela, à direita (por exemplo, `v1.1`).
No endereço de teste ele vem em vermelho, com a palavra "teste" e o número do envio
(`v1.1 · teste 5`). Esse número sobe a cada envio: é o jeito de saber se a versão nova já chegou.

**O fluxo**

1. **Desenvolver:** todo trabalho novo é feito na linha `desenvolvimento` do GitHub. A cada etapa
   pronta, o endereço de teste é atualizado (leva alguns minutos para chegar a todos).
2. **Testar:** abra o endereço de teste no celular e teste à vontade. Se quiser, mande o link para
   um amigo. O endereço oficial continua igual.
3. **Publicar:** quando estiver tudo certo, diga **"pode publicar"**. Só então a versão do teste
   vai para o endereço oficial e fica marcada no GitHub com o seu número.

Sem um "pode publicar", nada muda no endereço oficial.

**Como a versão nova chega a quem já usa o app**

O app guarda no aparelho uma cópia inteira da versão em uso e sempre abre dela (por isso funciona
sem internet). Quando há versão nova, ela é baixada inteira em segundo plano e só entra depois de
completa; se faltar algum arquivo, o app continua na versão anterior e tenta de novo depois. A
troca acontece num momento em que ninguém está usando: logo ao abrir o app, antes do primeiro
toque, ou quando o app sai da tela (troca de app, tela apagada). Assim o app nunca fica "meio
atualizado", com arquivos novos misturados com antigos.

**Voltar para uma versão anterior**

Cada versão publicada fica marcada no GitHub, na lista de
[tags](https://github.com/WebersonCosta/Dados-de-Arkham/tags) (a primeira é a `v1.0`). Se algo
der errado, diga, por exemplo, **"volte o app oficial para a versão 1.0"**. Em cerca de um minuto
o endereço oficial volta a mostrar aquela versão, e o trabalho novo continua guardado na linha de
desenvolvimento, para ser corrigido e publicado depois.

**O teste não se mistura com o app oficial**

O teste fica num endereço fora do app oficial, tem outro nome ("Arkham Teste") e guarda à parte
as suas preferências e a sua cópia para uso sem internet. Dá para abrir e até instalar o teste sem
mexer no app oficial que os amigos têm na tela inicial.

**Para quem mexe no código**

- `main` é a versão oficial: o GitHub Pages deste repositório publica a `main`.
- `desenvolvimento` é a versão em teste. O repositório
  [Dados-de-Arkham-teste](https://github.com/WebersonCosta/Dados-de-Arkham-teste) existe só para
  o endereço de teste. Para atualizá-lo, a `main` dele ganha um commit com os arquivos da
  `desenvolvimento`, sem reescrever histórico (o atalho `teste` é criado uma vez com
  `git remote add teste https://github.com/WebersonCosta/Dados-de-Arkham-teste.git`):
  ```sh
  git fetch teste
  c=$(git commit-tree "desenvolvimento^{tree}" -p teste/main -m "Teste: $(git log -1 --format='%s (%h)' desenvolvimento)")
  git push teste "$c:refs/heads/main"
  ```
- O número da versão fica em `src/version.js`; na `desenvolvimento` ele já é o da próxima versão.
- **A cada envio** (para o teste ou para o oficial) que mude arquivos do app, suba o `RELEASE` do
  `sw.js` (é ele que avisa os aparelhos que há versão nova, e é o número que aparece depois de
  "teste" no canto). Arquivo novo do app entra também na lista `APP_FILES` do `sw.js`.
- Publicar a versão X.Y (só depois do "pode publicar"). A `main` vira uma cópia exata da
  `desenvolvimento`, sem misturar históricos:
  ```sh
  git switch main
  git restore --source=desenvolvimento --staged --worktree -- .
  git commit -m "Versão X.Y"
  git tag -a vX.Y -m "Versão X.Y"
  git push origin main vX.Y
  git switch desenvolvimento
  ```
- Voltar o oficial para a versão X.Y, sem apagar nada do histórico:
  ```sh
  git switch main
  git restore --source=vX.Y --staged --worktree -- .
  git commit -m "Volta para a versão X.Y"
  git push origin main
  git switch desenvolvimento
  ```
- **Servidor da mesa compartilhada** (pasta `server/`, no Cloudflare; precisa do Node.js e do
  login feito uma vez com `npx wrangler@4.151.3 login`). Os comandos rodam dentro de `server/`:
  ```sh
  npm test                     # as regras da sala, sem servidor
  npm run deploy:teste         # envia a mesa de teste (roda os testes antes)
  MESA_URL=https://mesa-arkham-teste.mesa-arkham.workers.dev npm run test:mesa   # o teste dos três aparelhos
  npm run deploy:oficial       # a mesa oficial: só junto com o "pode publicar"
  ```

## Como o projeto está organizado

O app tem duas metades que não se misturam:

**A mecânica** (`src/core/`) é igual para qualquer tema:

| Arquivo | O que faz |
| --- | --- |
| `polyhedra.js` | A forma de cada dado e em que face fica cada número |
| `dice-sets.js` | Os tipos de dado (d4 a d20) e o d100 (dois d10: dezenas + unidades) |
| `formula.js` | As fórmulas de vários dados: montar, escrever ("2d6 + 6"), ler e somar; o limite de 8 dados |
| `physics.js` | Gravidade, quiques, paredes, os dados tortos que rolam de novo e a leitura da face que ficou para cima |
| `stage.js` | Câmera e área da mesa, ajustadas ao tamanho da tela |

**O tema** (`src/themes/arkham/`) é tudo o que se vê e se ouve, e as regras do jogo:

| Arquivo | O que faz |
| --- | --- |
| `theme.js` | Ficha do tema: nome, textos, vibração e quais regras e peças ele usa |
| `rules.js` | Regras de Call of Cthulhu: crítico, desastre, dados de bônus e de penalidade, o 1d3 e os atalhos prontos |
| `theme.css` | Cores e fontes da interface |
| `scene.js` | Mesa, velas, tomo, papéis, névoa, luz e a reação aos críticos |
| `dice-look.js` | Material e pintura dos dados (pedra, osso, números) e o dado descartado apagado |
| `audio.js` | Som dos dados, vento, sussurros e presságios |

**O servidor da mesa compartilhada** (`server/`) roda no Cloudflare e não faz parte do app que vai
para o celular. Cada sala é um pequeno programa com memória própria, que entrega a cada pessoa só
o que ela pode ver e se apaga sozinho:

| Arquivo | O que faz |
| --- | --- |
| `room.js` | As regras da sala: o código, os lugares (Guardião e até 6 jogadores), a conferência de cada rolagem e quem vê o quê |
| `worker.js` | A parte do Cloudflare: criar a sala, as conexões ao vivo, guardar, entregar e apagar |
| `wrangler.toml` | Os dois servidores: a mesa oficial e a mesa de teste |
| `test/room.test.js` | Testes das regras, sem servidor |
| `test/three-devices.test.js` | O Guardião e os jogadores simulados, conferindo que ninguém recebe o que não pode ver |

O restante:

- `index.html`: a página.
- `manifest.webmanifest`: nome, ícone e cores do app instalado.
- `manifest-teste.webmanifest`: o mesmo para o endereço de teste, com outro nome ("Arkham Teste").
- `src/version.js`: o número da versão, mostrado no canto da tela.
- `sw.js`: guarda cada versão inteira no aparelho, para abrir rápido, funcionar sem internet e
  nunca misturar arquivos de versões diferentes.
- `CLAUDE.md`: notas do projeto (estado atual, decisões, fluxo de trabalho e ideias para o
  futuro), para continuar o trabalho numa conversa nova sem perder nada.
- `docs/plano-mesa-compartilhada.md`: o plano da mesa compartilhada, com as decisões e as fases.
- `icons/`: os ícones do app (gerados por `tools/icone.html`).
- `src/main.js`: liga as peças (toque, escolha dos dados, fórmula, atalhos, resultado).
- `src/app.css`: posição dos elementos na tela.
- `src/themes/index.js`: a lista de temas (hoje só "arkham").
- `src/lib/`: ferramentas pequenas usadas em todo o app.
- `tools/servidor-local.py` e `tools/servidor-caminhos.py`: só para testar no computador.
- `.nojekyll`: avisa o GitHub Pages para publicar os arquivos como estão.

## Para criar um tema no futuro

1. Copie a pasta `src/themes/arkham` com outro nome (por exemplo `src/themes/fantasia`).
2. Troque o visual, os sons, os textos e as regras (`rules.js`) dentro dela. Em D&D, por
   exemplo, a regra de crítico olharia o d20: 20 é crítico e 1 é falha.
3. Registre o tema novo em `src/themes/index.js`.

A física, as formas dos dados, a leitura do resultado e a montagem de vários dados não precisam
mudar: valem para qualquer tema. O que é de cada jogo fica no `rules.js` do tema:

- `kinds`: tipos de dado a mais, que entram nas fórmulas. O Arkham tem o d3, rolado com um d6
  (`shape: 'd6'`) e convertido por `points` (1-2 → 1, 3-4 → 2, 5-6 → 3).
- `shortcuts`: os atalhos prontos, escritos como fórmulas (`'2d6+6'`), com uma nota opcional.

### Rolagens especiais: bônus, penalidade, vantagem…

Cada tema pode oferecer jeitos especiais de rolar o d100 ou uma fórmula, que aparecem como botões
acima da bandeja, no lugar da fórmula. São as opções em `modes` (na ficha `theme.js`, vindas de
`rules.js`), guardadas pelo nome do que vai para a mesa: `'d100'`, ou a fórmula escrita sem
espaços, como `'1d20'`. Cada opção diz:

- `extra`: quantos dados a mais vão para a mesa, e iguais a qual dado do conjunto;
- `combine`: como contar depois que todos param. A função devolve o total, os números da tela,
  com os descartados riscados (`pieces`), e quais dados ficam apagados na mesa (`discard`).

A opção sem `extra` é a normal, e a escolha volta para ela depois de cada lançamento. O app só
põe os dados na mesa, lança todos com a mesma física e lê as faces; o tema decide o que valem.

No Arkham, as opções do d100 são os dados de bônus e de penalidade. Num tema de D&D, vantagem e
desvantagem no 1d20 (rola 2d20 e fica o maior ou o menor) ficariam assim no `rules.js` do tema:

```js
const keep = (tone, name, pick) => ({
  id: tone, chip: name, name, tone,              // tone: cor do botão ('bonus' ou 'penalty')
  extra: { role: 'single', count: 1 },           // mais um d20 na mesa
  combine(values) {                              // values: os dois d20
    const total = pick(...values), at = values.indexOf(total);
    return {
      total, text: String(total),
      pieces: values.map((v, i) => ({ text: String(v), dropped: i !== at })),
      discard: values.map((v, i) => i).filter(i => i !== at)
    };
  }
});

export const modes = {
  '1d20': {
    title: 'Vantagem e desvantagem',
    options: [keep('penalty', 'Desvantagem', Math.min), { id: 'normal', chip: 'Normal' }, keep('bonus', 'Vantagem', Math.max)]
  }
};
```

E na ficha `theme.js` desse tema entra `modes`, junto com a regra de crítico do d20.

## Testar no computador (opcional)

Com o Python instalado, rode `python tools/servidor-local.py` dentro desta pasta e abra
http://localhost:8766 no navegador. Ali o app não guarda cópia, e cada mudança aparece na hora.

Para testar a cópia guardada e as atualizações de versão, rode `python tools/servidor-caminhos.py`
e abra http://localhost:8767/Dados-de-Arkham-teste/ (ou `/Dados-de-Arkham/`): o app se comporta
como publicado.
