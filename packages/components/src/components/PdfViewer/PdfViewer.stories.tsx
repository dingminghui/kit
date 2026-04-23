import type {
  PdfHighlightItem,
  PdfRegionSelectionPayload,
  PdfTextSelectionPayload,
  PdfViewerRef,
} from "@kit/pdf-viewer";
import { DEFAULT_THEME_COLOR, PdfViewer } from "@kit/pdf-viewer";
import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";

/** Storybook 使用的示例 PDF。 */
const TEST_PDF_URL =
  "https://mp-60e94f73-357b-4c22-9d12-8051b1296bfb.cdn.bspapp.com/2603.01919.pdf";

const TEST_HIGHLIGHTS: PdfHighlightItem[] = [
  {
    chunk_id: "chunk-001",
    original_reference: "高亮块1",
    positions: [
      {
        page_number: 2,
        x1: 62.60697781885398,
        y1: 0,
        x2: 543.5278419593345,
        y2: 85.48700323475046,
      },
      {
        page_number: 3,
        x1: 62.60697781885398,
        y1: 397.5611714417745,
        x2: 543.5278419593345,
        y2: 792,
      },
    ],
  },
  {
    chunk_id: "chunk-002",
    original_reference: "高亮块2",
    positions: [
      {
        page_number: 3,
        x1: 36.19287199630314,
        y1: 0,
        x2: 573.1729436229206,
        y2: 96.75831792975971,
      },
      { page_number: 4, x1: 36.19287199630314, y1: 0, x2: 573.1729436229206, y2: 792 },
      {
        page_number: 5,
        x1: 36.19287199630314,
        y1: 661.3019292975971,
        x2: 573.1729436229206,
        y2: 792,
      },
    ],
  },
  {
    chunk_id: "chunk-003",
    original_reference: "高亮块3",
    positions: [{ page_number: 3, x1: 70, y1: 560, x2: 400, y2: 592 }],
  },
];

const getHighlightLabel = (index: number): string => `高亮块${index + 1}`;

const containerStyle: CSSProperties = {
  width: "1000px",
  height: "900px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
};

const meta: Meta<typeof PdfViewer> = {
  title: "Components/PdfViewer",
  component: PdfViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "基于 `@react-pdf-viewer/core` 封装的 PDF 预览组件，使用 `controls` 管理顶部工具和缩略图，使用 `highlighting` 管理高亮定位，使用 `selection` 管理文本选择与区域截图，并继续支持 `ref.scrollToHighlight(chunkId)` 命令式跳转。",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    fileUrl: {
      control: "text",
      description: "PDF 地址，支持 URL、base64 或相对路径",
      table: { category: "基础" },
    },
    workerUrl: {
      control: "text",
      description: "可选的 pdf.js worker 地址",
      table: { category: "基础" },
    },
    defaultScale: {
      control: { type: "select" },
      options: [0.5, 0.75, 1, 1.25, 1.5, 2, "PageFit", "PageWidth", "ActualSize"],
      description: "初始缩放比例，支持数值或特殊枚举值",
      table: { category: "基础", defaultValue: { summary: "PageFit" } },
    },
    themeColor: {
      control: "color",
      description: "主题色，用于激活态按钮等",
      table: { category: "外观", defaultValue: { summary: DEFAULT_THEME_COLOR } },
    },
    controls: {
      control: "object",
      description: "工具栏和缩略图控制项配置",
      table: {
        category: "功能",
        type: {
          summary:
            "{ download?: boolean; pageNavigation?: boolean; zoom?: boolean; thumbnails?: { visible?: boolean; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void } }",
        },
      },
    },
    highlighting: {
      control: "object",
      description: "高亮块数组和当前激活高亮 id",
      table: { category: "高亮" },
    },
    selection: {
      control: "object",
      description: "文本选择与区域截图能力配置",
      table: { category: "交互" },
    },
  },
  decorators: [
    (Story) => (
      <div style={containerStyle}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

interface StoryRenderProps {
  args: Story["args"];
}

function ImperativeHighlightsRender({ args }: StoryRenderProps) {
  const viewerRef = useRef<PdfViewerRef>(null);

  return (
    <div
      style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 8px 0" }}>
        {TEST_HIGHLIGHTS.map((item, index) => (
          <button
            key={item.chunk_id}
            type="button"
            onClick={() => {
              void viewerRef.current?.scrollToHighlight(item.chunk_id);
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {getHighlightLabel(index)}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PdfViewer {...args} ref={viewerRef} fileUrl={args?.fileUrl ?? TEST_PDF_URL} />
      </div>
    </div>
  );
}

function DeclarativeHighlightsRender({ args }: StoryRenderProps) {
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    args?.highlighting?.activeId ?? TEST_HIGHLIGHTS[0]?.chunk_id ?? null,
  );

  return (
    <div
      style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 8px 0" }}>
        {TEST_HIGHLIGHTS.map((item, index) => (
          <button
            key={item.chunk_id}
            type="button"
            onClick={() => {
              setActiveHighlightId(item.chunk_id);
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: activeHighlightId === item.chunk_id ? "#fff7ed" : "#fff",
              cursor: "pointer",
            }}
          >
            {getHighlightLabel(index)}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PdfViewer
          {...args}
          fileUrl={args?.fileUrl ?? TEST_PDF_URL}
          highlighting={{
            items: args?.highlighting?.items ?? TEST_HIGHLIGHTS,
            activeId: activeHighlightId,
          }}
        />
      </div>
    </div>
  );
}

/** 纯阅读模式。 */
export const Default: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
  },
};

/** 仅开启下载。 */
export const WithDownload: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: { download: true },
  },
};

/** 仅开启缩放。 */
export const WithZoom: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: { zoom: true },
  },
};

/** 仅开启页码导航。 */
export const WithPageNavigation: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: { pageNavigation: true },
  },
};

/** 开启缩略图侧栏。 */
export const WithThumbnail: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      thumbnails: { visible: true },
    },
  },
};

