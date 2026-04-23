import { useCallback, useMemo, useState } from "react";
import type { Crop, PixelCrop } from "react-image-crop";

import type { ElementSize } from "../../hooks/useElementSize";

export interface UseRegionCaptureOverlayStateParams {
  mediaSize: ElementSize;
  onCopy: (crop: PixelCrop) => Promise<boolean>;
  onQuote?: (crop: PixelCrop) => Promise<boolean>;
}

export interface UseRegionCaptureOverlayStateReturn {
  draftCrop: Crop | undefined;
  committedCrop: PixelCrop | undefined;
  visibleCrop: Crop | PixelCrop | null;
  canSubmit: boolean;
  setDraftCrop: (crop: Crop) => void;
  setCommittedCrop: (crop: PixelCrop | undefined) => void;
  resetSelection: () => void;
  handleCopy: () => Promise<void>;
  handleQuote: () => Promise<void>;
}

function isCropVisible(crop: Crop | PixelCrop | undefined): crop is Crop | PixelCrop {
  return !!crop && crop.width > 0 && crop.height > 0;
}

export function useRegionCaptureOverlayState({
  mediaSize: _mediaSize,
  onCopy,
  onQuote,
}: UseRegionCaptureOverlayStateParams): UseRegionCaptureOverlayStateReturn {
  const [draftCrop, setDraftCrop] = useState<Crop>();
  const [committedCrop, setCommittedCrop] = useState<PixelCrop>();

  const resetSelection = useCallback(() => {
    setDraftCrop(undefined);
    setCommittedCrop(undefined);
  }, []);

  const visibleCrop = useMemo(() => {
    if (isCropVisible(draftCrop)) {
      return draftCrop;
    }

    if (isCropVisible(committedCrop)) {
      return committedCrop;
    }

    return null;
  }, [committedCrop, draftCrop]);

  const canSubmit = useMemo(() => isCropVisible(committedCrop), [committedCrop]);

  const handleCopy = useCallback(async () => {
    if (!committedCrop) {
      return;
    }

    await onCopy(committedCrop);
  }, [committedCrop, onCopy]);

  const handleQuote = useCallback(async () => {
    if (!committedCrop) {
      return;
    }

    await onQuote?.(committedCrop);
  }, [committedCrop, onQuote]);

  return {
    draftCrop,
    committedCrop,
    visibleCrop,
    canSubmit,
    setDraftCrop,
    setCommittedCrop,
    resetSelection,
    handleCopy,
    handleQuote,
  };
}
