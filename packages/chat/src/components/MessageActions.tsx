import { useCallback, useEffect, useRef, useState } from "react";

import { ChatIcon } from "../icons";
import type { ChatMessageFeedback } from "../types";

import type { RegenerateState } from "./chatMessageVariant";

export function MessageActions({
  messageId,
  content,
  onRegenerate,
  regenerateState,
  onCopy,
  onFeedback,
}: {
  messageId: string;
  content: string;
  onRegenerate: () => Promise<boolean>;
  regenerateState: RegenerateState;
  onCopy?: (messageId: string, content: string) => void;
  onFeedback?: (messageId: string, feedback: ChatMessageFeedback) => void;
}) {
  const [feedback, setFeedback] = useState<ChatMessageFeedback>(null);
  const [copyTooltip, setCopyTooltip] = useState<"复制" | "复制完成">("复制");
  const [isCopyTooltipOpen, setIsCopyTooltipOpen] = useState(false);
  const copyTooltipResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTooltipResetRef.current) {
        clearTimeout(copyTooltipResetRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      if (copyTooltipResetRef.current) {
        clearTimeout(copyTooltipResetRef.current);
      }
      setCopyTooltip("复制完成");
      setIsCopyTooltipOpen(true);
      copyTooltipResetRef.current = setTimeout(() => {
        setCopyTooltip("复制");
        setIsCopyTooltipOpen(false);
        copyTooltipResetRef.current = null;
      }, 2000);
      onCopy?.(messageId, content);
    } catch {
      void 0;
    }
  }, [content, messageId, onCopy]);

  const handleRegenerate = useCallback(() => {
    void onRegenerate();
  }, [onRegenerate]);

  const onLike = useCallback(() => {
    setFeedback((current) => {
      const nextFeedback = current === "like" ? null : "like";
      onFeedback?.(messageId, nextFeedback);
      return nextFeedback;
    });
  }, [messageId, onFeedback]);

  const onDislike = useCallback(() => {
    setFeedback((current) => {
      const nextFeedback = current === "dislike" ? null : "dislike";
      onFeedback?.(messageId, nextFeedback);
      return nextFeedback;
    });
  }, [messageId, onFeedback]);

  return (
    <div className="kit-chat-panel__message-actions" role="toolbar" aria-label="消息操作">
      <button
        type="button"
        className={
          isCopyTooltipOpen
            ? "kit-chat-panel__action-btn kit-chat-panel__action-btn--tooltip-forced"
            : "kit-chat-panel__action-btn"
        }
        data-tooltip={copyTooltip}
        aria-label={copyTooltip}
        onClick={handleCopy}
      >
        <ChatIcon name="action.copy" className="kit-chat-panel__action-icon" />
      </button>
      {regenerateState !== "hidden" ? (
        <button
          type="button"
          className="kit-chat-panel__action-btn"
          data-tooltip="重新生成"
          aria-label="重新生成"
          onClick={handleRegenerate}
          disabled={regenerateState === "disabled"}
        >
          <ChatIcon name="action.regenerate" className="kit-chat-panel__action-icon" />
        </button>
      ) : null}
      <button
        type="button"
        className="kit-chat-panel__action-btn"
        data-tooltip="点赞"
        aria-label="点赞"
        aria-pressed={feedback === "like"}
        onClick={onLike}
      >
        <ChatIcon
          name={feedback === "like" ? "action.like.solid" : "action.like"}
          className="kit-chat-panel__action-icon"
        />
      </button>
      <button
        type="button"
        className="kit-chat-panel__action-btn"
        data-tooltip="点踩"
        aria-label="点踩"
        aria-pressed={feedback === "dislike"}
        onClick={onDislike}
      >
        <ChatIcon
          name={feedback === "dislike" ? "action.dislike.solid" : "action.dislike"}
          className="kit-chat-panel__action-icon"
        />
      </button>
    </div>
  );
}
