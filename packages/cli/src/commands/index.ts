import { listCommand } from "./list.js";
import { findCommand as findInRegistry, registeredCommands } from "./registry.js";
import type { Command } from "./types.js";

/**
 * 所有可执行的命令（包括业务命令和元命令）
 */
export const commands: Command[] = [
  ...registeredCommands, // 业务命令（create, add 等）
  listCommand, // 元命令（list）
];

/**
 * 根据命令名称查找命令
 * 先在业务命令中查找，再检查元命令
 */
export function findCommand(name: string): Command | undefined {
  // 先查找业务命令
  const businessCommand = findInRegistry(name);
  if (businessCommand) return businessCommand;

  // 再查找元命令
  if (name === listCommand.name) return listCommand;

  return undefined;
}

export type { Command } from "./types.js";
