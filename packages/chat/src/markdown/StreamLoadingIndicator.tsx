import type { HTMLAttributes } from "react";

import "./StreamLoadingIndicator.css";

const DOT_COUNT = 8;

export type StreamLoadingIndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export const StreamLoadingIndicator = ({
  className,
  ...props
}: StreamLoadingIndicatorProps) => {
  const rootClass = ["kit-chat-markdown__dot-spinner", className].filter(Boolean).join(" ");
  return (
    <span className={rootClass} aria-hidden="true" {...props}>
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <span key={index} className="kit-chat-markdown__dot-spinner-dot" />
      ))}
    </span>
  );
};

StreamLoadingIndicator.displayName = "StreamLoadingIndicator";
