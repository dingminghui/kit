import { type FormEvent, useCallback, useId, useMemo, useState } from "react";

import "./ChatPanel.css";

import { useChatPanelBodyScroll } from "../hooks/useChatPanelBodyScroll";
import { ChatIcon } from "../icons";
import { useChatSession } from "../session";
import type { ChatMessage, ChatMessageFeedback, ChatTransport } from "../types";

import type { RegenerateState } from "./chatMessageVariant";
import { MessageItem } from "./MessageItem";

const COMPOSER_SUBMIT_ICON_CLASS = "kit-chat-panel__composer-submit-icon";

type ComposerSubmitProps = {
  isStreaming: boolean;
  hasSendableText: boolean;
  sendButtonText: string;
  stopButtonText: string;
  onStop: () => void;
};

function ComposerSubmitControl({
  isStreaming,
  hasSendableText,
  sendButtonText,
  stopButtonText,
  onStop,
}: ComposerSubmitProps) {
  if (isStreaming) {
    return (
      <button
        type="button"
        className="kit-chat-panel__composer-submit"
        aria-label={stopButtonText}
        onClick={onStop}
      >
        <ChatIcon name="action.stop" size={20} className={COMPOSER_SUBMIT_ICON_CLASS} />
      </button>
    );
  }

  return (
    <button
      type="submit"
      className="kit-chat-panel__composer-submit"
      disabled={!hasSendableText}
      aria-label={sendButtonText}
    >
      <ChatIcon name="action.arrow-up" size={20} className={COMPOSER_SUBMIT_ICON_CLASS} />
    </button>
  );
}

ComposerSubmitControl.displayName = "ComposerSubmitControl";

type ChatPanelComposerProps = {
  inputId: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder: string;
  error: string | null;
  isStreaming: boolean;
  hasSendableText: boolean;
  sendButtonText: string;
  stopButtonText: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
};

function ChatPanelComposer({
  inputId,
  inputValue,
  onInputChange,
  placeholder,
  error,
  isStreaming,
  hasSendableText,
  sendButtonText,
  stopButtonText,
  onSubmit,
  onStop,
}: ChatPanelComposerProps) {
  return (
    <form onSubmit={onSubmit} className="kit-chat-panel__composer">
      <label htmlFor={inputId} className="kit-chat-panel__sr-only">
        聊天输入框
      </label>
      <div className="kit-chat-panel__composer-inner">
        {error ? <p className="kit-chat-panel__global-error">{error}</p> : null}
        <div className="kit-chat-panel__composer-field-row">
          <textarea
            id={inputId}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={placeholder}
            className="kit-chat-panel__textarea"
          />
          <div className="kit-chat-panel__composer-footer">
            <ComposerSubmitControl
              isStreaming={isStreaming}
              hasSendableText={hasSendableText}
              sendButtonText={sendButtonText}
              stopButtonText={stopButtonText}
              onStop={onStop}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

ChatPanelComposer.displayName = "ChatPanelComposer";

export interface ChatPanelProps {
  transport: ChatTransport;
  className?: string;
  initialMessages?: ChatMessage[];
  assistantName?: string;
  userAvatarText?: string;
  assistantAvatarText?: string;
  placeholder?: string;
  emptyText?: string;
  sendButtonText?: string;
  stopButtonText?: string;
  onSourceClick?: (fileId: string, chunkId: string, messageId: string) => void;
  onCopy?: (messageId: string, content: string) => void;
  onFeedback?: (messageId: string, feedback: ChatMessageFeedback) => void;
}

export const ChatPanel = ({
  transport,
  className,
  initialMessages = [],
  assistantName = "NexusAI",
  userAvatarText = "U",
  assistantAvatarText = "AI",
  placeholder = "输入问题后发送...",
  emptyText = "开始一段新对话吧",
  sendButtonText = "发送",
  stopButtonText = "停止",
  onSourceClick,
  onCopy,
  onFeedback,
}: ChatPanelProps) => {
  const inputId = useId();
  const [inputValue, setInputValue] = useState("");

  const { messages, isStreaming, error, sendMessage, stop, retryLast } = useChatSession({
    transport,
    initialMessages,
  });

  const { bodyRef, scrollEndRef, throttledOnScroll, pinToBottom } = useChatPanelBodyScroll(
    messages,
    isStreaming,
  );

  const hasSendableText = inputValue.trim().length > 0;
  const canSend = hasSendableText && !isStreaming;
  const assistantRegenerateStateById = useMemo(() => {
    const stateById = new Map<string, RegenerateState>();
    let latestAssistantId: string | null = null;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") {
        latestAssistantId = messages[index]?.id ?? null;
        break;
      }
    }

    for (const message of messages) {
      if (message.role !== "assistant") {
        continue;
      }

      const state: RegenerateState =
        message.id === latestAssistantId ? (isStreaming ? "disabled" : "enabled") : "hidden";
      stateById.set(message.id, state);
    }

    return stateById;
  }, [isStreaming, messages]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSend) {
        return;
      }
      pinToBottom();
      const text = inputValue;
      setInputValue("");
      await sendMessage(text);
    },
    [canSend, inputValue, pinToBottom, sendMessage],
  );

  const handleRegenerate = useCallback(async () => {
    pinToBottom();
    return retryLast();
  }, [pinToBottom, retryLast]);

  return (
    <div className={["kit-chat-panel", className].filter(Boolean).join(" ")}>
      <div className="kit-chat-panel__header">AI Chat</div>

      <div className="kit-chat-panel__viewport">
        <div ref={bodyRef} onScroll={throttledOnScroll} className="kit-chat-panel__body">
          {messages.length === 0 ? (
            <div className="kit-chat-panel__empty-state">
              <p className="kit-chat-panel__initial-hint">{emptyText}</p>
            </div>
          ) : (
            <div
              className="kit-chat-panel__messages"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  assistantName={assistantName}
                  userAvatarText={userAvatarText}
                  assistantAvatarText={assistantAvatarText}
                  regenerateState={assistantRegenerateStateById.get(message.id) ?? "hidden"}
                  onRegenerate={handleRegenerate}
                  onSourceClick={onSourceClick}
                  onCopy={onCopy}
                  onFeedback={onFeedback}
                />
              ))}
            </div>
          )}
          <div ref={scrollEndRef} className="kit-chat-panel__scroll-end" aria-hidden="true" />
        </div>

        <ChatPanelComposer
          inputId={inputId}
          inputValue={inputValue}
          onInputChange={setInputValue}
          placeholder={placeholder}
          error={error}
          isStreaming={isStreaming}
          hasSendableText={hasSendableText}
          sendButtonText={sendButtonText}
          stopButtonText={stopButtonText}
          onSubmit={handleSubmit}
          onStop={stop}
        />
      </div>
    </div>
  );
};

ChatPanel.displayName = "ChatPanel";
