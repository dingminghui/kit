import type { ChatMessage, ChatRole } from "../types";

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createChatMessage(
  role: ChatRole,
  content: string,
  status: ChatMessage["status"] = "done",
): ChatMessage {
  return {
    id: createMessageId(),
    role,
    content,
    status,
  };
}

export function markMessageDone(message: ChatMessage): ChatMessage {
  if (message.status !== "streaming") {
    return message;
  }
  return {
    ...message,
    status: "done",
  };
}
