# @kit/create

Vite + React 项目脚手架工具，快速创建基于 Vite + React 19 + TypeScript 5 的项目。

## 可用命令

### list - 列出所有命令

```bash
# 查看所有可用的 kit 命令
pnpm kit list
# 或
kit list  # 全局安装后
```

### create - 创建新项目

```bash
# 指定项目名创建
pnpm kit create [项目名称]
# 或
pnpm create [项目名称]  # 简化命令

# 交互式创建（不指定项目名）
pnpm kit create
# 或
pnpm create
```

## 使用

**注意**：`kit` 命令只有在「从本 monorepo 根目录通过 pnpm 调用」或「全局安装 @kit/create 后」才可用。

### 在 kit 仓库根目录（推荐）

```bash
# 查看所有可用命令
pnpm kit list

# 指定项目名创建（name 会传给 kit create）
pnpm create my-app

# 交互式：不传名字，会提示输入项目名、描述和功能
pnpm create
```

### 全局安装后

```bash
pnpm add -g @kit/create

# 查看所有命令
kit list

# 创建项目
kit create my-app
```

## 功能

### 内置功能

- Vite 7
- React 19
- TypeScript 5
- Tailwind CSS v4
- Biome V2（代码检查和格式化）
- Vitest + Testing Library（单元/集成测试）
- React Query（数据获取）
- React Router（路由）

### 可选功能

- Playwright（E2E 测试）
- MSW（Mock Service Worker）
- API 请求层（axios + token 鉴权 + Layouts）

## 更新模板版本

编辑 `package.json` 中的 `templateVersions` 字段来更新生成项目的依赖版本。
