import { omit } from "@/utils/omit";
import { clearToken } from "@/utils/token";
import type { AxiosRequestHeaders } from "axios";
import axios, { isAxiosError } from "axios";
import { BASE_URL, HTTP_STATUS, LOGIN_PATH, REQUEST_TIMEOUT } from "./constants";
import { getRequestHeaders, REQUEST_ID_KEY } from "./getRequestHeaders";

export const request = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
});

function hasRequestIdInHeaders(headers: AxiosRequestHeaders) {
  return headers[REQUEST_ID_KEY] !== undefined;
}

request.interceptors.request.use((config) => {
  const headers = getRequestHeaders();

  Object.assign(
    config.headers,
    hasRequestIdInHeaders(config.headers) ? omit(headers, [REQUEST_ID_KEY]) : headers,
  );
  return config;
});

function isLoginPage(pathname: string): boolean {
  return pathname.includes(LOGIN_PATH);
}

request.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "arraybuffer" || response.config.responseType === "blob") {
      return response;
    }
    return response.data;
  },
  (error) => {
    if (isAxiosError(error)) {
      if (
        error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
        typeof window !== "undefined" &&
        !isLoginPage(window.location.pathname)
      ) {
        clearToken();
        window.location.href = LOGIN_PATH;
      }
    }
    return Promise.reject(error);
  },
);