/** 区域截图最简模式，只写入剪贴板。 */
export const WithRegionCaptureBasic: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      pageNavigation: true,
    },
    selection: {
      region: {
        copyToClipboard: true,
      },
    },
  },
};

/** 区域截图复制回调示例。 */
export const WithRegionCapture: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      pageNavigation: true,
    },
    selection: {
      region: {
        onCopy: (imageDataUrl: string) => {
          console.log("截图 base64:", imageDataUrl.slice(0, 80) + "...");
        },
      },
    },
  },
};

/** 区域截图引用导出示例。 */
export const WithRegionCaptureSelectionExport: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      pageNavigation: true,
    },
    selection: {
      region: {
        onSelectionExport: (payload: PdfRegionSelectionPayload) => {
          console.log("引用导出:", {
            imageDataUrl: payload.imageDataUrl,
            positions: payload.positions,
          });
        },
      },
    },
  },
};

/** 区域截图完整模式。 */
export const WithRegionCaptureFull: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      pageNavigation: true,
    },
    selection: {
      region: {
        onCopy: (imageDataUrl: string) => {
          console.log("[复制] base64:", imageDataUrl.slice(0, 60) + "...");
        },
        onSelectionExport: (payload: PdfRegionSelectionPayload) => {
          console.log("[引用] 导出:", payload.positions.length, "个位置");
        },
      },
    },
  },
};

/** 文本选择复制/引用示例。 */
export const WithTextSelection: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    selection: {
      text: {
        onCopy: (selectedText: string, payload: PdfTextSelectionPayload) => {
          console.log("[文本复制]", {
            selectedText,
            selectionRegion: payload.selectionRegion,
            highlightAreas: payload.highlightAreas.length,
          });
        },
        onSelectionExport: (payload: PdfTextSelectionPayload) => {
          console.log("[文本引用]", {
            selectedText: payload.selectedText,
            selectionData: payload.selectionData,
            highlightAreas: payload.highlightAreas,
          });
        },
      },
    },
  },
};

/** 常用功能组合。 */
export const WithPageNavigationAndThumbnail: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      download: true,
      zoom: true,
      pageNavigation: true,
      thumbnails: { visible: true },
    },
    selection: {
      region: {},
    },
  },
};

/** `highlighting.activeId` 驱动的定位方式。 */
export const WithActiveHighlightId: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      thumbnails: { visible: true },
      pageNavigation: true,
      zoom: true,
    },
    highlighting: {
      items: TEST_HIGHLIGHTS,
      activeId: TEST_HIGHLIGHTS[0]?.chunk_id ?? null,
    },
  },
  render: (args) => <DeclarativeHighlightsRender args={args} />,
};

/** 自定义主题色。 */
export const WithThemeColor: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      thumbnails: { visible: true },
    },
    highlighting: {
      items: TEST_HIGHLIGHTS,
    },
    themeColor: "#F97316",
  },
};

/** 主题色与完整功能组合。 */
export const WithThemeColorAndAllFeatures: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      download: true,
      zoom: true,
      pageNavigation: true,
      thumbnails: { visible: true },
    },
    highlighting: {
      items: TEST_HIGHLIGHTS,
      activeId: TEST_HIGHLIGHTS[0]?.chunk_id ?? null,
    },
    themeColor: "#F97316",
    selection: {
      region: {},
    },
  },
  render: (args) => <DeclarativeHighlightsRender args={args} />,
};

/** `ref.scrollToHighlight` 用法。 */
export const WithImperativeHighlights: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      thumbnails: { visible: true },
      pageNavigation: true,
      zoom: true,
    },
    highlighting: {
      items: TEST_HIGHLIGHTS,
    },
  },
  render: (args) => <ImperativeHighlightsRender args={args} />,
};

/** 初始缩放设为 `PageWidth`。 */
export const WithPageWidth: Story = {
  name: "初始缩放：PageWidth",
  args: {
    fileUrl: TEST_PDF_URL,
    defaultScale: "PageWidth",
  },
};

/** Controls 调试场景。 */
export const Playground: Story = {
  args: {
    fileUrl: TEST_PDF_URL,
    controls: {
      download: true,
      zoom: true,
      pageNavigation: true,
      thumbnails: { visible: true },
    },
    highlighting: {
      items: TEST_HIGHLIGHTS,
    },
    themeColor: DEFAULT_THEME_COLOR,
    defaultScale: "PageFit",
    selection: {
      region: {},
    },
  },
};
