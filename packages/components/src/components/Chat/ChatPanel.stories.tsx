import type {
  ChatMessage,
  ChatMessageFeedback,
  ChatTransport,
  ChatTransportRequest,
} from "@kit/chat";
import { ChatPanel } from "@kit/chat";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useRef } from "react";

interface MockScenarioResult {
  chunks?: string[];
  error?: string;
  chunkDelayMs?: number;
}

interface MockScenario {
  resolve: (request: ChatTransportRequest) => MockScenarioResult;
  chunkDelayMs?: number;
}

const DEFAULT_CHUNK_DELAY_MS = 200;
const MOCK_CHUNK_CHAR_SIZE = 4;

function chunkText(text: string, size: number = MOCK_CHUNK_CHAR_SIZE) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

function createAbortError() {
  const error = new Error("请求已中止");
  error.name = "AbortError";
  return error;
}

function getLastUserQuestion(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") {
      return message.content.trim();
    }
  }
  return "";
}

function escapePipe(text: string) {
  return text.replaceAll("|", "\\|");
}

function buildConversationTable(messages: ChatMessage[], question: string) {
  const userCount = messages.filter((message) => message.role === "user").length;
  const assistantCount = messages.filter((message) => message.role === "assistant").length;
  const totalChars = messages.reduce((count, message) => count + message.content.length, 0);

  return [
    "| 指标 | 值 |",
    "| --- | --- |",
    `| 当前问题 | ${escapePipe(question || "（空）")} |`,
    `| 用户消息数 | ${userCount} |`,
    `| 助手消息数 | ${assistantCount} |`,
    `| 上下文字符总量 | ${totalChars} |`,
  ].join("\n");
}

