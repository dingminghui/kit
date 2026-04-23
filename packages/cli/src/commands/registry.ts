import { addCommand } from "./add.js";
import { createCommand } from "./create.js";
import type { Command } from "./types.js";

/**
 * 命令注册中心
 * 所有业务命令在此注册（不包括 list 等元命令）
 */
export const registeredCommands: Command[] = [
  addCommand,
  createCommand,
  // 未来添加新命令只需在此处添加一行
];

/**
 * 根据命令名称查找命令
 */
export function findCommand(name: string): Command | undefined {
  return registeredCommands.find((cmd) => cmd.name === name);
}
