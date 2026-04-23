import type { HighlightPluginProps, RenderHighlightTargetProps } from "@react-pdf-viewer/highlight";
import { useCallback, useMemo } from "react";

import { SelectionActionAddon } from "../components/SelectionActionAddon";
import type { PdfTextSelectionPayload, PdfViewerTextSelectionOptions } from "../types";

export interface UseTextSelectionParams {
  textSelection?: PdfViewerTextSelectionOptions;
}

export interface UseTextSelectionReturn {
  textSelectionPluginProps?: HighlightPluginProps;
}

function buildTextSelectionPayload({
  selectedText,
  highlightAreas,
  selectionData,
  selectionRegion,
}: RenderHighlightTargetProps): PdfTextSelectionPayload {
  return {
    selectedText,
    highlightAreas,
    selectionRegion,
    ...(selectionData ? { selectionData } : {}),
  };
}

export function useTextSelection({ textSelection }: UseTextSelectionParams): UseTextSelectionReturn {
  const textSelectionEnabled = textSelection !== undefined;
  const copyToClipboard = textSelection?.copyToClipboard ?? true;
  const onCopy = textSelection?.onCopy;
  const onSelectionExport = textSelection?.onSelectionExport;

  const handleCopy = useCallback(
    async (props: RenderHighlightTargetProps) => {
      const payload = buildTextSelectionPayload(props);

      if (copyToClipboard) {
        try {
          await navigator.clipboard.writeText(payload.selectedText);
        } catch (e) {
          console.warn("[TextSelection] 复制到剪贴板失败:", e);
        }
      }

      onCopy?.(payload.selectedText, payload);
      props.cancel();
    },
    [copyToClipboard, onCopy],
  );

  const handleQuote = useCallback(
    (props: RenderHighlightTargetProps) => {
      const payload = buildTextSelectionPayload(props);
      onSelectionExport?.(payload);
      props.cancel();
    },
    [onSelectionExport],
  );

  const renderHighlightTarget = useCallback(
    (props: RenderHighlightTargetProps) => {
      if (!textSelectionEnabled) {
        return <></>;
      }

      if (props.selectedText.trim().length === 0) {
        return <></>;
      }

      const selectionRegion = props.selectionRegion;
      const showQuote = !!onSelectionExport;

      return (
        <div
          className="pdf-viewer-text-selection-target"
          style={{
            left: `${selectionRegion.left}%`,
            top: `${selectionRegion.top + selectionRegion.height}%`,
          }}
        >
          <SelectionActionAddon
            canCopy
            canQuote={showQuote}
            showQuote={showQuote}
            onCopy={() => {
              void handleCopy(props);
            }}
            onQuote={() => {
              handleQuote(props);
            }}
          />
        </div>
      );
    },
    [handleCopy, handleQuote, onSelectionExport, textSelectionEnabled],
  );

  const textSelectionPluginProps = useMemo<HighlightPluginProps | undefined>(() => {
    if (!textSelectionEnabled) {
      return undefined;
    }

    return { renderHighlightTarget };
  }, [textSelectionEnabled, renderHighlightTarget]);

  return textSelectionPluginProps ? { textSelectionPluginProps } : {};
}
