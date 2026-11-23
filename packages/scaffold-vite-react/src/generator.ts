import fs from "fs-extra";
import path from "node:path";
import process from "node:process";
import ora from "ora";
import prompts from "prompts";
import type { ProjectOptions } from "./prompts.js";
import { installDependencies } from "./utils/install.js";
import { mergePackageJsonExtras } from "./utils/merge.js";
import { Rollback } from "./utils/rollback.js";
import { getTemplatesDir, processTemplate, readVersions } from "./utils/template.js";

export async function generateProject(options: ProjectOptions): Promise<void> {
  const templatesDir = getTemplatesDir();
  const targetDir = path.resolve(process.cwd(), options.projectName);
  const withPlaywright = options.features.includes("playwright");
  const rollback = new Rollback();
  const spinner = ora();

  try {
    // 创建项目目录
    spinner.start("创建项目目录...");
    await fs.ensureDir(targetDir);
    rollback.addDirectory(targetDir);
    spinner.succeed("项目目录创建完成");

    // 读取版本信息
    const versions = readVersions();

    // 准备模板变量
    const templateVars = {
      PROJECT_NAME: options.projectName,
      PROJECT_DESCRIPTION: options.description,
    };

    // 复制基础模板
    spinner.start("生成基础项目文件...");
    await copyBaseTemplate(templatesDir, targetDir, templateVars);
    spinner.succeed("基础项目文件生成完成");

    // 生成 package.json
    spinner.start("生成 package.json...");
    const packageJson = generatePackageJson(options, versions);
    await fs.writeJson(path.join(targetDir, "package.json"), packageJson, {
      spaces: "\t",
    });
    spinner.succeed("package.json 生成完成");

    // 添加 Playwright 配置
    if (withPlaywright) {
      spinner.start("添加 Playwright 配置...");
      await copyPlaywrightTemplate(templatesDir, targetDir);
      const extras = await fs.readJson(path.join(templatesDir, "playwright/package.json.extras"));
      await mergePackageJsonExtras(path.join(targetDir, "package.json"), extras, versions);
      spinner.succeed("Playwright 配置添加完成");
    }

    // 添加 MSW 配置
    if (options.features.includes("msw")) {
      spinner.start("添加 MSW 配置...");
      await copyMswTemplate(templatesDir, targetDir);
      if (withPlaywright) {
        await fs.copy(path.join(templatesDir, "msw/tests"), path.join(targetDir, "tests"));
      }
      const extras = await fs.readJson(path.join(templatesDir, "msw/package.json.extras"));
      await mergePackageJsonExtras(path.join(targetDir, "package.json"), extras, versions);
      spinner.succeed("MSW 配置添加完成");
    }

    // 添加 API 请求层
    if (options.features.includes("api")) {
      spinner.start("添加 API 请求层...");
      await copyApiTemplate(templatesDir, targetDir);
      if (withPlaywright) {
        await fs.copy(path.join(templatesDir, "api/tests"), path.join(targetDir, "tests"));
      }
      const extras = await fs.readJson(path.join(templatesDir, "api/package.json.extras"));
      await mergePackageJsonExtras(path.join(targetDir, "package.json"), extras, versions);
      spinner.succeed("API 请求层添加完成");
    }

    // 安装依赖
    spinner.start("正在安装依赖...");
    try {
      await installDependencies(targetDir);
      spinner.succeed("依赖安装完成");
    } catch (error) {
      spinner.fail("依赖安装失败");
      if (!process.stdin.isTTY) {
        throw error;
      }

      const { shouldContinue } = await prompts({
        type: "confirm",
        name: "shouldContinue",
        message: "依赖安装失败，项目文件已生成。是否继续（可稍后手动执行 pnpm install）？",
        initial: true,
      });

      if (!shouldContinue) {
        await rollback.execute();
        return;
      }
    }

    showSuccessMessage(options);
  } catch (error) {
    spinner.fail("项目创建失败");
    await rollback.execute();
    throw error;
  }
}

