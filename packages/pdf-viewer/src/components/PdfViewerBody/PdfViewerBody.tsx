import type { ReactNode, RefObject } from "react";

import type { ThumbnailPlugin } from "@react-pdf-viewer/thumbnail";

import { PreviewLayout } from "../../layouts/PreviewLayout";
import { Sidebar } from "../../layouts/Sidebar";
import type { RegionCaptureOverlayProps } from "../RegionCaptureOverlay";
import { RegionCaptureOverlay } from "../RegionCaptureOverlay";
import { ThumbnailItem } from "../ThumbnailItem";

export interface PdfViewerBodyProps {
  showLayout: boolean;
  children: ReactNode;
  header?: ReactNode;
  thumbnailPluginInstance: ThumbnailPlugin | null;
  isSidebarOpen: boolean;
  contentRef: RefObject<HTMLDivElement | null>;
  regionCapture: boolean;
  isRegionCaptureActive: boolean;
  onRegionCopy: RegionCaptureOverlayProps["onCopy"];
  onRegionQuote?: RegionCaptureOverlayProps["onQuote"];
  onRegionCancel: RegionCaptureOverlayProps["onCancel"];
}

export function PdfViewerBody({
  showLayout,
  children,
  header,
  thumbnailPluginInstance,
  isSidebarOpen,
  contentRef,
  regionCapture,
  isRegionCaptureActive,
  onRegionCopy,
  onRegionQuote,
  onRegionCancel,
}: PdfViewerBodyProps) {
  const shouldShowSidebar = isSidebarOpen && !!thumbnailPluginInstance;

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <PreviewLayout>
      {header}
      <PreviewLayout.Main>
        {shouldShowSidebar && (
          <Sidebar>
            <thumbnailPluginInstance.Thumbnails renderThumbnailItem={ThumbnailItem} />
          </Sidebar>
        )}
        <PreviewLayout.Content ref={contentRef}>
          {children}
          {regionCapture && isRegionCaptureActive && (
            <RegionCaptureOverlay
              onCopy={onRegionCopy}
              onCancel={onRegionCancel}
              scrollContainerRef={contentRef}
              {...(onRegionQuote ? { onQuote: onRegionQuote } : {})}
            />
          )}
        </PreviewLayout.Content>
      </PreviewLayout.Main>
    </PreviewLayout>
  );
}
