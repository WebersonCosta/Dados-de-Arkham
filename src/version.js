// Número da versão do app, mostrado discretamente no canto de baixo da tela.
// Na linha de desenvolvimento ele já é o da próxima versão a publicar.
export const VERSION = '1.1';

// Onde o app está aberto: 'oficial' (o endereço dos amigos), 'teste' (o endereço de teste) ou
// 'local' (o computador). Quem descobre é o index.html, pelo endereço da página.
export const PLACE = document.documentElement.dataset.place || 'oficial';
