import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import prompts from "prompts";

export interface ProjectOptions {
  projectName: string;
  description: string;
  features: string[];
}

// 项目名称验证正则表达式
const PROJECT_NAME_PATTERN = /^[a-z0-9_-]+$/;

function validateProjectName(value: string): true | string {
  if (!value) return "项目名称不能为空";
  if (!PROJECT_NAME_PATTERN.test(value)) {
    return "项目名称只能包含小写字母、数字、连字符和下划线";
  }
  const targetDir = path.resolve(process.cwd(), value);
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    return `目录 ${value} 已存在且不为空`;
  }
  return true;
}

export function showWelcome(): void {
  // 暂时没有实现，预留用于显示欢迎消息
}

export async function collectOptions(projectNameFromArg?: string): Promise<ProjectOptions | null> {
  let cancelled = false;

  if (projectNameFromArg !== undefined) {
    const validation = validateProjectName(projectNameFromArg);
    if (validation !== true) {
      console.error(validation);
      return null;
    }
  }

  const namePrompt =
    projectNameFromArg !== undefined
      ? null
      : {
          type: "text" as const,
          name: "projectName" as const,
          message: "项目名称:",
          validate: (value: string) => validateProjectName(value),
        };

  const response = await prompts(
    [
      ...(namePrompt ? [namePrompt] : []),
      {
        type: "text",
        name: "description",
        message: "项目描述:",
        initial: "一个基于 Vite 的 React 项目",
      },
      {
        type: "multiselect",
        name: "features",
        message: "选择可选功能（空格选择，回车确认）:",
        choices: [
          {
            title: "Playwright - E2E 测试框架",
            value: "playwright",
            description: "添加 Playwright 配置和示例测试",
          },
          {
            title: "MSW - Mock Service Worker",
            value: "msw",
            description: "添加 MSW 配置用于 API Mock",
          },
          {
            title: "API 请求层 (axios)",
            value: "api",
            description: "封装请求与 user 示例",
          },
        ],
      },
    ],
    {
      onCancel: () => {
        cancelled = true;
        return false;
      },
    },
  );

  const projectName = projectNameFromArg ?? response.projectName;
  if (cancelled || !projectName) return null;

  const { confirmed } = await prompts({
    type: "confirm",
    name: "confirmed",
    message: "确认创建项目?",
    initial: true,
  });

  if (!confirmed) return null;

  return {
    projectName,
    description: response.description,
    features: response.features,
  };
}
