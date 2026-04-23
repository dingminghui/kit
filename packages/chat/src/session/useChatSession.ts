import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatMessage, UseChatSessionOptions, UseChatSessionResult } from "../types";
import { createChatMessage, markMessageDone } from "./message-utils";

function updateMessageById(
  messages: ChatMessage[],
  messageId: string,
  updater: (message: ChatMessage) => ChatMessage,
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== messageId) {
      return message;
    }
    return updater(message);
  });
}

export function useChatSession(options: UseChatSessionOptions): UseChatSessionResult {
  const { initialMessages = [], transport } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  const activeAssistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const runStream = useCallback(
    async (
      stateMessages: ChatMessage[],
      requestMessages: ChatMessage[],
      assistantMessageId: string,
      metadata: Record<string, unknown> = {},
    ) => {
      setMessages(stateMessages);
      setError(null);
      setIsStreaming(true);
      activeAssistantIdRef.current = assistantMessageId;

      try {
        await transport.stream(
          {
            messages: requestMessages,
            metadata,
          },
          {
            onDelta: (text) => {
              setMessages((previousMessages) =>
                updateMessageById(previousMessages, assistantMessageId, (message) => ({
                  ...message,
                  content: `${message.content}${text}`,
                  status: "streaming",
                })),
              );
            },
            onDone: () => {
              setMessages((previousMessages) =>
                updateMessageById(previousMessages, assistantMessageId, (message) => {
                  const nextMessage: ChatMessage = {
                    ...message,
                    status: "done",
                  };
                  delete nextMessage.errorMessage;
                  return nextMessage;
                }),
              );
            },
          },
        );
        return true;
      } catch (streamError) {
        const normalizedError =
          streamError instanceof Error ? streamError : new Error("聊天请求失败，请稍后重试");

        if (normalizedError.name === "AbortError") {
          setMessages((previousMessages) =>
            updateMessageById(previousMessages, assistantMessageId, (message) =>
              markMessageDone(message),
            ),
          );
          return false;
        }

        setError(normalizedError.message);
        setMessages((previousMessages) =>
          updateMessageById(previousMessages, assistantMessageId, (message) => ({
            ...message,
            status: "error",
            errorMessage: normalizedError.message,
          })),
        );
        return false;
      } finally {
        activeAssistantIdRef.current = null;
        setIsStreaming(false);
      }
    },
    [transport],
  );

  const sendMessage = useCallback(
    async (content: string, metadata: Record<string, unknown> = {}) => {
      const normalizedContent = content.trim();
      if (!normalizedContent || isStreaming) {
        return false;
      }

      const userMessage = createChatMessage("user", normalizedContent, "done");
      const assistantMessage = createChatMessage("assistant", "", "streaming");

      const requestMessages = [...messagesRef.current, userMessage];
      const stateMessages = [...requestMessages, assistantMessage];

      return runStream(stateMessages, requestMessages, assistantMessage.id, metadata);
    },
    [isStreaming, runStream],
  );

  const retryLast = useCallback(
    async (metadata: Record<string, unknown> = {}) => {
      if (isStreaming) {
        return false;
      }

      const currentMessages = messagesRef.current;
      let lastUserIndex = -1;

      for (let index = currentMessages.length - 1; index >= 0; index -= 1) {
        if (currentMessages[index]?.role === "user") {
          lastUserIndex = index;
          break;
        }
      }

      if (lastUserIndex === -1) {
        return false;
      }

      const requestMessages = currentMessages.slice(0, lastUserIndex + 1);
      const assistantMessage = createChatMessage("assistant", "", "streaming");
      const stateMessages = [...requestMessages, assistantMessage];

      return runStream(stateMessages, requestMessages, assistantMessage.id, metadata);
    },
    [isStreaming, runStream],
  );

  const stop = useCallback(() => {
    if (!transport.isStreaming()) {
      return;
    }

    transport.abort();

    const activeAssistantId = activeAssistantIdRef.current;
    if (activeAssistantId) {
      setMessages((previousMessages) =>
        updateMessageById(previousMessages, activeAssistantId, (message) =>
          markMessageDone(message),
        ),
      );
    }

    activeAssistantIdRef.current = null;
    setIsStreaming(false);
  }, [transport]);

  const clear = useCallback(() => {
    if (transport.isStreaming()) {
      transport.abort();
    }

    activeAssistantIdRef.current = null;
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, [transport]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stop,
    retryLast,
    clear,
  };
}
