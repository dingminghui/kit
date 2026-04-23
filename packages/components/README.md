# @kit/components

React UI library built with TypeScript and Tailwind CSS.

## 安装

```bash
pnpm add @kit/components
```

## 使用

### 基础用法

```tsx
import { Button } from "@kit/components";

function App() {
  return (
    <div>
      <Button>点击我</Button>
    </div>
  );
}
```

### 引入样式

在使用组件库之前，需要引入 Tailwind CSS 样式：

```tsx
import "@kit/components/styles";
```

## 组件

### Button

按钮组件，支持多种样式和尺寸。

#### 基础用法

```tsx
import { Button } from "@kit/components";
<Button>默认按钮</Button>;
```

#### Variant

支持三种样式变体：

```tsx
<Button variant="primary">主要按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="danger">危险按钮</Button>
```

#### Size

支持三种尺寸：

```tsx
<Button size="sm">小按钮</Button>
<Button size="md">中等按钮</Button>
<Button size="lg">大按钮</Button>
```

#### Loading 状态

```tsx
<Button loading>加载中...</Button>
```

#### Disabled 状态

```tsx
<Button disabled>禁用按钮</Button>
```

#### API

| 属性     | 类型                                   | 默认值      | 说明             |
| -------- | -------------------------------------- | ----------- | ---------------- |
| variant  | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | 按钮样式变体     |
| size     | `'sm' \| 'md' \| 'lg'`                 | `'md'`      | 按钮尺寸         |
| loading  | `boolean`                              | `false`     | 是否显示加载状态 |
| disabled | `boolean`                              | `false`     | 是否禁用         |
| children | `ReactNode`                            | -           | 按钮内容         |

Button 组件继承所有原生 `<button>` 元素的属性。

## 开发

### 安装依赖

```bash
pnpm install
```

### Storybook（组件预览）

启动 Storybook 查看和测试所有组件：

```bash
pnpm storybook
```

Storybook 会在 `http://localhost:6006` 启动，提供：

- 交互式组件预览
- 自动生成的文档
- 组件属性控制面板
- 代码示例

### 构建 Storybook

```bash
pnpm build-storybook
```

### 开发模式

```bash
# 构建组件库（watch 模式）
pnpm dev
```

### 构建

```bash
pnpm build
```

### 测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
```

### 格式化

```bash
pnpm format
```

## 技术栈

- React 19
- TypeScript 5
- Tailwind CSS v4
- Vite 7
- Vitest 4
- Biome 2
- Storybook 8
