import type { Plugin } from "@react-pdf-viewer/core";
import type {
  HighlightPlugin as TextSelectionPlugin,
  HighlightPluginProps as TextSelectionPluginProps,
} from "@react-pdf-viewer/highlight";
import { useMemo } from "react";

import type { AvailablePdfViewerPlugins } from "./useAvailablePdfViewerPlugins";
import { useAvailablePdfViewerPlugins } from "./useAvailablePdfViewerPlugins";

export interface PdfViewerPluginInstances {
  thumbnailPluginInstance: AvailablePdfViewerPlugins["thumbnailPluginInstance"] | null;
  pageNavigationPluginInstance: AvailablePdfViewerPlugins["pageNavigationPluginInstance"] | null;
  zoomPluginInstance: AvailablePdfViewerPlugins["zoomPluginInstance"] | null;
  getFilePluginInstance: AvailablePdfViewerPlugins["getFilePluginInstance"] | null;
  regionCapturePluginInstance: AvailablePdfViewerPlugins["regionCapturePluginInstance"] | null;
  highlightPluginInstance: AvailablePdfViewerPlugins["highlightPluginInstance"] | null;
  textSelectionPluginInstance: TextSelectionPlugin | null;
  allPlugins: Plugin[];
  pageCanvasStore: AvailablePdfViewerPlugins["pageCanvasStore"] | null;
}

export interface UsePdfViewerPluginsParams {
  download: boolean;
  thumbnail: boolean;
  pageNavigation: boolean;
  zoom: boolean;
  regionCapture: boolean;
  highlight: boolean;
  textSelection: boolean;
  textSelectionPluginProps?: TextSelectionPluginProps;
}

interface EnabledPdfViewerPlugins {
  download: boolean;
  thumbnail: boolean;
  pageNavigation: boolean;
  zoom: boolean;
  regionCapture: boolean;
  highlight: boolean;
  textSelection: boolean;
}

function resolveEnabledPlugins(
  availablePlugins: AvailablePdfViewerPlugins,
  {
    download,
    thumbnail,
    pageNavigation,
    zoom,
    regionCapture,
    highlight,
    textSelection,
  }: EnabledPdfViewerPlugins,
): Plugin[] {
  const nextPlugins: Plugin[] = [];

  if (thumbnail) nextPlugins.push(availablePlugins.thumbnailPluginInstance);
  if (pageNavigation) nextPlugins.push(availablePlugins.pageNavigationPluginInstance);
  if (zoom) nextPlugins.push(availablePlugins.zoomPluginInstance);
  if (download) nextPlugins.push(availablePlugins.getFilePluginInstance);
  if (regionCapture) nextPlugins.push(availablePlugins.regionCapturePluginInstance.plugin);
  if (highlight) nextPlugins.push(availablePlugins.highlightPluginInstance.plugin);
  if (textSelection) nextPlugins.push(availablePlugins.textSelectionPluginInstance);

  return nextPlugins;
}

export function usePdfViewerPlugins({
  download,
  thumbnail,
  pageNavigation,
  zoom,
  regionCapture,
  highlight,
  textSelection,
  textSelectionPluginProps,
}: UsePdfViewerPluginsParams): PdfViewerPluginInstances {
  const availablePlugins = useAvailablePdfViewerPlugins({
    ...(textSelectionPluginProps ? { textSelectionPluginProps } : {}),
  });
  const {
    getFilePluginInstance,
    highlightPluginInstance,
    pageCanvasStore,
    pageNavigationPluginInstance,
    regionCapturePluginInstance,
    textSelectionPluginInstance,
    thumbnailPluginInstance,
    zoomPluginInstance,
  } = availablePlugins;

  const allPlugins = useMemo<Plugin[]>(() => {
    return resolveEnabledPlugins(
      {
        getFilePluginInstance,
        highlightPluginInstance,
        pageCanvasStore,
        pageNavigationPluginInstance,
        regionCapturePluginInstance,
        textSelectionPluginInstance,
        thumbnailPluginInstance,
        zoomPluginInstance,
      },
      {
        download,
        thumbnail,
        pageNavigation,
        zoom,
        regionCapture,
        highlight,
        textSelection,
      },
    );
  }, [
    download,
    getFilePluginInstance,
    highlight,
    highlightPluginInstance,
    pageNavigation,
    pageCanvasStore,
    pageNavigationPluginInstance,
    regionCapture,
    regionCapturePluginInstance,
    textSelection,
    textSelectionPluginInstance,
    thumbnail,
    thumbnailPluginInstance,
    zoom,
    zoomPluginInstance,
  ]);

  return useMemo(
    () => ({
      thumbnailPluginInstance: thumbnail ? thumbnailPluginInstance : null,
      pageNavigationPluginInstance: pageNavigation ? pageNavigationPluginInstance : null,
      zoomPluginInstance: zoom ? zoomPluginInstance : null,
      getFilePluginInstance: download ? getFilePluginInstance : null,
      regionCapturePluginInstance: regionCapture ? regionCapturePluginInstance : null,
      highlightPluginInstance: highlight ? highlightPluginInstance : null,
      textSelectionPluginInstance: textSelection ? textSelectionPluginInstance : null,
      allPlugins,
      pageCanvasStore: regionCapture ? pageCanvasStore : null,
    }),
    [
      allPlugins,
      download,
      getFilePluginInstance,
      highlight,
      highlightPluginInstance,
      pageNavigation,
      pageNavigationPluginInstance,
      pageCanvasStore,
      regionCapture,
      regionCapturePluginInstance,
      textSelection,
      textSelectionPluginInstance,
      thumbnail,
      thumbnailPluginInstance,
      zoom,
      zoomPluginInstance,
    ],
  );
}
