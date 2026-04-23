export const BASE_URL = import.meta.env.VITE_BASE_URL ?? "/";

export const REQUEST_TIMEOUT = 30_000;

export const LOGIN_PATH = "/login";

export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;