async function copyBaseTemplate(
  templatesDir: string,
  targetDir: string,
  vars: Record<string, string>,
): Promise<void> {
  const baseDir = path.join(templatesDir, "base");

  // 复制所有文件
  await fs.copy(baseDir, targetDir);

  // 处理模板文件
  const templateFiles = ["index.html.template", "README.md.template"];
  await Promise.all(
    templateFiles.map(async (file) => {
      const filePath = path.join(targetDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      const processed = processTemplate(content, vars);
      const destPath = filePath.replace(".template", "");
      await fs.outputFile(destPath, processed);
      await fs.remove(filePath);
    }),
  );

  // 重命名 _gitignore 为 .gitignore
  await fs.move(path.join(targetDir, "_gitignore"), path.join(targetDir, ".gitignore"));
}

async function copyPlaywrightTemplate(templatesDir: string, targetDir: string): Promise<void> {
  const playwrightDir = path.join(templatesDir, "playwright");

  await fs.copy(
    path.join(playwrightDir, "playwright.config.ts"),
    path.join(targetDir, "playwright.config.ts"),
  );

  await fs.copy(path.join(playwrightDir, "tests"), path.join(targetDir, "tests"));
}

async function copyMswTemplate(templatesDir: string, targetDir: string): Promise<void> {
  const mswDir = path.join(templatesDir, "msw");

  await fs.copy(path.join(mswDir, ".env.mock"), path.join(targetDir, ".env.mock"));
  await fs.copy(path.join(mswDir, "src/mocks"), path.join(targetDir, "src/mocks"));

  await fs.copy(path.join(mswDir, "src/main.tsx"), path.join(targetDir, "src/main.tsx"));

  await fs.copy(path.join(mswDir, "src/test-setup.ts"), path.join(targetDir, "src/test-setup.ts"));
}

async function copyApiTemplate(templatesDir: string, targetDir: string): Promise<void> {
  const apiDir = path.join(templatesDir, "api");
  await fs.copy(path.join(apiDir, "src/api"), path.join(targetDir, "src/api"));
  await fs.copy(path.join(apiDir, "src/utils"), path.join(targetDir, "src/utils"));
  await fs.copy(path.join(apiDir, "src/layouts"), path.join(targetDir, "src/layouts"));
  await fs.copy(
    path.join(apiDir, "src/routes/index.ts"),
    path.join(targetDir, "src/routes/index.ts"),
  );
}

function generatePackageJson(
  options: ProjectOptions,
  versions: Record<string, string>,
): Record<string, unknown> {
  const scripts = {
    dev: "vite --open --mode develop",
    build: "vite build --mode production",
    preview: "vite preview",
    test: "vitest",
    "test:ci": "vitest run",
    "lint:tsc": "tsc -b",
    "lint:eslint": "eslint . --max-warnings 0",
    "lint:eslint:fix": "eslint . --max-warnings 0 --fix",
    "lint:style": 'stylelint "**/*.css"',
    "lint:style:fix": 'stylelint "**/*.css" --fix',
    lint: "pnpm run lint:tsc && pnpm run lint:eslint && pnpm run lint:style",
    "lint:fix": "pnpm run lint:eslint:fix && pnpm run lint:style:fix",
    format: "prettier --write .",
    validate: "pnpm run lint && pnpm run test:ci",
  };

  return {
    name: options.projectName,
    version: "0.0.0",
    description: options.description,
    type: "module",
    private: true,
    scripts,
    dependencies: {
      "@tanstack/react-query": versions["@tanstack/react-query"],
      "@tanstack/react-query-devtools": versions["@tanstack/react-query-devtools"],
      react: versions.react,
      "react-dom": versions["react-dom"],
      "react-error-boundary": versions["react-error-boundary"],
      "react-router": versions["react-router"],
    },
    devDependencies: {
      "@eslint/js": versions["@eslint/js"],
      "@tailwindcss/vite": versions["@tailwindcss/vite"],
      "@testing-library/dom": versions["@testing-library/dom"],
      "@testing-library/jest-dom": versions["@testing-library/jest-dom"],
      "@testing-library/react": versions["@testing-library/react"],
      "@testing-library/user-event": versions["@testing-library/user-event"],
      "@types/react": versions["@types/react"],
      "@types/react-dom": versions["@types/react-dom"],
      "@vitejs/plugin-react": versions["@vitejs/plugin-react"],
      "@vitest/coverage-v8": versions["@vitest/coverage-v8"],
      eslint: versions.eslint,
      "eslint-config-prettier": versions["eslint-config-prettier"],
      "eslint-plugin-jsx-a11y": versions["eslint-plugin-jsx-a11y"],
      "eslint-plugin-react": versions["eslint-plugin-react"],
      "eslint-plugin-react-hooks": versions["eslint-plugin-react-hooks"],
      "happy-dom": versions["happy-dom"],
      prettier: versions.prettier,
      "prettier-plugin-organize-imports": versions["prettier-plugin-organize-imports"],
      "prettier-plugin-tailwindcss": versions["prettier-plugin-tailwindcss"],
      stylelint: versions["stylelint"],
      "stylelint-config-standard": versions["stylelint-config-standard"],
      tailwindcss: versions.tailwindcss,
      typescript: versions.typescript,
      "typescript-eslint": versions["typescript-eslint"],
      vite: versions.vite,
      vitest: versions.vitest,
    },
  };
}

function showSuccessMessage(_options: ProjectOptions): void {
  // 暂时没有实现，预留用于显示成功消息
}
