import { SpecialZoomLevel } from "@react-pdf-viewer/core";
import { useMemo } from "react";

import { DEFAULT_THEME_COLOR } from "../PdfViewerContext";
import type {
  PdfHighlightItem,
  PdfViewerControls,
  PdfViewerHighlighting,
  PdfViewerRegionCaptureOptions,
  PdfViewerSelection,
  PdfViewerTextSelectionOptions,
} from "../types";

const EMPTY_HIGHLIGHTS: PdfHighlightItem[] = [];

export interface UsePdfViewerConfigParams {
  defaultScale?: number | SpecialZoomLevel;
  themeColor?: string;
  controls?: PdfViewerControls;
  highlighting?: PdfViewerHighlighting;
  selection?: PdfViewerSelection;
}

export interface PdfViewerConfig {
  defaultScale: number | SpecialZoomLevel;
  themeColor: string;
  downloadEnabled: boolean;
  pageNavigationEnabled: boolean;
  zoomEnabled: boolean;
  thumbnailsVisible: boolean;
  thumbnailsControl: PdfViewerControls["thumbnails"];
  textSelectionOptions: PdfViewerTextSelectionOptions | undefined;
  regionCaptureOptions: PdfViewerRegionCaptureOptions | undefined;
  highlights: PdfHighlightItem[];
  activeHighlightId: string | null;
  shouldShowLayout: boolean;
}

export function usePdfViewerConfig({
  defaultScale,
  themeColor,
  controls,
  highlighting,
  selection,
}: UsePdfViewerConfigParams): PdfViewerConfig {
  return useMemo(() => {
    const resolvedDefaultScale = defaultScale ?? SpecialZoomLevel.PageFit;
    const resolvedThemeColor = themeColor ?? DEFAULT_THEME_COLOR;
    const downloadEnabled = controls?.download ?? false;
    const pageNavigationEnabled = controls?.pageNavigation ?? false;
    const zoomEnabled = controls?.zoom ?? false;
    const thumbnailsControl = controls?.thumbnails;
    const thumbnailsVisible = thumbnailsControl?.visible ?? false;
    const textSelectionOptions = selection?.text === false ? undefined : selection?.text;
    const regionCaptureOptions = selection?.region === false ? undefined : selection?.region;
    const highlights = highlighting?.items ?? EMPTY_HIGHLIGHTS;
    const activeHighlightId = highlighting?.activeId ?? null;
    const shouldShowLayout =
      downloadEnabled ||
      pageNavigationEnabled ||
      zoomEnabled ||
      thumbnailsVisible ||
      regionCaptureOptions !== undefined;

    return {
      defaultScale: resolvedDefaultScale,
      themeColor: resolvedThemeColor,
      downloadEnabled,
      pageNavigationEnabled,
      zoomEnabled,
      thumbnailsVisible,
      thumbnailsControl,
      textSelectionOptions,
      regionCaptureOptions,
      highlights,
      activeHighlightId,
      shouldShowLayout,
    };
  }, [controls, defaultScale, highlighting, selection, themeColor]);
}
