import process from "node:process";
import { generateProject } from "./generator.js";
import { collectOptions, showWelcome } from "./prompts.js";

/**
 * 运行 create 命令创建新项目
 * @param projectNameFromArg - 可选的项目名称参数
 */
export async function runCreate(projectNameFromArg?: string): Promise<void> {
  showWelcome();

  const options = await collectOptions(projectNameFromArg);
  if (!options) {
    process.exit(0);
  }

  await generateProject(options);
}