function createInMemoryTransport(scenario: MockScenario): ChatTransport {
  let streaming = false;
  let aborted = false;

  const wait = async (ms: number) => {
    const interval = 20;
    let elapsed = 0;
    while (elapsed < ms) {
      if (aborted) {
        throw createAbortError();
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      elapsed += interval;
    }
  };

  return {
    async stream(request, callbacks) {
      if (streaming) {
        throw new Error("当前已有流式请求进行中");
      }

      streaming = true;
      aborted = false;

      try {
        callbacks.onStart?.();

        const result = scenario.resolve(request);
        if (result.error) {
          await wait(result.chunkDelayMs ?? scenario.chunkDelayMs ?? DEFAULT_CHUNK_DELAY_MS);
          throw new Error(result.error);
        }

        for (const chunk of result.chunks ?? []) {
          await wait(result.chunkDelayMs ?? scenario.chunkDelayMs ?? DEFAULT_CHUNK_DELAY_MS);
          callbacks.onDelta(chunk, { type: "delta", text: chunk });
        }

        callbacks.onDone?.();
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error("Mock 失败");
        callbacks.onError?.(normalizedError);
        throw normalizedError;
      } finally {
        streaming = false;
        aborted = false;
      }
    },
    abort() {
      aborted = true;
      streaming = false;
    },
    isStreaming() {
      return streaming;
    },
  };
}

function logMockOnSourceClick(fileId: string, chunkId: string, messageId: string) {
  console.log("[ChatPanel mock] onSourceClick", { fileId, chunkId, messageId });
}

function logMockOnCopy(messageId: string, content: string) {
  console.log("[ChatPanel mock] onCopy", {
    messageId,
    contentLength: content.length,
    preview: content.length > 120 ? `${content.slice(0, 120)}…` : content,
  });
}

function logMockOnFeedback(messageId: string, feedback: ChatMessageFeedback) {
  console.log("[ChatPanel mock] onFeedback", { messageId, feedback });
}

function ChatStoryContainer({
  createTransport,
  initialMessages = [],
  onSourceClick,
  onCopy,
  onFeedback,
}: {
  createTransport: () => ChatTransport;
  initialMessages?: ChatMessage[];
  onSourceClick?: (fileId: string, chunkId: string, messageId: string) => void;
  onCopy?: (messageId: string, content: string) => void;
  onFeedback?: (messageId: string, feedback: ChatMessageFeedback) => void;
}) {
  const transportRef = useRef<ChatTransport | null>(null);
  if (!transportRef.current) {
    transportRef.current = createTransport();
  }

  return (
    <div className="w-[900px]">
      <ChatPanel
        transport={transportRef.current}
        initialMessages={initialMessages}
        onSourceClick={(fileId, chunkId, messageId) => {
          logMockOnSourceClick(fileId, chunkId, messageId);
          onSourceClick?.(fileId, chunkId, messageId);
        }}
        onCopy={(messageId, content) => {
          logMockOnCopy(messageId, content);
          onCopy?.(messageId, content);
        }}
        onFeedback={(messageId, feedback) => {
          logMockOnFeedback(messageId, feedback);
          onFeedback?.(messageId, feedback);
        }}
      />
    </div>
  );
}

const imagePreviewUrl1 =
  "https://mp-60e94f73-357b-4c22-9d12-8051b1296bfb.cdn.bspapp.com/kit/pexels-asemirski-36367318.jpg";
const imagePreviewUrl2 =
  "https://mp-60e94f73-357b-4c22-9d12-8051b1296bfb.cdn.bspapp.com/kit/pexels-drewdempsey-36789182.jpg";

const markdownResponse = `这是一个 **Markdown** 流式示例，包含更完整的富文本结构。\n\n### 功能清单\n\n- 支持列表\n- 支持表格\n- 支持代码块\n- 支持图片预览\n\n### 数据概览\n\n| 指标 | 目标值 | 当前值 | 状态 |\n| --- | --- | --- | --- |\n| 首包延迟 | < 250ms | 210ms | ✅ |\n| 错误率 | < 1% | 0.6% | ✅ |\n| 重试成功率 | > 95% | 97.2% | ✅ |\n\n### 图片预览\n\n![海边礁石预览](${imagePreviewUrl1})\n![草地植物预览](${imagePreviewUrl2})\n\n文件信息（仅展示）：\n\n- 文件名：2026Q1_report.pdf\n- 文件ID：doc_pdf_9001\n- 文档版本：doc_pdf_9001_v3\n- 关联页码：12 / 18\n\n> 备注：该图文内容用于演示 Markdown 渲染，不代表真实线上数据。\n\n\`\`\`ts\nconst transport = createSSETransport({\n  url: "/api/chat/stream",\n  headers: { Authorization: "Bearer mock-token" },\n});\n\`\`\``;

const imageMarkdownResponse = `下面是你提供的两张图片预览：\n\n![示例图片一](${imagePreviewUrl1})\n![示例图片二](${imagePreviewUrl2})\n\n文件信息（展示用）：\n\n- 文件名：sample-assets.pdf\n- 文件ID：doc_pdf_demo_01\n- 关联页码：3 / 7`;
const imageLoadErrorResponse = `下面是一个故意失败的图片示例：\n\n![无效图片示例](https://example.invalid/preview-not-found.jpg)\n\n用于验证“图片加载失败”提示是否正常展示。`;
const allMarkdownFormatsResponse = `# 一级标题（H1）
## 二级标题（H2）
### 三级标题（H3）
#### 四级标题（H4）
##### 五级标题（H5）
###### 六级标题（H6）

这是一个普通段落，包含 **加粗文本**、*斜体文本*、~~删除线文本~~、[外部链接](https://example.com) 与 \`inline code\`。

---

> 这是引用块第一行。
> 这是引用块第二行。

- 无序列表项 A
- 无序列表项 B
  - 无序子项 B-1

1. 有序列表项 1
2. 有序列表项 2

- [x] 任务列表：已完成
- [ ] 任务列表：待完成

| 格式 | 示例 | 状态 |
| --- | --- | --- |
| 标题 | H1-H6 | ✅ |
| 文本修饰 | 粗体/斜体/删除线 | ✅ |
| 结构元素 | 引用/分割线/列表 | ✅ |
| 富内容 | 表格/图片/代码块 | ✅ |

![格式示例图片一](${imagePreviewUrl1})
![格式示例图片二](${imagePreviewUrl2})

\`\`\`ts
type MarkdownFormat = "heading" | "table" | "image" | "code";

const enabledFormats: MarkdownFormat[] = ["heading", "table", "image", "code"];
console.log("all formats demo", enabledFormats);
\`\`\``;

const nexusSalesSummaryResponse = `## Sales Analysis Summary

### Key Metrics

| Metric | Value | Change |
| --- | --- | --- |
| Total Revenue | $1.2M | +15% |
| Avg Order Value | $85 | +8% |
| Conversion Rate | 3.2% | +0.5% |

### Top Insights

1. **Q4 Growth**: Revenue increased 23% compared to Q3
2. **Product Mix**: Electronics category drives 45% of sales
3. **Customer Retention**: Repeat customers up 18%

### Recommendations

- Focus marketing on high-performing electronics
- Implement loyalty program to boost retention
- Optimize checkout flow to improve conversion`;

const nexusCodeResponse = `\`\`\`python
def find_primes(n: int) -> list[int]:
    """Find all prime numbers up to n using Sieve of Eratosthenes."""
    if n < 2:
        return []

    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False

    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False

    return [i for i, prime in enumerate(is_prime) if prime]

primes = find_primes(50)
print(primes)
\`\`\``;

const nexusConceptResponse = `Quantum computing is like having a super-powered calculator that can explore many possibilities at once.

**Traditional computers** use bits (0s and 1s), like switches that are either ON or OFF.

**Quantum computers** use qubits that can be 0 and 1 at the same time (superposition). This lets them:

- Process multiple calculations simultaneously
- Solve complex optimization problems much faster
- Handle encryption and simulation tasks

Think of it like reading a book: a regular computer reads one page at a time, while a quantum computer can scan all pages in parallel.`;

const nexusSourceCitationResponse = `## 2025 年报摘要（含来源占位）

营收与利润同比变化见官方披露{{[doc_annual_2025][sec_revenue_table]}}；风险因素与内控说明见{{[doc_annual_2025][sec_risk_factors]}}。

- **结论 A**：华东区贡献度提升，细节见分部数据{{[doc_annual_2025][seg_east_md]}}。
- **结论 B**：供应链条款调整于附注中说明{{[doc_annual_2025][note_supply_chain]}}。

> 角标 \`[1]\`…\`[4]\` 为可点击占位，联调时在 \`onSourceClick(fileId, chunkId, messageId)\` 中映射到 PDF 页码或原文档。`;

const chatDataStructureCode = `// Message types used by ChatPanel (from @kit/chat)\ninterface ChatMessage {\n  id: string; // 消息唯一 ID\n  role: "system" | "user" | "assistant";\n  content: string; // 消息正文，助手侧可为含扩展语法的 Markdown 字符串\n  status?: "idle" | "streaming" | "done" | "error";\n  errorMessage?: string; // 仅当 status 为 "error" 时常见\n}\n\ntype ChatMessageFeedback = "like" | "dislike" | null;\n\n// 发送给 transport.stream 的请求体\ninterface ChatTransportRequest {\n  messages: ChatMessage[]; // 完整上下文（到当前用户消息为止）\n  metadata?: Record<string, unknown>; // 可选：任意 JSON 可序列化字段\n}\n\n// 示例 payload\nconst request: ChatTransportRequest = {\n  messages: [\n    {\n      id: "u-1",\n      role: "user",\n      content: "请根据附带的文档片段，解释营收同比变化",\n      status: "done",\n    },\n  ],\n  metadata: {\n    scene: "storybook-demo",\n    traceId: "trace-20260421-001",\n    locale: "zh-CN",\n  },\n};`;

const chatPanelCallbacksCode = `// ChatPanel 可选回调（与 ChatMessage 并行使用）\nimport type { ChatMessageFeedback } from "@kit/chat";\n\ninterface ChatPanelCallbacks {\n  onSourceClick?: (fileId: string, chunkId: string, messageId: string) => void; // 点击正文内来源角标\n  onCopy?: (messageId: string, content: string) => void; // 复制成功（剪贴板写入成功后）\n  onFeedback?: (messageId: string, feedback: ChatMessageFeedback) => void; // 点赞/点踩/取消\n}\n\n// 示例：用 fileId + chunkId 解析并打开 PDF\ntype FileChunkRef = { fileId: string; chunkId: string; messageId: string };\nconst previewSource = (ref: FileChunkRef) => {\n  // window.open(pdfUrl) / 打开弹层等\n  console.log("preview", ref);\n};`;

const sourceCitationSyntaxCode = `// 语法（行内、与标准 Markdown 混排）\n// {{[fileId][chunkId]}} → 显示为可点击的 [1]、[2]… 角标\n// fileId / chunkId 为业务侧稳定 ID，具体展示（PDF/页码）在 onSourceClick 中解析\n\n const assistantContent =\n  "根据 2025 年报的营收章节{{[doc_annual_2025][sec_revenue]}}，以及风险披露{{[doc_annual_2025][sec_risk]}}，总结如下。";`;

const sseDataStructureCode = `// 应用层事件（解析 SSE 后的统一形状）\ntype ChatStreamEvent = {\n  type: "start" | "delta" | "done" | "error";\n  text?: string; // delta 事件的增量文本\n  message?: string; // 错误描述\n  code?: string; // 错误码（可选）\n};\n\n// 原始 SSE 事件包（解析前）\ninterface SSEEventMessage {\n  event: string; // 例如: "message"\n  data: string; // 字符串化 JSON\n  id?: string; // 事件 ID（可选）\n}\n\n// 示例：SSE data 字段常见内容\nconst ssePacket: SSEEventMessage = {\n  event: "message",\n  data: "{\\"type\\":\\"delta\\",\\"text\\":\\"本周完成了\\"}",\n  id: "evt-001",\n};`;

const sseFlowExampleCode = `// 事件时序（从开始到结束）\nconst streamFlow: ChatStreamEvent[] = [\n  { type: "start" },\n  { type: "delta", text: "本周完成了需求梳理，" },\n  { type: "delta", text: "并补充了 Storybook 示例。" },\n  { type: "done" },\n];\n\n// 失败场景（可触发 ChatPanel 的重试按钮）\nconst errorFlow: ChatStreamEvent[] = [\n  { type: "start" },\n  { type: "error", message: "网关超时", code: "GATEWAY_TIMEOUT" },\n];`;

const sseTableFlowExampleCode = `// 场景：模型以 delta 分片返回 Markdown 表格\nconst tableStreamFlow: ChatStreamEvent[] = [\n  { type: "start" },\n  { type: "delta", text: "以下是本周指标：\\\\n\\\\n" },\n  { type: "delta", text: "| 指标 | 目标 | 实际 |\\\\n" },\n  { type: "delta", text: "| --- | --- | --- |\\\\n" },\n  { type: "delta", text: "| 首包延迟 | < 250ms | 210ms |\\\\n" },\n  { type: "delta", text: "| 错误率 | < 1% | 0.6% |\\\\n" },\n  { type: "delta", text: "| 重试成功率 | > 95% | 97.2% |\\\\n" },\n  { type: "done" },\n];\n\n// 对应原始 SSE 包（服务端逐条推送）\nconst ssePackets: SSEEventMessage[] = [\n  { event: "message", id: "evt-101", data: "{\\"type\\":\\"start\\"}" },\n  { event: "message", id: "evt-102", data: "{\\"type\\":\\"delta\\",\\"text\\":\\"以下是本周指标：\\\\\\\\n\\\\\\\\n\\"}" },\n  { event: "message", id: "evt-103", data: "{\\"type\\":\\"delta\\",\\"text\\":\\"| 指标 | 目标 | 实际 |\\\\\\\\n\\"}" },\n  { event: "message", id: "evt-104", data: "{\\"type\\":\\"delta\\",\\"text\\":\\"| --- | --- | --- |\\\\\\\\n\\"}" },\n  { event: "message", id: "evt-105", data: "{\\"type\\":\\"delta\\",\\"text\\":\\"| 首包延迟 | < 250ms | 210ms |\\\\\\\\n\\"}" },\n  { event: "message", id: "evt-106", data: "{\\"type\\":\\"delta\\",\\"text\\":\\"| 错误率 | < 1% | 0.6% |\\\\\\\\n\\"}" },\n  { event: "message", id: "evt-107", data: "{\\"type\\":\\"delta\\",\\"text\\":\\"| 重试成功率 | > 95% | 97.2% |\\\\\\\\n\\"}" },\n  { event: "message", id: "evt-108", data: "{\\"type\\":\\"done\\"}" },\n];\n\n// 前端将 delta.text 依次拼接后，Markdown 组件即可渲染完整表格`;

function DataContractPanel({
  title,
  description,
  code,
}: {
  title: string;
  description: string;
  code: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </header>
      <pre className="overflow-x-auto bg-slate-50 p-4 text-xs leading-6 text-slate-800">
        <code>{code}</code>
      </pre>
    </section>
  );
}

function DataStructureShowcase() {
  return (
    <div className="w-[900px] space-y-4">
      <DataContractPanel
        title="组件承载数据结构"
        description="ChatPanel 接收与维护的消息结构，以及 transport 请求体。"
        code={chatDataStructureCode}
      />
      <DataContractPanel
        title="ChatPanel 业务事件回调"
        description="与消息列表并列：来源角标、复制、赞踩的对外事件，供宿主应用接入预览与埋点。"
        code={chatPanelCallbacksCode}
      />
      <DataContractPanel
        title="正文扩展：来源角标占位语法"
        description="在助手 Markdown 正文中使用的非标准扩展，用于 RAG/附件引用。"
        code={sourceCitationSyntaxCode}
      />
      <DataContractPanel
        title="SSE 原始结构与业务事件结构"
        description="原始 SSE 包（SSEEventMessage）与解析后的 ChatStreamEvent 对照。"
        code={sseDataStructureCode}
      />
      <DataContractPanel
        title="SSE 时序示例（成功/失败）"
        description="静态展示一次完整流式过程，便于联调与排查。"
        code={sseFlowExampleCode}
      />
      <DataContractPanel
        title="SSE 表格分片示例"
        description="展示 Markdown 表格如何通过多条 SSE delta 事件逐步拼接。"
        code={sseTableFlowExampleCode}
      />
    </div>
  );
}

const basicScenario: MockScenario = {
  resolve(request) {
    const question = request.messages.at(-1)?.content ?? "";
    const answer = `你刚才的问题是：${question}。\n\n这是一个本地 Mock 的流式响应。`;
    return { chunks: chunkText(answer) };
  },
};

const markdownScenario: MockScenario = {
  resolve() {
    return { chunks: chunkText(markdownResponse), chunkDelayMs: 180 };
  },
};

const imageMarkdownScenario: MockScenario = {
  resolve() {
    return { chunks: chunkText(imageMarkdownResponse), chunkDelayMs: 200 };
  },
};

const streamingImagePlaceholderScenario: MockScenario = {
  chunkDelayMs: 200,
  resolve() {
    const url = imagePreviewUrl1;
    const imageChunks = [
      ...chunkText("下面是图片占位演示：\n\n![海边", MOCK_CHUNK_CHAR_SIZE),
      ...chunkText("礁石预览](", MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(url.slice(0, 52), MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(url.slice(52), MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(")\n\n当链接闭合后会显示真实图片。", MOCK_CHUNK_CHAR_SIZE),
    ];
    return { chunks: imageChunks };
  },
};

const streamingImageErrorScenario: MockScenario = {
  chunkDelayMs: 200,
  resolve() {
    return { chunks: chunkText(imageLoadErrorResponse) };
  },
};

const streamingMixedPendingScenario: MockScenario = {
  chunkDelayMs: 200,
  resolve() {
    const u2 = imagePreviewUrl2;
    const chunks = [
      ...chunkText("以下内容用于演示混合占位：\n\n| 指标 | 目", MOCK_CHUNK_CHAR_SIZE),
      ...chunkText("标 | 实际 |\n", MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(
        "| --- | --- | --- |\n| 首包延迟 | < 250ms | 210ms |\n\n```ts\nconst summary = ",
        MOCK_CHUNK_CHAR_SIZE,
      ),
      ...chunkText('"streaming mixed";\n', MOCK_CHUNK_CHAR_SIZE),
      ...chunkText("console.log(summary);\n", MOCK_CHUNK_CHAR_SIZE),
      ...chunkText("```\n\n![混合示例图片](", MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(u2.slice(0, 45), MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(u2.slice(45), MOCK_CHUNK_CHAR_SIZE),
      ...chunkText(")\n\n演示结束。", MOCK_CHUNK_CHAR_SIZE),
    ];
    return { chunks };
  },
};

const allMarkdownFormatsScenario: MockScenario = {
  resolve() {
    return { chunks: chunkText(allMarkdownFormatsResponse), chunkDelayMs: 180 };
  },
};

const sourceCitationStreamScenario: MockScenario = {
  resolve() {
    return { chunks: chunkText(nexusSourceCitationResponse), chunkDelayMs: 160 };
  },
};

const longStreamingScenario: MockScenario = {
  chunkDelayMs: 200,
  resolve() {
    const answer =
      "这是一段较长的流式文本，用于演示在生成过程中点击停止按钮。系统会持续输出多个分片，便于观察 UI 的中间态表现。";
    return { chunks: chunkText(answer) };
  },
};

const flakyAttempts = new Map<string, number>();
const flakyScenario: MockScenario = {
  resolve(request) {
    const key = getLastUserQuestion(request.messages) || "default";
    const count = flakyAttempts.get(key) ?? 0;
    flakyAttempts.set(key, count + 1);

    if (count < 2) {
      return { error: `模拟后端异常（第 ${count + 1} 次），请点击重试` };
    }

    const recoverTable = `| 尝试次数 | 结果 |\n| --- | --- |\n| 1 | ❌ 503 服务暂不可用 |\n| 2 | ❌ 网关超时 |\n| 3 | ✅ 恢复成功 |`;
    return {
      chunks: chunkText(`重试成功，已恢复流式响应。\n\n${recoverTable}`),
    };
  },
};

const smartRouteAttempts = new Map<string, number>();
const richMockScenario: MockScenario = {
  chunkDelayMs: 180,
  resolve(request) {
    const question = getLastUserQuestion(request.messages);
    const normalized = question.toLowerCase();

    if (normalized.includes("重试") || normalized.includes("retry")) {
      const retryKey = `retry:${question || "default"}`;
      const count = smartRouteAttempts.get(retryKey) ?? 0;
      smartRouteAttempts.set(retryKey, count + 1);

      if (count === 0) {
        return {
          error: "已命中重试演示分支：第一次请求故意失败，请点击“重试”触发第二次请求。",
        };
      }

      const retrySummary = [
        "| 步骤 | 说明 |",
        "| --- | --- |",
        "| 第一次请求 | 故意返回错误，验证 UI 错误态 |",
        "| 点击重试 | 复用最后一条用户消息再次发起请求 |",
        "| 第二次请求 | 返回成功内容并结束流式输出 |",
      ].join("\n");

      return {
        chunks: chunkText(`重试链路已恢复成功。\n\n${retrySummary}`),
      };
    }

    if (
      normalized.includes("表格") ||
      normalized.includes("table") ||
      normalized.includes("数据")
    ) {
      const table = buildConversationTable(request.messages, question);
      const response = `已按你的请求生成对话统计表。\n\n${table}\n\n你可以继续输入“重试演示”查看失败恢复流程。`;
      return { chunks: chunkText(response), chunkDelayMs: 180 };
    }

    if (normalized.includes("图片") || normalized.includes("image") || normalized.includes("图")) {
      const imageReply = [
        "已为你返回图片预览与文件信息：",
        "",
        `![示例图片一](${imagePreviewUrl1})`,
        `![示例图片二](${imagePreviewUrl2})`,
        "",
        "文件信息（仅展示）：",
        "- 文件名：demo-report.pdf",
        "- 文件ID：doc_pdf_demo_02",
        "- 页码：5 / 9",
      ].join("\n");

      return { chunks: chunkText(imageReply), chunkDelayMs: 200 };
    }

    if (
      normalized.includes("来源") ||
      normalized.includes("角标") ||
      normalized.includes("citation") ||
      normalized.includes("附件") ||
      normalized.includes("pdf")
    ) {
      return { chunks: chunkText(nexusSourceCitationResponse), chunkDelayMs: 160 };
    }

    if (normalized.includes("全格式") || normalized.includes("all formats")) {
      return { chunks: chunkText(allMarkdownFormatsResponse), chunkDelayMs: 180 };
    }

    if (normalized.includes("代码") || normalized.includes("code")) {
      const snippet = [
        "```ts",
        "async function fetchWithRetry(task: () => Promise<string>, max = 3) {",
        "  for (let attempt = 1; attempt <= max; attempt += 1) {",
        "    try {",
        "      return await task();",
        "    } catch (error) {",
        "      if (attempt === max) throw error;",
        "    }",
        "  }",
        "  throw new Error('unreachable');",
        "}",
        "```",
      ].join("\n");
      return { chunks: chunkText(`这是代码示例分支：\n\n${snippet}`), chunkDelayMs: 180 };
    }

    const fallback = [
      `你输入的是：${question || "（空）"}`,
      "",
      "可试试这些关键字触发不同 Mock 分支：",
      "- 输入“表格总结”：返回 Markdown 表格",
      "- 输入“重试演示”：第一次失败，点击重试后成功",
      "- 输入“来源角标”或 “citation”：返回含 {{[fileId][chunkId]}} 的示例正文",
      "- 输入“全格式示例”：返回完整 Markdown 格式样例",
      "- 输入“代码示例”：返回代码块内容",
    ].join("\n");
    return { chunks: chunkText(fallback) };
  },
};

const longMessages: ChatMessage[] = Array.from({ length: 18 }).map((_, index) => {
  const isUser = index % 2 === 0;
  return {
    id: `history-${index}`,
    role: isUser ? "user" : "assistant",
    content: isUser
      ? `历史问题 ${index / 2 + 1}：请总结上次会议结论。`
      : `历史回复 ${index / 2 + 1}：结论是继续推进模块化设计，并在本周补齐 Storybook 场景。`,
    status: "done",
  };
});

const richMockGuideMessages: ChatMessage[] = [
  {
    id: "rich-guide-1",
    role: "assistant",
    content:
      "欢迎使用 Rich Mock 示例。可尝试关键字：**表格总结**、**重试演示**、**图片示例**、**全格式示例**、**来源角标** / **citation**、**代码示例**，并可在「RichMockWithEvents」中查看 onSourceClick / onCopy / onFeedback 的 Storybook 动作。",
    status: "done",
  },
];

const nexusReferenceMessages: ChatMessage[] = [
  {
    id: "nexus-sample-1",
    role: "assistant",
    content: nexusSalesSummaryResponse,
    status: "done",
  },
  {
    id: "nexus-sample-2",
    role: "assistant",
    content: nexusCodeResponse,
    status: "done",
  },
  {
    id: "nexus-sample-3",
    role: "assistant",
    content: nexusConceptResponse,
    status: "done",
  },
  {
    id: "nexus-sample-4",
    role: "assistant",
    content: nexusSourceCitationResponse,
    status: "done",
  },
  {
    id: "nexus-user-1",
    role: "user",
    content: "请对比去年 Q4 与今年 Q1 的毛利率，并标出来源段落。",
    status: "done",
  },
  {
    id: "nexus-assistant-5",
    role: "assistant",
    content: `| 期间 | 毛利率 | 附注 |
| --- | --- | --- |
| 去年 Q4 | 32.1% | 见合并报表附注{{[doc_annual_2024][note_margin_q4]}} |
| 今年 Q1 | 33.4% | 见季报管理层讨论{{[doc_q1_2026][md_a_margin]}} |

变动原因简述：产品结构优化与原材料锁价，详见附注「分部报告」{{[doc_annual_2025][seg_note]}}。`,
    status: "done",
  },
];

const meta: Meta<typeof ChatPanel> = {
  title: "Components/Chat/ChatPanel",
  component: ChatPanel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ChatPanel 基于 `@kit/chat`，内置多轮会话管理、流式输出和 Markdown 渲染。此处使用内存 Mock Transport 模拟 SSE 数据流，不依赖网络请求。",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicConversation: Story = {
  render: () => (
    <ChatStoryContainer createTransport={() => createInMemoryTransport(basicScenario)} />
  ),
};

export const MarkdownRendering: Story = {
  render: () => (
    <ChatStoryContainer createTransport={() => createInMemoryTransport(markdownScenario)} />
  ),
};

export const MarkdownWithImages: Story = {
  render: () => (
    <ChatStoryContainer createTransport={() => createInMemoryTransport(imageMarkdownScenario)} />
  ),
};

export const StreamingImagePlaceholder: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(streamingImagePlaceholderScenario)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "图片 Markdown 被拆分返回时，先渲染图片占位，语法闭合后再显示真实图片。",
      },
    },
  },
};

export const StreamingImageError: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(streamingImageErrorScenario)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "无效图片地址用于验证图片加载失败态，确保出现错误提示而不是空白。",
      },
    },
  },
};

