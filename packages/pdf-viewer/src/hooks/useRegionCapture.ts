import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import type { PixelCrop } from "react-image-crop";

import { exportRegionFromPdf } from "../components/RegionCaptureOverlay/exportRegionFromPdf";
import type { PageCanvasStore } from "../plugins/regionCapturePlugin";
import type { PdfViewerRegionCaptureOptions } from "../types";

export interface UseRegionCaptureParams {
  regionCapture?: PdfViewerRegionCaptureOptions;
  pageCanvasStore: PageCanvasStore | null;
  contentRef: RefObject<HTMLDivElement | null>;
}

export interface UseRegionCaptureReturn {
  isRegionCaptureActive: boolean;
  onToggleRegionCapture: () => void;
  handleRegionCopy: (crop: PixelCrop) => Promise<boolean>;
  handleRegionQuote?: (crop: PixelCrop) => Promise<boolean>;
  handleRegionCancel: () => void;
}

export function useRegionCapture({
  regionCapture,
  pageCanvasStore,
  contentRef,
}: UseRegionCaptureParams): UseRegionCaptureReturn {
  const regionCaptureEnabled = regionCapture !== undefined;
  const copyToClipboard = regionCapture?.copyToClipboard ?? true;
  const onCopy = regionCapture?.onCopy;
  const onSelectionExport = regionCapture?.onSelectionExport;
  const [isRegionCaptureActive, setIsRegionCaptureActive] = useState(false);

  const onToggleRegionCapture = useCallback(() => {
    if (!regionCaptureEnabled) {
      return;
    }
    setIsRegionCaptureActive((v) => !v);
  }, [regionCaptureEnabled]);

  useEffect(() => {
    if (!regionCaptureEnabled) {
      setIsRegionCaptureActive(false);
    }
  }, [regionCaptureEnabled]);

  const resolveRegionSelectionPayload = useCallback(
    (crop: PixelCrop) => {
      const scrollContainer = contentRef.current;
      if (!scrollContainer || !pageCanvasStore) {
        console.warn("[RegionCapture] 缺少 scrollContainer 或 pageCanvasStore");
        return null;
      }

      const selectionPayload = exportRegionFromPdf({ crop, scrollContainer, pageCanvasStore });
      if (!selectionPayload) {
        console.warn("[RegionCapture] 导出失败，请检查选区是否在有效页面内");
        return null;
      }

      return selectionPayload;
    },
    [contentRef, pageCanvasStore],
  );

  const handleRegionCopy = useCallback(
    async (crop: PixelCrop) => {
      const selectionPayload = resolveRegionSelectionPayload(crop);
      if (!selectionPayload) {
        return false;
      }

      if (copyToClipboard) {
        try {
          await navigator.clipboard.writeText(selectionPayload.imageDataUrl);
        } catch (e) {
          console.warn("[RegionCapture] 复制到剪贴板失败:", e);
        }
      }

      onCopy?.(selectionPayload.imageDataUrl, selectionPayload);
      setIsRegionCaptureActive(false);
      return true;
    },
    [copyToClipboard, onCopy, resolveRegionSelectionPayload],
  );

  const handleRegionQuote = useCallback(
    async (crop: PixelCrop) => {
      const selectionPayload = resolveRegionSelectionPayload(crop);
      if (!selectionPayload) {
        return false;
      }

      onSelectionExport?.(selectionPayload);
      setIsRegionCaptureActive(false);
      return true;
    },
    [onSelectionExport, resolveRegionSelectionPayload],
  );

  const handleRegionCancel = useCallback(() => {
    setIsRegionCaptureActive(false);
  }, []);

  return {
    isRegionCaptureActive,
    onToggleRegionCapture,
    handleRegionCopy,
    ...(regionCaptureEnabled && onSelectionExport ? { handleRegionQuote } : {}),
    handleRegionCancel,
  };
}
