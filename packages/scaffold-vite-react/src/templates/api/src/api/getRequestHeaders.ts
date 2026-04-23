import { getToken } from "@/utils/token";
import { uuid } from "@/utils/uuid";

const CLI_REQUEST_ID_KEY = "CLI_REQUEST_ID";

function ensureCliRequestId(): string {
  let cliRequestId =
    typeof localStorage !== "undefined" ? localStorage.getItem(CLI_REQUEST_ID_KEY) : null;
  if (!cliRequestId) {
    cliRequestId = uuid();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CLI_REQUEST_ID_KEY, cliRequestId);
    }
  }
  return cliRequestId;
}

const createRequestId = uuid;

export const REQUEST_ID_KEY = "Request-Id";
export const CLI_REQUEST_ID = "Cli-Request-Id";

export interface BasicRequestHeaders {
  [REQUEST_ID_KEY]: string;
  [CLI_REQUEST_ID]: string;
  Authorization?: string;
}

export function getRequestHeaders(): BasicRequestHeaders {
  const headers: BasicRequestHeaders = {
    [REQUEST_ID_KEY]: createRequestId(),
    [CLI_REQUEST_ID]: ensureCliRequestId(),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
