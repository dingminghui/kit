import type { HighlightArea, SelectionData } from "@react-pdf-viewer/highlight";

export interface PdfHighlightPosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  page_number: number;
}

export interface PdfRegionSelectionPayload {
  imageDataUrl: string;
  positions: PdfHighlightPosition[];
}

export interface PdfHighlightItem {
  chunk_id: string;
  positions: PdfHighlightPosition[];
  original_reference?: string;
}

export interface PdfViewerThumbnailControls {
  /** 是否显示缩略图侧栏切换入口。 */
  visible?: boolean;
  /** 非受控模式下的默认展开状态，默认 `true`。 */
  defaultOpen?: boolean;
  /** 受控模式下的展开状态。 */
  open?: boolean;
  /** 缩略图展开状态变更回调。 */
  onOpenChange?: (open: boolean) => void;
}

export interface PdfViewerControls {
  download?: boolean;
  pageNavigation?: boolean;
  zoom?: boolean;
  thumbnails?: PdfViewerThumbnailControls;
}

export interface PdfViewerHighlighting {
  items?: PdfHighlightItem[];
  activeId?: string | null;
}

export interface PdfViewerRegionCaptureOptions {
  /** 复制动作是否同时写入系统剪贴板，默认 `true`。 */
  copyToClipboard?: boolean;
  /** 复制区域截图后触发；第二个参数提供结构化点位。 */
  onCopy?: (imageDataUrl: string, payload: PdfRegionSelectionPayload) => void;
  /** 点击“引用”动作后触发。 */
  onSelectionExport?: (payload: PdfRegionSelectionPayload) => void;
}

export interface PdfTextSelectionPayload {
  selectedText: string;
  highlightAreas: HighlightArea[];
  selectionData?: SelectionData | undefined;
  selectionRegion: HighlightArea;
}

export interface PdfViewerTextSelectionOptions {
  /** 复制动作是否同时写入系统剪贴板，默认 `true`。 */
  copyToClipboard?: boolean;
  /** 复制选中文本后触发；第二个参数提供结构化选择信息。 */
  onCopy?: (selectedText: string, payload: PdfTextSelectionPayload) => void;
  /** 点击“引用”动作后触发。 */
  onSelectionExport?: (payload: PdfTextSelectionPayload) => void;
}

export interface PdfViewerSelection {
  text?: false | PdfViewerTextSelectionOptions;
  region?: false | PdfViewerRegionCaptureOptions;
}
