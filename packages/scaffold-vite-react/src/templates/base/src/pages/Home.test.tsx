import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";

test("显示首页和关于页面链接", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "首页" })).toBeVisible();
  expect(screen.getByRole("link", { name: "关于页面" })).toHaveAttribute("href", "/about");
});
