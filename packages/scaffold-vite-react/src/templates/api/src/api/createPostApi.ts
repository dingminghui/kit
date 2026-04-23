import type { AxiosRequestConfig } from "axios";
import { request } from "./request";

export function createPostApi<D = unknown, R = unknown>(url: string) {
  return function (data?: D, config?: AxiosRequestConfig<D>) {
    return request.post<R, R, D>(url, data, config);
  };
}
