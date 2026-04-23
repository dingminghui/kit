import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./global.css";

async function enableMocking(): Promise<void> {
  if (import.meta.env.PROD) {
    return;
  }
  const { worker } = await import("./mocks/browser");
  await worker.start();
}

const container = document.querySelector("#root");

void enableMocking()
  .then(() => {
    if (container) {
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    }
  })
  .catch((error: unknown) => {
    console.error("Mock 服务启动失败:", error);
  });
