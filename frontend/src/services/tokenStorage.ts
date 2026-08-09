const TOKEN_KEY = "mini_erp_crm_token";

// NOTE: uses in-memory + localStorage on the deployed app (not an artifact context),
// so browser storage is safe here.
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};
