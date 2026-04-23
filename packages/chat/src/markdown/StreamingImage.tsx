import { useEffect, useState } from "react";

import { ChatIcon } from "../icons";

type StreamingImageStatus = "loading" | "loaded" | "failed";
type StreamingImageOverlayVariant = "loading" | "failed";
const imageStatusCache = new Map<string, StreamingImageStatus>();

export interface StreamingImageProps {
  src: string;
  alt: string;
  title?: string | undefined;
}

function resolveImageStatus(src: string): StreamingImageStatus {
  if (!src) {
    return "failed";
  }

  return imageStatusCache.get(src) ?? "loading";
}

function getOverlayVariant(status: StreamingImageStatus): StreamingImageOverlayVariant | null {
  switch (status) {
    case "loading":
      return "loading";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

function ImageStatusOverlay({ variant }: { variant: StreamingImageOverlayVariant }) {
  if (variant === "loading") {
    return (
      <span className="kit-chat-markdown__img-placeholder">
        <ChatIcon name="content.image" className="kit-chat-markdown__img-placeholder-icon" />
        <span>图片加载中...</span>
      </span>
    );
  }

  return (
    <span className="kit-chat-markdown__img-failed">
      <span>图片加载失败</span>
      <ChatIcon name="status.error" className="kit-chat-markdown__img-failed-icon" />
    </span>
  );
}

export const StreamingImage = ({ src, alt, title }: StreamingImageProps) => {
  const [status, setStatus] = useState<StreamingImageStatus>(() => resolveImageStatus(src));

  useEffect(() => {
    setStatus(resolveImageStatus(src));
  }, [src]);

  const overlayVariant = getOverlayVariant(status);

  return (
    <span className="kit-chat-markdown__img-frame">
      {overlayVariant ? <ImageStatusOverlay variant={overlayVariant} /> : null}
      <img
        src={src}
        alt={alt}
        title={title}
        loading="lazy"
        className="kit-chat-markdown__img"
        data-status={status}
        onLoad={() => {
          imageStatusCache.set(src, "loaded");
          setStatus("loaded");
        }}
        onError={() => {
          imageStatusCache.set(src, "failed");
          setStatus("failed");
        }}
      />
    </span>
  );
};

StreamingImage.displayName = "StreamingImage";
