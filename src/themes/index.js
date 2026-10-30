// Lista de temas. Hoje só existe "arkham". Para criar outro no futuro: copie a pasta
// themes/arkham com outro nome, troque o que quiser e registre o novo tema aqui.
export const THEMES = {
  arkham: () => import('./arkham/theme.js')
};

export const DEFAULT_THEME = 'arkham';
