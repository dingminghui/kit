import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/thumbnail/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "./styles/highlight.css";
import "./styles/scrollbar.css";
import "./styles/selectionAddon.css";
import "./styles/textSelection.css";

import { PdfViewerBody } from "./components/PdfViewerBody";
import { PdfViewerControlsBar } from "./components/PdfViewerHeader/PdfViewerControlsBar";
import { usePdfViewerConfig } from "./hooks/usePdfViewerConfig";
import { useHighlightNavigation } from "./hooks/useHighlightNavigation";
import { usePdfViewerPlugins } from "./hooks/usePdfViewerPlugins";
import { useRegionCapture } from "./hooks/useRegionCapture";
import { useSidebarState } from "./hooks/useSidebarState";
import { useTextSelection } from "./hooks/useTextSelection";
import { thumbnailPageLayout } from "./layouts/thumbnailPageLayout";
import { PdfViewerContext } from "./PdfViewerContext";
import type { PdfViewerControls, PdfViewerHighlighting, PdfViewerSelection } from "./types";
import { resolvePdfWorkerUrl } from "./utils/resolvePdfWorkerUrl";

type PdfViewerRootProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "content">;

export interface PdfViewerProps extends PdfViewerRootProps {
  /** PDF 文件地址，支持 URL、base64 或项目内相对路径。 */
  fileUrl: string;
  /** pdf.js worker 地址，未传时使用默认 CDN 地址。 */
  workerUrl?: string;
  /** 初始缩放比例，默认使用 `SpecialZoomLevel.PageFit`。 */
  defaultScale?: number | SpecialZoomLevel;
  /** 主题色，用于按钮激活态和局部高亮样式。 */
  themeColor?: string;
  /** 顶部控制栏和缩略图能力配置。 */
  controls?: PdfViewerControls;
  /** 高亮块数据和当前激活项。 */
  highlighting?: PdfViewerHighlighting;
  /** 文本选择与区域截图能力配置。 */
  selection?: PdfViewerSelection;
}

export interface PdfViewerRef {
  /** 按高亮块 id 滚动到对应区域，成功命中时返回 `true`。 */
  scrollToHighlight: (chunkId: string) => Promise<boolean>;
}

function assertPdfViewerRequiredProps(fileUrl: string): void {
  if (typeof fileUrl !== "string" || fileUrl.trim().length === 0) {
    throw new Error(
      '[PdfViewer] Missing required "fileUrl" prop. Pass a PDF URL, base64 string, or project-relative path.',
    );
  }
}

