import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
      description: "按钮样式变体",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "按钮尺寸",
    },
    loading: {
      control: "boolean",
      description: "是否显示加载状态",
    },
    disabled: {
      control: "boolean",
      description: "是否禁用",
    },
    children: {
      control: "text",
      description: "按钮内容",
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "默认按钮",
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "主要按钮",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "次要按钮",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "危险按钮",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "小按钮",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    children: "中等按钮",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "大按钮",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "加载中",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "禁用按钮",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button variant="primary">主要按钮</Button>
        <Button variant="secondary">次要按钮</Button>
        <Button variant="danger">危险按钮</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm">小按钮</Button>
        <Button size="md">中等按钮</Button>
        <Button size="lg">大按钮</Button>
      </div>
      <div className="flex gap-3">
        <Button loading={true}>加载中</Button>
        <Button disabled={true}>禁用按钮</Button>
      </div>
    </div>
  ),
};