export const StreamingMixedPending: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(streamingMixedPendingScenario)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "同一条流式回复中混合表格、代码块、图片，验证各类半截格式占位的一致性。",
      },
    },
  },
};

export const MarkdownAllFormats: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(allMarkdownFormatsScenario)}
    />
  ),
};

export const NexusStyleReference: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(basicScenario)}
      initialMessages={nexusReferenceMessages}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "按 NexusAI 风格展示三类助手回复：指标表格、代码块、解释型文本与列表。",
      },
    },
  },
};

export const StreamingWithStop: Story = {
  render: () => (
    <ChatStoryContainer createTransport={() => createInMemoryTransport(longStreamingScenario)} />
  ),
};

export const ErrorAndRetry: Story = {
  render: () => (
    <ChatStoryContainer createTransport={() => createInMemoryTransport(flakyScenario)} />
  ),
};

export const RichMockLogic: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(richMockScenario)}
      initialMessages={richMockGuideMessages}
    />
  ),
};

export const RichMockWithEvents: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(richMockScenario)}
      initialMessages={richMockGuideMessages}
      onSourceClick={fn()}
      onCopy={fn()}
      onFeedback={fn()}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "与 Rich Mock 相同；另注入 `fn()` 供 Actions 查看。所有含 ChatPanel 的 Story 均会在触发回调时于浏览器 console 输出 `[ChatPanel mock]` 日志（见 `ChatStoryContainer`）。",
      },
    },
  },
};

export const StreamingSourceCitations: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(sourceCitationStreamScenario)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "流式分片返回含 `{{[fileId][chunkId]}}` 的助手正文，用于观察角标在生成过程中的表现。",
      },
    },
  },
};

export const DataStructureReference: Story = {
  render: () => <DataStructureShowcase />,
  parameters: {
    docs: {
      description: {
        story:
          "静态展示：消息与请求体、ChatPanel 业务回调、来源角标扩展语法、以及 SSE 事件结构，附中文注释，供联调与评审对照。",
      },
    },
  },
};

export const LongConversation: Story = {
  render: () => (
    <ChatStoryContainer
      createTransport={() => createInMemoryTransport(basicScenario)}
      initialMessages={longMessages}
    />
  ),
};