export const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(function PdfViewer(
  {
    fileUrl,
    workerUrl,
    defaultScale,
    themeColor,
    controls,
    highlighting,
    selection,
    className,
    style,
    ...rootProps
  }: PdfViewerProps,
  ref,
) {
  assertPdfViewerRequiredProps(fileUrl);

  const contentRef = useRef<HTMLDivElement>(null);
  const viewerConfig = usePdfViewerConfig({
    ...(defaultScale !== undefined ? { defaultScale } : {}),
    ...(themeColor !== undefined ? { themeColor } : {}),
    ...(controls !== undefined ? { controls } : {}),
    ...(highlighting !== undefined ? { highlighting } : {}),
    ...(selection !== undefined ? { selection } : {}),
  });

  const { isSidebarOpen, onToggleSidebar } = useSidebarState({
    enabled: viewerConfig.thumbnailsVisible,
    ...(viewerConfig.thumbnailsControl?.defaultOpen !== undefined
      ? { defaultOpen: viewerConfig.thumbnailsControl.defaultOpen }
      : {}),
    ...(viewerConfig.thumbnailsControl?.open !== undefined
      ? { open: viewerConfig.thumbnailsControl.open }
      : {}),
    ...(viewerConfig.thumbnailsControl?.onOpenChange
      ? { onOpenChange: viewerConfig.thumbnailsControl.onOpenChange }
      : {}),
  });

  const { textSelectionPluginProps } = useTextSelection(
    viewerConfig.textSelectionOptions ? { textSelection: viewerConfig.textSelectionOptions } : {},
  );

  const pluginInstances = usePdfViewerPlugins({
    download: viewerConfig.downloadEnabled,
    thumbnail: viewerConfig.thumbnailsVisible,
    pageNavigation: viewerConfig.pageNavigationEnabled,
    zoom: viewerConfig.zoomEnabled,
    regionCapture: viewerConfig.regionCaptureOptions !== undefined,
    highlight: viewerConfig.highlights.length > 0,
    textSelection: viewerConfig.textSelectionOptions !== undefined,
    ...(textSelectionPluginProps ? { textSelectionPluginProps } : {}),
  });

  const { scrollToHighlight } = useHighlightNavigation({
    activeHighlightId: viewerConfig.activeHighlightId,
    fileUrl,
    highlights: viewerConfig.highlights,
    ...(pluginInstances.highlightPluginInstance?.jumpToPosition
      ? { jumpToPosition: pluginInstances.highlightPluginInstance.jumpToPosition }
      : {}),
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollToHighlight,
    }),
    [scrollToHighlight],
  );

  const {
    isRegionCaptureActive,
    onToggleRegionCapture,
    handleRegionCopy,
    handleRegionQuote,
    handleRegionCancel,
  } = useRegionCapture({
    pageCanvasStore: pluginInstances.pageCanvasStore,
    contentRef,
    ...(viewerConfig.regionCaptureOptions
      ? { regionCapture: viewerConfig.regionCaptureOptions }
      : {}),
  });

  const headerElement = viewerConfig.shouldShowLayout ? (
    <PdfViewerControlsBar
      defaultScale={viewerConfig.defaultScale}
      downloadEnabled={viewerConfig.downloadEnabled}
      getFilePluginInstance={pluginInstances.getFilePluginInstance}
      isRegionCaptureActive={isRegionCaptureActive}
      isSidebarOpen={isSidebarOpen}
      onToggleRegionCapture={onToggleRegionCapture}
      onToggleSidebar={onToggleSidebar}
      pageNavigationEnabled={viewerConfig.pageNavigationEnabled}
      pageNavigationPluginInstance={pluginInstances.pageNavigationPluginInstance}
      regionCaptureEnabled={viewerConfig.regionCaptureOptions !== undefined}
      thumbnailsVisible={viewerConfig.thumbnailsVisible}
      zoomEnabled={viewerConfig.zoomEnabled}
      zoomPluginInstance={pluginInstances.zoomPluginInstance}
    />
  ) : null;

  const rootClassName = ["pdf-viewer-container", className].filter(Boolean).join(" ");
  const rootStyle = useMemo(
    () =>
      ({
        width: "100%",
        height: "100%",
        ...style,
        "--rpv-core__page-layer-box-shadow": "none",
      }) as CSSProperties,
    [style],
  );
  const contextValue = useMemo(
    () => ({
      themeColor: viewerConfig.themeColor,
      highlights: viewerConfig.highlights,
      activeHighlightId: viewerConfig.activeHighlightId,
    }),
    [viewerConfig.activeHighlightId, viewerConfig.highlights, viewerConfig.themeColor],
  );

  return (
    <div className={rootClassName} style={rootStyle} {...rootProps}>
      <PdfViewerContext.Provider value={contextValue}>
        <Worker workerUrl={resolvePdfWorkerUrl(workerUrl)}>
          <PdfViewerBody
            showLayout={viewerConfig.shouldShowLayout}
            header={headerElement}
            thumbnailPluginInstance={pluginInstances.thumbnailPluginInstance}
            isSidebarOpen={isSidebarOpen}
            contentRef={contentRef}
            regionCapture={viewerConfig.regionCaptureOptions !== undefined}
            isRegionCaptureActive={isRegionCaptureActive}
            onRegionCopy={handleRegionCopy}
            onRegionQuote={handleRegionQuote}
            onRegionCancel={handleRegionCancel}
          >
            <Viewer
              fileUrl={fileUrl}
              defaultScale={viewerConfig.defaultScale}
              plugins={pluginInstances.allPlugins}
              pageLayout={thumbnailPageLayout}
            />
          </PdfViewerBody>
        </Worker>
      </PdfViewerContext.Provider>
    </div>
  );
});

PdfViewer.displayName = "PdfViewer";
