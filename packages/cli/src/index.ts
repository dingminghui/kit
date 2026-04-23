#!/usr/bin/env node
import chalk from "chalk";
import process from "node:process";
import { commands, findCommand } from "./commands/index.js";

/**
 * 解析命令行参数
 */
function parseArguments(): { command: string; args: string[] } {
  const args = process.argv.slice(2);

  // 如果没有参数，默认显示帮助
  if (args.length === 0) {
    return { command: "list", args: [] };
  }

  const command = args[0];

  // 如果第一个参数不是已注册的命令，则视为 create 命令的项目名称（向后兼容）
  const isRegisteredCommand = commands.some((cmd) => cmd.name === command);
  if (!isRegisteredCommand) {
    return { command: "create", args };
  }

  return { command, args: args.slice(1) };
}

/**
 * 显示错误信息
 */
function showError(message: string): void {
  console.error();
  console.error(chalk.red(`❌ 错误: ${message}`));
  console.error();
  console.error(chalk.gray("💡 提示: 运行 'kit list' 查看所有可用命令"));
  console.error();
}

async function main(): Promise<void> {
  const { command, args } = parseArguments();

  const cmd = findCommand(command);
  if (!cmd) {
    showError(`未知命令: ${command}`);
    process.exit(1);
  }

  await cmd.execute(args);
}

main().catch((_error: unknown) => {
  process.exit(1);
});
