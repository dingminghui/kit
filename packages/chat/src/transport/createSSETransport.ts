import type {
  ChatSSEParser,
  ChatStreamEvent,
  ChatTransport,
  ChatTransportRequest,
  SSEEventMessage,
} from "../types";

export interface CreateSSETransportOptions {
  url: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
  parser?: ChatSSEParser;
  createBody?: (request: ChatTransportRequest) => unknown;
}

function parseSSEMessage(block: string): SSEEventMessage | null {
  const lines = block.split("\n");
  let event = "message";
  let id: string | undefined;
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const key = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1).trimStart();

    if (key === "event") {
      event = value || "message";
      continue;
    }

    if (key === "id") {
      id = value;
      continue;
    }

    if (key === "data") {
      dataLines.push(value);
    }
  }

  if (dataLines.length === 0 && event === "message" && !id) {
    return null;
  }

  const message: SSEEventMessage = {
    event,
    data: dataLines.join("\n"),
  };
  if (id !== undefined) {
    message.id = id;
  }
  return message;
}

function extractText(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const textValue = record["text"];
  if (typeof textValue === "string") {
    return textValue;
  }

  const deltaValue = record["delta"];
  if (typeof deltaValue === "string") {
    return deltaValue;
  }

  const delta = record["delta"];
  if (
    delta &&
    typeof delta === "object" &&
    typeof (delta as { content?: unknown }).content === "string"
  ) {
    return (delta as { content: string }).content;
  }

  const choices = record["choices"];
  if (Array.isArray(choices)) {
    const first = choices[0] as { delta?: { content?: unknown }; text?: unknown } | undefined;
    if (first) {
      if (typeof first.text === "string") {
        return first.text;
      }
      if (typeof first.delta?.content === "string") {
        return first.delta.content;
      }
    }
  }

  return "";
}

function defaultSSEParser(message: SSEEventMessage): ChatStreamEvent | null {
  const eventType = message.event.toLowerCase();

  if (message.data === "[DONE]" || eventType === "done") {
    return { type: "done" };
  }

  if (eventType === "start") {
    return { type: "start" };
  }

  let parsedPayload: unknown;
  let isJSONPayload = false;
  try {
    parsedPayload = JSON.parse(message.data);
    isJSONPayload = true;
  } catch {
    parsedPayload = message.data;
  }

  if (isJSONPayload && parsedPayload && typeof parsedPayload === "object") {
    const payload = parsedPayload as Record<string, unknown>;
    const payloadType = payload["type"];

    if (payloadType === "start" || payloadType === "done") {
      return { type: payloadType };
    }

    if (payloadType === "error") {
      const event: ChatStreamEvent = {
        type: "error",
        message: typeof payload["message"] === "string" ? payload["message"] : "流式请求失败",
      };
      if (typeof payload["code"] === "string") {
        event.code = payload["code"];
      }
      return event;
    }

    const payloadError = payload["error"];
    if (payloadError && typeof payloadError === "object") {
      const error = payloadError as { message?: unknown; code?: unknown };
      const event: ChatStreamEvent = {
        type: "error",
        message: typeof error.message === "string" ? error.message : "流式请求失败",
      };
      if (typeof error.code === "string") {
        event.code = error.code;
      }
      return event;
    }

    const textFromPayload = extractText(payload);
    if (textFromPayload) {
      return {
        type: "delta",
        text: textFromPayload,
      };
    }
  }

  if (eventType === "error") {
    return {
      type: "error",
      message: message.data ? message.data : "流式请求失败",
    };
  }

  if (eventType === "delta" || eventType === "message") {
    const text = extractText(parsedPayload);
    if (text) {
      return {
        type: "delta",
        text,
      };
    }

    if (message.data.trim()) {
      return {
        type: "delta",
        text: message.data,
      };
    }
  }

  return null;
}

export function createSSETransport(options: CreateSSETransportOptions): ChatTransport {
  const fetchImpl = options.fetchImpl ?? fetch;
  const parser = options.parser ?? defaultSSEParser;
  const method = options.method ?? "POST";

  let activeAbortController: AbortController | null = null;
  let streaming = false;

  return {
    async stream(request, callbacks) {
      if (streaming) {
        throw new Error("当前已有流式请求进行中");
      }

      const abortController = new AbortController();
      activeAbortController = abortController;
      streaming = true;

      const body = options.createBody
        ? options.createBody(request)
        : {
            messages: request.messages,
            stream: true,
            ...(request.metadata ?? {}),
          };

      try {
        const response = await fetchImpl(options.url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("响应体为空，无法读取流数据");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let started = false;
        let doneReceived = false;
        let buffer = "";

        const emitStart = () => {
          if (started) {
            return;
          }
          started = true;
          callbacks.onStart?.();
        };

        const emitEvent = (event: ChatStreamEvent) => {
          if (event.type === "start") {
            emitStart();
            return;
          }

          if (event.type === "delta") {
            emitStart();
            if (event.text) {
              callbacks.onDelta(event.text, event);
            }
            return;
          }

          if (event.type === "done") {
            emitStart();
            doneReceived = true;
            callbacks.onDone?.();
            return;
          }

          if (event.type === "error") {
            const error = new Error(event.message ?? "流式请求失败");
            throw error;
          }
        };

        const processChunk = (chunkText: string) => {
          const blocks = chunkText.replaceAll("\r\n", "\n").split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const message = parseSSEMessage(block);
            if (!message) {
              continue;
            }

            const event = parser(message);
            if (!event) {
              continue;
            }

            emitEvent(event);
            if (doneReceived) {
              return;
            }
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (!value) {
            continue;
          }
          buffer += decoder.decode(value, { stream: true });
          processChunk(buffer);
          if (doneReceived) {
            break;
          }
        }

        if (!doneReceived) {
          buffer += decoder.decode();
          if (buffer.trim()) {
            const message = parseSSEMessage(buffer.replaceAll("\r\n", "\n"));
            if (message) {
              const event = parser(message);
              if (event) {
                emitEvent(event);
              }
            }
          }
        }

        if (!doneReceived) {
          callbacks.onDone?.();
        }
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error("未知流式错误");
        callbacks.onError?.(normalizedError);
        throw normalizedError;
      } finally {
        if (activeAbortController === abortController) {
          activeAbortController = null;
        }
        streaming = false;
      }
    },
    abort() {
      activeAbortController?.abort();
      activeAbortController = null;
      streaming = false;
    },
    isStreaming() {
      return streaming;
    },
  };
}
