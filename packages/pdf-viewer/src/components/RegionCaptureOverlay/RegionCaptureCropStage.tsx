import type { CSSProperties, RefObject } from "react";
import { useCallback } from "react";
import type { Crop, PixelCrop } from "react-image-crop";
import ReactCrop from "react-image-crop";

import type { ElementSize } from "../../hooks/useElementSize";
import { RegionCaptureSelectionAddon } from "./RegionCaptureSelectionAddon";

export interface RegionCaptureCropStageProps {
  canSubmit: boolean;
  cropVars: CSSProperties;
  draftCrop: Crop | undefined;
  mediaSize: ElementSize;
  onCancel: () => void;
  onCopy: () => Promise<void>;
  onCropComplete: (crop: PixelCrop) => void;
  onDraftCropChange: (crop: Crop) => void;
  onQuote: () => Promise<void>;
  showQuote: boolean;
  wrapperRef: RefObject<HTMLDivElement | null>;
}

export function RegionCaptureCropStage({
  canSubmit,
  cropVars,
  draftCrop,
  mediaSize,
  onCancel,
  onCopy,
  onCropComplete,
  onDraftCropChange,
  onQuote,
  showQuote,
  wrapperRef,
}: RegionCaptureCropStageProps) {
  const renderSelectionAddon = useCallback(
    () => (
      <RegionCaptureSelectionAddon
        canCopy={canSubmit}
        canQuote={canSubmit && showQuote}
        showQuote={showQuote}
        onCancel={onCancel}
        onCopy={onCopy}
        onQuote={onQuote}
      />
    ),
    [canSubmit, onCancel, onCopy, onQuote, showQuote],
  );

  return (
    <div ref={wrapperRef} className="region-capture-crop-wrapper">
      {mediaSize.width > 0 && mediaSize.height > 0 ? (
        <div className="region-capture-crop" style={cropVars}>
          <ReactCrop
            onChange={onDraftCropChange}
            onComplete={onCropComplete}
            renderSelectionAddon={renderSelectionAddon}
            style={{ width: "100%", height: "100%" }}
            {...(draftCrop ? { crop: draftCrop } : {})}
          >
            <div
              style={{
                width: mediaSize.width,
                height: mediaSize.height,
                display: "block",
              }}
            />
          </ReactCrop>
        </div>
      ) : null}
    </div>
  );
}
