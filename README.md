# Dados de Arkham

Rolador de dados 3D para RPG, feito para abrir no navegador do celular e instalar na tela inicial.
Dados: d4, d6, d8, d10, d12, d20 e d100 (dois d10: dezenas + unidades).

**Endereço do app:** https://webersoncosta.github.io/Dados-de-Arkham/

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

## Publicar uma nova versão

O site é publicado pelo GitHub Pages a partir da ramificação `main` deste repositório.
Basta enviar as mudanças para o GitHub (commit + push na `main`): em cerca de um minuto o
endereço já mostra a versão nova. Quem tem o app instalado recebe a atualização na próxima vez
que abrir o app com internet (se não aparecer, é só fechar o app e abrir de novo).

## Como o projeto está organizado

O projeto tem duas metades que não se misturam:

**A mecânica** (`src/core/`) é igual para qualquer tema:

| Arquivo | O que faz |
| --- | --- |
| `polyhedra.js` | A forma de cada dado e em que face fica cada número |
| `dice-sets.js` | O que cada botão rola (o d100 são dois d10) e como somar |
| `physics.js` | Gravidade, quiques, paredes e a leitura da face que ficou para cima |
| `stage.js` | Câmera e área da mesa, ajustadas ao tamanho da tela |

**O tema** (`src/themes/arkham/`) é tudo o que se vê e se ouve:

| Arquivo | O que faz |
| --- | --- |
| `theme.js` | Ficha do tema: nome, textos, regras de crítico, vibração |
| `theme.css` | Cores e fontes da interface |
| `scene.js` | Mesa, velas, tomo, papéis, névoa, luz e a reação aos críticos |
| `dice-look.js` | Material e pintura dos dados (pedra, osso, números) |
| `audio.js` | Som dos dados, vento, sussurros e presságios |

O restante:

- `index.html`: a página.
- `manifest.webmanifest`: nome, ícone e cores do app instalado.
- `sw.js`: guarda o app no aparelho para abrir rápido e funcionar sem internet.
- `icons/`: os ícones do app (gerados por `tools/icone.html`).
- `src/main.js`: liga as peças (toque, escolha do dado, resultado).
- `src/app.css`: posição dos elementos na tela.
- `src/themes/index.js`: a lista de temas (hoje só "arkham").
- `src/lib/`: ferramentas pequenas usadas em todo o app.
- `tools/servidor-local.py`: só para testar no computador.
- `.nojekyll`: avisa o GitHub Pages para publicar os arquivos como estão.

## Para criar um tema no futuro

1. Copie a pasta `src/themes/arkham` com outro nome (por exemplo `src/themes/fantasia`).
2. Troque o visual, os sons, os textos e as regras de crítico dentro dela.
   Em D&D, por exemplo, a regra de crítico olharia o d20: 20 é crítico e 1 é falha.
3. Registre o tema novo em `src/themes/index.js`.

A física, as formas dos dados e a leitura do resultado não precisam mudar.

## Testar no computador (opcional)

Com o Python instalado, rode `python tools/servidor-local.py` dentro desta pasta e abra
http://localhost:8766 no navegador.
