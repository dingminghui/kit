# @kit/chat

聊天组件模板，包含 SSE transport、多轮会话 hook 和 Markdown 渲染。

该包用于 `kit add chat`，会将 `src` 复制到目标项目的 `src/lib/chat`。

## 快速接入

```bash
kit add chat
```

```tsx
import { ChatPanel, createSSETransport } from "@/lib/chat";

const transport = createSSETransport({
  url: "/api/chat/stream",
});

export default function ChatPage() {
  return <ChatPanel transport={transport} />;
}
```

## 架构提示

浏览器只应对接你自己的 HTTP API；由服务端再调用模型服务：`client → API → model`。

