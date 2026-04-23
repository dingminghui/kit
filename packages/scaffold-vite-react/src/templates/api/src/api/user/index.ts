import { createGetApi } from "@/api/createGetApi";
import type { UserInfo } from "./typings";

export const getUserInfo = createGetApi<Record<string, unknown>, UserInfo>("/user/info");

export type { UserInfo } from "./typings";
