import type { AxiosRequestConfig } from "axios";
import { request } from "./request";

export function createGetApi<D = unknown, R = unknown>(url: string) {
  return function (params?: D, config?: AxiosRequestConfig<D>) {
    return request.get<R, R, D>(url, { params, ...config });
  };
}
