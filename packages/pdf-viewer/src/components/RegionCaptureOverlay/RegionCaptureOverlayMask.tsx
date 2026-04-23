import type { ElementSize } from "../../hooks/useElementSize";
import type { MaskRect } from "./resolveMaskRect";

export interface RegionCaptureOverlayMaskProps {
  mediaSize: ElementSize;
  maskRect: MaskRect | null;
}

export function RegionCaptureOverlayMask({
  mediaSize,
  maskRect,
}: RegionCaptureOverlayMaskProps) {
  return (
    <svg
      className="region-capture-overlay-mask"
      width={mediaSize.width || 1}
      height={mediaSize.height || 1}
    >
      <defs>
        <mask id="region-capture-mask">
          <rect width="100%" height="100%" fill="white" />
          {maskRect ? (
            <rect x={maskRect.x} y={maskRect.y} width={maskRect.w} height={maskRect.h} fill="black" />
          ) : null}
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.20)"
        mask="url(#region-capture-mask)"
      />
    </svg>
  );
}
