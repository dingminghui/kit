import type { GetFilePlugin } from "@react-pdf-viewer/get-file";
import { getFilePlugin } from "@react-pdf-viewer/get-file";
import type {
  HighlightPlugin as TextSelectionPlugin,
  HighlightPluginProps as TextSelectionPluginProps,
} from "@react-pdf-viewer/highlight";
import {
  highlightPlugin as textSelectionHighlightPlugin,
  Trigger as TextSelectionTrigger,
} from "@react-pdf-viewer/highlight";
import type { PageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import type { ThumbnailPlugin } from "@react-pdf-viewer/thumbnail";
import { thumbnailPlugin } from "@react-pdf-viewer/thumbnail";
import type { ZoomPlugin } from "@react-pdf-viewer/zoom";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { useMemo } from "react";

import type { HighlightPluginInstance } from "../plugins/highlightPlugin";
import { highlightPlugin } from "../plugins/highlightPlugin";
import type { PageCanvasStore, RegionCapturePluginInstance } from "../plugins/regionCapturePlugin";
import { regionCapturePlugin } from "../plugins/regionCapturePlugin";
import { RenderSpinner } from "../ui/RenderSpinner";
import { useShallowStableObject, useStableHookValue } from "./useStableHookValue";

function renderThumbnailSpinner() {
  return <RenderSpinner />;
}

export interface AvailablePdfViewerPlugins {
  thumbnailPluginInstance: ThumbnailPlugin;
  pageNavigationPluginInstance: PageNavigationPlugin;
  zoomPluginInstance: ZoomPlugin;
  getFilePluginInstance: GetFilePlugin;
  regionCapturePluginInstance: RegionCapturePluginInstance;
  highlightPluginInstance: HighlightPluginInstance;
  textSelectionPluginInstance: TextSelectionPlugin;
  pageCanvasStore: PageCanvasStore;
}

export interface UseAvailablePdfViewerPluginsParams {
  textSelectionPluginProps?: TextSelectionPluginProps;
}

// react-pdf-viewer 的插件工厂内部会用到 hooks，需要始终在组件顶层调用。
export function useAvailablePdfViewerPlugins({
  textSelectionPluginProps,
}: UseAvailablePdfViewerPluginsParams): AvailablePdfViewerPlugins {
  const stableTextSelectionPluginProps = useShallowStableObject(textSelectionPluginProps);
  const textSelectionPluginConfig = useMemo(
    () => ({
      trigger: TextSelectionTrigger.TextSelection,
      ...stableTextSelectionPluginProps,
    }),
    [stableTextSelectionPluginProps],
  );

  const thumbnailPluginResult = thumbnailPlugin({ renderSpinner: renderThumbnailSpinner });
  const pageNavigationPluginResult = pageNavigationPlugin();
  const zoomPluginResult = zoomPlugin();
  const getFilePluginResult = getFilePlugin();
  const textSelectionPluginResult = textSelectionHighlightPlugin(textSelectionPluginConfig);
  const regionCapturePluginInstance = useMemo(() => regionCapturePlugin(), []);
  const highlightPluginInstance = useMemo(() => highlightPlugin(), []);

  return {
    thumbnailPluginInstance: useStableHookValue(thumbnailPluginResult, []),
    pageNavigationPluginInstance: useStableHookValue(pageNavigationPluginResult, []),
    zoomPluginInstance: useStableHookValue(zoomPluginResult, []),
    getFilePluginInstance: useStableHookValue(getFilePluginResult, []),
    regionCapturePluginInstance,
    highlightPluginInstance,
    textSelectionPluginInstance: useStableHookValue(textSelectionPluginResult, [
      textSelectionPluginConfig,
    ]),
    pageCanvasStore: regionCapturePluginInstance.pageCanvasStore,
  };
}
