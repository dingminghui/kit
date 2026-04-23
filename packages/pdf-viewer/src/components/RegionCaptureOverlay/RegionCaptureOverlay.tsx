import type { CSSProperties } from "react";
import { useCallback, useMemo, useRef } from "react";
import * as ReactDOM from "react-dom";
import type { PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { useElementSize } from "../../hooks/useElementSize";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useOverlayPortal } from "../../hooks/useOverlayPortal";
import { useThemeColor } from "../../PdfViewerContext";
import { hexToRgba } from "../../utils/hexToRgba";
import "./RegionCaptureOverlay.css";
import { RegionCaptureCropStage } from "./RegionCaptureCropStage";
import { RegionCaptureOverlayMask } from "./RegionCaptureOverlayMask";
import { resolveMaskRect } from "./resolveMaskRect";
import { useRegionCaptureOverlayState } from "./useRegionCaptureOverlayState";

export interface RegionCaptureOverlayProps {
  onCopy: (crop: PixelCrop) => Promise<boolean>;
  onQuote?: (crop: PixelCrop) => Promise<boolean>;
  onCancel: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function RegionCaptureOverlay({
  onCopy,
  onQuote,
  onCancel,
  scrollContainerRef,
}: RegionCaptureOverlayProps) {
  const themeColor = useThemeColor();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { portalTarget, portalReady } = useOverlayPortal(scrollContainerRef);
  const mediaSize = useElementSize(wrapperRef, portalReady);
  useEscapeKey(onCancel);

  const {
    draftCrop,
    visibleCrop,
    canSubmit,
    setDraftCrop,
    setCommittedCrop,
    handleCopy,
    handleQuote,
  } =
    useRegionCaptureOverlayState({
      mediaSize,
      onCopy,
      ...(onQuote ? { onQuote } : {}),
    });

  const handleCropComplete = useCallback(
    (nextCrop: PixelCrop) => {
      if (nextCrop.width <= 0 || nextCrop.height <= 0) {
        setCommittedCrop(undefined);
        return;
      }

      setCommittedCrop(nextCrop);
    },
    [setCommittedCrop],
  );

  const cropVars = useMemo(
    () =>
      ({
        "--region-capture-handle-color": themeColor,
        "--region-capture-border-color": hexToRgba(themeColor, 0.75),
      }) as CSSProperties,
    [themeColor],
  );

  const maskRect = useMemo(
    () => resolveMaskRect(visibleCrop, mediaSize),
    [mediaSize, visibleCrop],
  );

  if (!portalReady || !portalTarget) return null;

  return ReactDOM.createPortal(
    <div className="region-capture-overlay">
      <RegionCaptureOverlayMask mediaSize={mediaSize} maskRect={maskRect} />
      <RegionCaptureCropStage
        canSubmit={canSubmit}
        cropVars={cropVars}
        draftCrop={draftCrop}
        mediaSize={mediaSize}
        onCancel={onCancel}
        onCopy={handleCopy}
        onCropComplete={handleCropComplete}
        onDraftCropChange={setDraftCrop}
        onQuote={handleQuote}
        showQuote={!!onQuote}
        wrapperRef={wrapperRef}
      />
    </div>,
    portalTarget,
  );
}
