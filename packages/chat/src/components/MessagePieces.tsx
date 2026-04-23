import type { ChatIconKey } from "../icons";
import { ChatIcon } from "../icons";
import { MarkdownMessage } from "../markdown";
import type { ChatMessage } from "../types";

import { MESSAGE_VARIANT_CLASSES, type MessageVariant } from "./chatMessageVariant";

export function MessageAvatar({
  variant,
  userAvatarText,
  assistantAvatarText,
}: {
  variant: MessageVariant;
  userAvatarText: string;
  assistantAvatarText: string;
}) {
  const avatarClassName = MESSAGE_VARIANT_CLASSES[variant].avatar;

  if (variant === "user") {
    return (
      <span className={avatarClassName} aria-hidden="true">
        {userAvatarText.trim().length > 0 ? (
          userAvatarText
        ) : (
          <ChatIcon name="chat.user" className="kit-chat-panel__avatar-icon" />
        )}
      </span>
    );
  }

  const iconName: ChatIconKey = variant === "error" ? "status.error" : "chat.assistant";
  const title = variant === "assistant" ? assistantAvatarText : undefined;
  return (
    <span className={avatarClassName} title={title} aria-hidden="true">
      <ChatIcon name={iconName} className="kit-chat-panel__avatar-icon" />
    </span>
  );
}

function MessageError({ text }: { text: string }) {
  return (
    <p className="kit-chat-panel__message-error">
      <ChatIcon name="status.error" className="kit-chat-panel__message-error-icon" />
      {text}
    </p>
  );
}

export function AssistantMessageBody({
  message,
  onSourceClick,
}: {
  message: ChatMessage;
  onSourceClick?: (fileId: string, chunkId: string) => void;
}) {
  const markdownStreamState = message.status === "streaming" ? "streaming" : "done";
  const errorMessage = message.status === "error" ? (message.errorMessage ?? "生成失败") : null;

  return (
    <>
      <MarkdownMessage
        content={message.content}
        streamState={markdownStreamState}
        {...(onSourceClick ? { onSourceClick } : {})}
      />
      {errorMessage ? <MessageError text={errorMessage} /> : null}
    </>
  );
}

export function UserMessageBody({ message }: { message: ChatMessage }) {
  return <p className="kit-chat-panel__message-text">{message.content}</p>;
}
