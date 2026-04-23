export type ChatRole = "system" | "user" | "assistant";

export type ChatMessageStatus = "idle" | "streaming" | "done" | "error";

export type ChatMessageFeedback = "like" | "dislike" | null;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status?: ChatMessageStatus;
  errorMessage?: string;
}

export interface ChatSessionState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
}

export type ChatStreamEventType = "start" | "delta" | "done" | "error";

export interface ChatStreamEvent {
  type: ChatStreamEventType;
  text?: string;
  message?: string;
  code?: string;
}

export interface SSEEventMessage {
  event: string;
  data: string;
  id?: string;
}

export type ChatSSEParser = (event: SSEEventMessage) => ChatStreamEvent | null;

export interface ChatTransportRequest {
  messages: ChatMessage[];
  metadata?: Record<string, unknown>;
}

export interface ChatTransportCallbacks {
  onStart?: () => void;
  onDelta: (text: string, event: ChatStreamEvent) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export interface ChatTransport {
  stream: (request: ChatTransportRequest, callbacks: ChatTransportCallbacks) => Promise<void>;
  abort: () => void;
  isStreaming: () => boolean;
}

export interface UseChatSessionOptions {
  transport: ChatTransport;
  initialMessages?: ChatMessage[];
}

export interface UseChatSessionResult extends ChatSessionState {
  sendMessage: (content: string, metadata?: Record<string, unknown>) => Promise<boolean>;
  stop: () => void;
  retryLast: (metadata?: Record<string, unknown>) => Promise<boolean>;
  clear: () => void;
}
