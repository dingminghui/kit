import { runCreate } from "@kit/create";
import type { Command } from "./types.js";

/**
 * create 命令 - 创建新的 Vite + React 项目
 */
export const createCommand: Command = {
  name: "create",
  description: "创建新的 Vite + React 项目",
  usage: "kit create [项目名称]",
  async execute(args: string[]): Promise<void> {
    const projectNameFromArg = args[0];
    await runCreate(projectNameFromArg);
  },
};
