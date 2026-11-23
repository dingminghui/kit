import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./global.css";

async function bootstrap(): Promise<void> {
  const container = document.querySelector("#root");
  if (!container) {
    return;
  }

  const root = createRoot(container);
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK === "true") {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });
    } catch (error) {
      console.error("Mock 服务启动失败:", error);
      root.render(<p role="alert">Mock 服务启动失败。请运行 pnpm mock:init 后刷新页面。</p>);
      return;
    }
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
