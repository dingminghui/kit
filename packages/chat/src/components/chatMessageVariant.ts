import type { ChatMessage } from "../types";

export type MessageVariant = "assistant" | "user" | "error";

export type RegenerateState = "enabled" | "disabled" | "hidden";

export const MESSAGE_VARIANT_CLASSES: Record<
  MessageVariant,
  {
    row: string;
    bubble: string;
    avatar: string;
  }
> = {
  assistant: {
    row: "kit-chat-panel__message-row kit-chat-panel__message-row--assistant",
    bubble: "kit-chat-panel__message kit-chat-panel__message--assistant",
    avatar: "kit-chat-panel__avatar kit-chat-panel__avatar--assistant",
  },
  user: {
    row: "kit-chat-panel__message-row kit-chat-panel__message-row--user",
    bubble: "kit-chat-panel__message kit-chat-panel__message--user",
    avatar: "kit-chat-panel__avatar kit-chat-panel__avatar--user",
  },
  error: {
    row: "kit-chat-panel__message-row kit-chat-panel__message-row--error",
    bubble: "kit-chat-panel__message kit-chat-panel__message--error",
    avatar: "kit-chat-panel__avatar kit-chat-panel__avatar--error",
  },
};

export function getMessageVariant(message: ChatMessage): MessageVariant {
  if (message.role === "user") {
    return "user";
  }

  if (message.status === "error") {
    return "error";
  }

  return "assistant";
}
