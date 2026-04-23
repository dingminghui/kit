import { memo, useCallback } from "react";

import type { ChatMessage, ChatMessageFeedback } from "../types";

import {
  getMessageVariant,
  MESSAGE_VARIANT_CLASSES,
  type RegenerateState,
} from "./chatMessageVariant";
import { MessageActions } from "./MessageActions";
import { AssistantMessageBody, MessageAvatar, UserMessageBody } from "./MessagePieces";

export const MessageItem = memo(
  ({
    message,
    assistantName,
    userAvatarText,
    assistantAvatarText,
    regenerateState,
    onRegenerate,
    onSourceClick,
    onCopy,
    onFeedback,
  }: {
    message: ChatMessage;
    assistantName: string;
    userAvatarText: string;
    assistantAvatarText: string;
    regenerateState: RegenerateState;
    onRegenerate: () => Promise<boolean>;
    onSourceClick?: (fileId: string, chunkId: string, messageId: string) => void;
    onCopy?: (messageId: string, content: string) => void;
    onFeedback?: (messageId: string, feedback: ChatMessageFeedback) => void;
  }) => {
    const handleSourceClick = useCallback(
      (fileId: string, chunkId: string) => onSourceClick?.(fileId, chunkId, message.id),
      [message.id, onSourceClick],
    );
    const variant = getMessageVariant(message);
    const { row, bubble } = MESSAGE_VARIANT_CLASSES[variant];
    const showAssistantLabel = variant === "assistant";
    const showMessageActions =
      message.role === "assistant" && (message.status === "done" || message.status === "error");
    const content =
      message.role === "user" ? (
        <UserMessageBody message={message} />
      ) : (
        <AssistantMessageBody message={message} onSourceClick={handleSourceClick} />
      );

    return (
      <div className={row}>
        <MessageAvatar
          variant={variant}
          userAvatarText={userAvatarText}
          assistantAvatarText={assistantAvatarText}
        />
        <div className="kit-chat-panel__message-content">
          {showAssistantLabel ? (
            <div className="kit-chat-panel__sender-label">{assistantName}</div>
          ) : null}
          <div className={bubble}>{content}</div>
          {showMessageActions ? (
            <MessageActions
              messageId={message.id}
              content={message.content}
              onRegenerate={onRegenerate}
              regenerateState={regenerateState}
              {...(onCopy ? { onCopy } : {})}
              {...(onFeedback ? { onFeedback } : {})}
            />
          ) : null}
        </div>
      </div>
    );
  },
);

MessageItem.displayName = "MessageItem";
