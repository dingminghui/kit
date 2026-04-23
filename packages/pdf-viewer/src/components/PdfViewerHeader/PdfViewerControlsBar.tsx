import { SpecialZoomLevel } from "@react-pdf-viewer/core";
import type { GetFilePlugin } from "@react-pdf-viewer/get-file";
import type { PageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import type { ZoomPlugin } from "@react-pdf-viewer/zoom";

import { DownloadControls } from "../DownloadControls";
import { PageNavigation } from "../PageNavigation";
import { RegionCaptureControls } from "../RegionCaptureControls";
import { SidebarToggle } from "../SidebarToggle";
import { ZoomControls } from "../ZoomControls";
import { PdfViewerHeader } from "./PdfViewerHeader";

export interface PdfViewerControlsBarProps {
  defaultScale: number | SpecialZoomLevel;
  downloadEnabled: boolean;
  getFilePluginInstance: GetFilePlugin | null;
  isRegionCaptureActive: boolean;
  isSidebarOpen: boolean;
  onToggleRegionCapture: () => void;
  onToggleSidebar: () => void;
  pageNavigationEnabled: boolean;
  pageNavigationPluginInstance: PageNavigationPlugin | null;
  regionCaptureEnabled: boolean;
  thumbnailsVisible: boolean;
  zoomEnabled: boolean;
  zoomPluginInstance: ZoomPlugin | null;
}

export function PdfViewerControlsBar({
  defaultScale,
  downloadEnabled,
  getFilePluginInstance,
  isRegionCaptureActive,
  isSidebarOpen,
  onToggleRegionCapture,
  onToggleSidebar,
  pageNavigationEnabled,
  pageNavigationPluginInstance,
  regionCaptureEnabled,
  thumbnailsVisible,
  zoomEnabled,
  zoomPluginInstance,
}: PdfViewerControlsBarProps) {
  return (
    <PdfViewerHeader
      sidebarToggleSlot={
        thumbnailsVisible ? (
          <SidebarToggle isSidebarOpen={isSidebarOpen} onToggle={onToggleSidebar} />
        ) : null
      }
      pageNavigationSlot={
        pageNavigationEnabled && pageNavigationPluginInstance ? (
          <PageNavigation
            CurrentPageInput={<pageNavigationPluginInstance.CurrentPageInput />}
            NumberOfPages={<pageNavigationPluginInstance.NumberOfPages />}
          />
        ) : null
      }
      regionCaptureSlot={
        regionCaptureEnabled ? (
          <RegionCaptureControls
            isActive={isRegionCaptureActive}
            onToggle={onToggleRegionCapture}
          />
        ) : null
      }
      zoomSlot={
        zoomEnabled && zoomPluginInstance ? (
          <ZoomControls
            Zoom={zoomPluginInstance.Zoom}
            ZoomIn={zoomPluginInstance.ZoomIn}
            ZoomOut={zoomPluginInstance.ZoomOut}
            defaultScale={defaultScale}
          />
        ) : null
      }
      downloadSlot={
        downloadEnabled && getFilePluginInstance ? (
          <DownloadControls Download={getFilePluginInstance.Download} />
        ) : null
      }
    />
  );
}
