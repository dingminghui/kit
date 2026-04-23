import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import chalk from "chalk";

import type { Command } from "./types.js";

const MODULE_REGISTRY = {
  "pdf-viewer": {
    packageName: "@kit/pdf-viewer",
    importHint: 'import { PdfViewer } from "@/lib/pdf-viewer";',
  },
  chat: {
    packageName: "@kit/chat",
    importHint: 'import { ChatPanel, createSSETransport } from "@/lib/chat";',
  },
} as const;

type AddableModule = keyof typeof MODULE_REGISTRY;

interface PackageManifest {
  dependencies?: Record<string, string>;
}

function findMonorepoRoot(): string {
  const startDir = path.dirname(fileURLToPath(import.meta.url));
  let searchDir = startDir;

  while (searchDir !== path.dirname(searchDir)) {
    const pkgPath = path.join(searchDir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name === "@kit/cli") {
        return path.dirname(path.dirname(searchDir));
      }
    }
    searchDir = path.dirname(searchDir);
  }

  throw new Error("无法解析 monorepo 根目录");
}

function moduleToPackageDir(moduleName: AddableModule): string {
  return MODULE_REGISTRY[moduleName].packageName.split("/").at(-1) ?? moduleName;
}

function getModulePackagePath(moduleName: AddableModule): string {
  return path.join(findMonorepoRoot(), "packages", moduleToPackageDir(moduleName), "package.json");
}

function getModuleSrcDir(moduleName: AddableModule): string {
  const monorepoRoot = findMonorepoRoot();
  const srcDir = path.join(monorepoRoot, "packages", moduleToPackageDir(moduleName), "src");
  if (!existsSync(srcDir)) {
    throw new Error(`未找到 packages/${moduleToPackageDir(moduleName)}/src，路径: ${srcDir}`);
  }
  return srcDir;
}

function getModuleDeps(moduleName: AddableModule): string[] {
  const packagePath = getModulePackagePath(moduleName);
  if (!existsSync(packagePath)) {
    throw new Error(
      `未找到 packages/${moduleToPackageDir(moduleName)}/package.json，路径: ${packagePath}`,
    );
  }

  const manifest = JSON.parse(readFileSync(packagePath, "utf-8")) as PackageManifest;
  const deps = manifest.dependencies ?? {};
  return Object.entries(deps)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, version]) => `${name}@${version}`);
}

function detectPackageManager(cwd: string): "pnpm" | "yarn" | "npm" {
  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  return "pnpm";
}

function installDeps(cwd: string, moduleName: AddableModule): Promise<void> {
  const moduleDeps = getModuleDeps(moduleName);
  const pm = detectPackageManager(cwd);
  const args = pm === "npm" ? ["install", "--save", ...moduleDeps] : ["add", ...moduleDeps];

  return new Promise((resolve, reject) => {
    const child = spawn(pm, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${pm} 安装依赖失败，退出码: ${code}`));
    });
    child.on("error", reject);
  });
}

export const addCommand: Command = {
  name: "add",
  description: "向当前项目添加模块（如 PDF 预览、聊天组件）",
  usage: "kit add <module>",
  async execute(args: string[]): Promise<void> {
    const moduleName = args[0] as AddableModule | undefined;
    const supportedModules = Object.keys(MODULE_REGISTRY).sort();

    if (!moduleName || !(moduleName in MODULE_REGISTRY)) {
      console.error();
      console.error(
        chalk.red(
          `未知或未支持的模块: ${moduleName ?? "(未指定)"}。当前支持: ${supportedModules.join(", ")}`,
        ),
      );
      console.error(chalk.gray("用法: kit add <module>"));
      console.error();
      process.exit(1);
    }

    const cwd = process.cwd();
    const srcDir = path.join(cwd, "src");
    const libsDir = path.join(cwd, "src", "lib");
    const targetDir = path.join(libsDir, moduleName);

    if (!existsSync(srcDir)) {
      console.error();
      console.error(chalk.red("错误: 当前项目下不存在 src 目录，请先创建 src。"));
      console.error();
      process.exit(1);
    }

    if (!existsSync(libsDir)) {
      mkdirSync(libsDir, { recursive: true });
    }

    const sourceDir = getModuleSrcDir(moduleName);
    cpSync(sourceDir, targetDir, { recursive: true });

    console.log();
    console.log(chalk.green(`已添加 ${moduleName} 到 ${targetDir}`));
    console.log(chalk.gray("正在安装依赖..."));
    console.log();

    try {
      await installDeps(cwd, moduleName);
      console.log();
      console.log(chalk.green(`依赖安装完成。可在代码中: ${MODULE_REGISTRY[moduleName].importHint}`));
      console.log();
    } catch (err) {
      const moduleDeps = getModuleDeps(moduleName);
      console.error();
      console.error(chalk.red("依赖安装失败:"), (err as Error).message);
      console.error(chalk.gray(`请手动在项目根目录执行: pnpm add ${moduleDeps.join(" ")}`));
      console.error();
      process.exit(1);
    }
  },
};
