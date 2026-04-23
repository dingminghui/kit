import chalk from "chalk";
import { registeredCommands } from "./registry.js";
import type { Command } from "./types.js";

/**
 * list 命令 - 列出所有可用的 kit 命令
 *
 * 注意：此命令从 registry 自动获取所有已注册的业务命令
 * 添加新命令时无需修改此文件
 */
export const listCommand: Command = {
  name: "list",
  description: "列出所有可用的 kit 命令",
  usage: "kit list",
  async execute(): Promise<void> {
    console.log();
    console.log(chalk.bold.cyan("🛠️  Kit 可用命令列表:"));
    console.log();

    // 自动从 registry 获取所有命令
    registeredCommands.forEach((cmd) => {
      console.log(chalk.bold.green(`  ${cmd.name}`));
      console.log(chalk.gray(`    描述: ${cmd.description}`));
      console.log(chalk.gray(`    用法: ${cmd.usage}`));
      console.log();
    });

    console.log(chalk.gray("💡 提示: 运行 'kit <命令名>' 来执行对应命令"));
    console.log();
  },
};
