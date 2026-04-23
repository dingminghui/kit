import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("应该正确渲染", () => {
    render(<Button>点击我</Button>);
    const button = screen.getByRole("button", { name: "点击我" });
    expect(button).toBeInTheDocument();
  });

  it("应该支持不同的 variant", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole("button");
    expect(button).toHaveClass("bg-blue-600");

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gray-200");

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("bg-red-600");
  });

  it("应该支持不同的 size", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole("button");
    expect(button).toHaveClass("px-2", "py-1", "text-sm");

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("px-4", "py-2", "text-base");

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("px-6", "py-3", "text-lg");
  });

  it("应该在 loading 状态下显示加载文本并禁用按钮", () => {
    render(<Button loading={true}>点击我</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("加载中...");
    expect(button).toBeDisabled();
  });

  it("应该在 disabled 状态下禁用按钮", () => {
    render(<Button disabled={true}>点击我</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("应该正确处理点击事件", () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>点击我</Button>);
    const button = screen.getByRole("button");
    user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("应该在 loading 状态下阻止点击事件", () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading={true} onClick={handleClick}>
        点击我
      </Button>,
    );
    const button = screen.getByRole("button");
    user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("应该支持自定义 className", () => {
    render(<Button className="custom-class">点击我</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("应该支持 ref", () => {
    const ref = vi.fn();
    render(<Button ref={ref}>点击我</Button>);
    expect(ref).toHaveBeenCalled();
  });
});
