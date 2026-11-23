# @kit/cli

Kit 工具集的统一命令行入口。

## 架构设计

`@kit/cli` 是一个统一的 CLI 入口，负责：

- 命令解析和路由
- 列出所有可用命令
- 调用各个独立的脚手架包

## 可用命令

### list - 列出所有命令

列出所有可用的 kit 命令及其描述。

```bash
kit list
```

### create - 创建 Vite + React 项目

创建新的 Vite + React 项目，调用 `@kit/create` 脚手架工具。

```bash
kit create [项目名称]
```

### add - 向现有项目添加模块

向当前项目 `src/libs` 添加可复用模块，并自动安装模块依赖。

```bash
kit add pdf-viewer
kit add chat
```

## 添加新命令

要添加新的命令（例如支持 Vue、Nuxt 等脚手架）：

1. 在 `packages/` 下创建新的脚手架包
2. 在新包中导出主函数（如 `runCreate`）
3. 在 `@kit/cli` 的 `src/commands/` 下创建新命令文件
4. 在 `src/commands/index.ts` 中注册新命令

### 示例：添加 Vue 脚手架

```typescript
// packages/scaffold-vue/src/index.ts
export async function runCreate(projectName?: string) {
  // Vue 项目生成逻辑
}

// packages/cli/src/commands/create-vue.ts
import { runCreate } from "@kit/scaffold-vue";
import type { Command } from "./types.js";

export const createVueCommand: Command = {
  name: "create-vue",
  description: "创建新的 Vite + Vue 项目",
  usage: "kit create-vue [项目名称]",
  async execute(args: string[]) {
    await runCreate(args[0]);
  },
};

// packages/cli/src/commands/index.ts
import { createVueCommand } from "./create-vue.js";

export const commands: Command[] = [
  createCommand,
  createVueCommand, // 添加新命令
  listCommand,
];
```

## 设计原则

- **职责单一**：CLI 只负责命令管理和路由
- **模块独立**：各脚手架包独立维护，互不影响
- **易于扩展**：添加新命令只需注册，无需修改核心逻辑
- **向后兼容**：支持 `kit project-name` 的简写形式（默认调用 create）
