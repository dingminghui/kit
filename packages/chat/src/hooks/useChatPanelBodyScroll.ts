import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

import type { ChatMessage } from "../types";
import { throttleVoid } from "../utils/throttle";

const USER_LEFT_BOTTOM_EPSILON_PX = 80;
const SCROLL_FOLLOW_THROTTLE_MS = 100;
const CANCEL_FOLLOW_ON_SCROLL_THROTTLE_MS = 50;

export function useChatPanelBodyScroll(messages: readonly ChatMessage[], isStreaming: boolean) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const followThisReplyRef = useRef(true);
  const isProgrammaticRef = useRef(false);

  const performScrollToEnd = useCallback(() => {
    if (!followThisReplyRef.current) {
      return;
    }
    const end = scrollEndRef.current;
    if (!end) {
      return;
    }
    isProgrammaticRef.current = true;
    end.scrollIntoView({ block: "start", inline: "nearest" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isProgrammaticRef.current = false;
      });
    });
  }, []);

  const throttledScrollToEnd = useMemo(
    () => throttleVoid(performScrollToEnd, SCROLL_FOLLOW_THROTTLE_MS),
    [performScrollToEnd],
  );

  const cancelFollowIfUserScrolled = useCallback(() => {
    if (isProgrammaticRef.current) {
      return;
    }
    if (!isStreaming) {
      return;
    }
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const distance = body.scrollHeight - body.scrollTop - body.clientHeight;
    if (distance > USER_LEFT_BOTTOM_EPSILON_PX) {
      followThisReplyRef.current = false;
    }
  }, [isStreaming]);

  const throttledOnScroll = useMemo(
    () => throttleVoid(cancelFollowIfUserScrolled, CANCEL_FOLLOW_ON_SCROLL_THROTTLE_MS),
    [cancelFollowIfUserScrolled],
  );

  useLayoutEffect(() => {
    if (!followThisReplyRef.current) {
      return;
    }
    if (isStreaming) {
      throttledScrollToEnd();
    } else {
      performScrollToEnd();
    }
  }, [isStreaming, messages, performScrollToEnd, throttledScrollToEnd]);

  const pinToBottom = useCallback(() => {
    followThisReplyRef.current = true;
  }, []);

  return {
    bodyRef,
    scrollEndRef,
    throttledOnScroll,
    pinToBottom,
  };
}
