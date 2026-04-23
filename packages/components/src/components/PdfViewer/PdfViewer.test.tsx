import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PdfViewerRef } from "../../../../pdf-viewer/src/PdfViewer";
import type { PdfHighlightItem } from "../../../../pdf-viewer/src/types";

const mockState = vi.hoisted(() => {
  const allPlugins: unknown[] = [];

  return {
    allPlugins,
    jumpToPosition: vi.fn(),
    usePdfViewerPlugins: vi.fn(),
    CurrentPageInput: vi.fn(() => <span data-testid="pdf-current-page-input">1</span>),
    NumberOfPages: vi.fn(() => <span data-testid="pdf-number-of-pages">10</span>),
    Download: vi.fn(({ children }: { children: (props: { onClick: () => void }) => ReactNode }) => (
      <>{children({ onClick: vi.fn() })}</>
    )),
    Thumbnails: vi.fn(() => <div data-testid="pdf-thumbnails">thumbs</div>),
    Zoom: vi.fn(
      ({
        children,
      }: {
        children: (props: { scale: number; onZoom: (scale: number | string) => void }) => ReactNode;
      }) => <>{children({ scale: 1, onZoom: vi.fn() })}</>,
    ),
    ZoomIn: vi.fn(({ children }: { children: (props: { onClick: () => void }) => ReactNode }) => (
      <>{children({ onClick: vi.fn() })}</>
    )),
    ZoomOut: vi.fn(({ children }: { children: (props: { onClick: () => void }) => ReactNode }) => (
      <>{children({ onClick: vi.fn() })}</>
    )),
    Worker: vi.fn(
      ({ children, workerUrl }: { children: ReactNode; workerUrl?: string | undefined }) => (
        <div data-testid="pdf-worker" data-worker-url={workerUrl}>
          {children}
        </div>
      ),
    ),
    Viewer: vi.fn(({ fileUrl }: { fileUrl: string; plugins?: unknown[] | undefined }) => (
      <div data-testid="pdf-viewer-mock">{fileUrl}</div>
    )),
  };
});

vi.mock("@react-pdf-viewer/core", () => ({
  SpecialZoomLevel: {
    PageFit: "PageFit",
  },
  Worker: mockState.Worker,
  Viewer: mockState.Viewer,
}));

vi.mock("../../../../pdf-viewer/src/hooks/usePdfViewerPlugins", () => ({
  usePdfViewerPlugins: mockState.usePdfViewerPlugins,
}));

const { PdfViewer } = await import("../../../../pdf-viewer/src/PdfViewer");

const HIGHLIGHTS: PdfHighlightItem[] = [
  {
    chunk_id: "valid",
    positions: [{ page_number: 1, x1: 10, y1: 20, x2: 30, y2: 40 }],
  },
  {
    chunk_id: "invalid",
    positions: [{ page_number: 0, x1: 0, y1: 0, x2: 0, y2: 0 }],
  },
];

describe("PdfViewer", () => {
  beforeEach(() => {
    mockState.jumpToPosition.mockReset();
    mockState.usePdfViewerPlugins.mockReset();
    mockState.CurrentPageInput.mockClear();
    mockState.NumberOfPages.mockClear();
    mockState.Download.mockClear();
    mockState.Thumbnails.mockClear();
    mockState.Zoom.mockClear();
    mockState.ZoomIn.mockClear();
    mockState.ZoomOut.mockClear();
    mockState.Worker.mockClear();
    mockState.Viewer.mockClear();
    mockState.usePdfViewerPlugins.mockImplementation(
      ({
        download,
        pageNavigation,
        thumbnail,
        zoom,
      }: {
        download: boolean;
        pageNavigation: boolean;
        thumbnail: boolean;
        zoom: boolean;
      }) => ({
        thumbnailPluginInstance: thumbnail ? { Thumbnails: mockState.Thumbnails } : null,
        pageNavigationPluginInstance: pageNavigation
          ? {
              CurrentPageInput: mockState.CurrentPageInput,
              NumberOfPages: mockState.NumberOfPages,
            }
          : null,
        zoomPluginInstance: zoom
          ? {
              Zoom: mockState.Zoom,
              ZoomIn: mockState.ZoomIn,
              ZoomOut: mockState.ZoomOut,
            }
          : null,
        getFilePluginInstance: download ? { Download: mockState.Download } : null,
        regionCapturePluginInstance: null,
        highlightPluginInstance: {
          jumpToPosition: mockState.jumpToPosition,
        },
        textSelectionPluginInstance: null,
        allPlugins: mockState.allPlugins,
        pageCanvasStore: null,
      }),
    );
  });

  it("根节点支持标准宿主层 props", () => {
    render(
      <PdfViewer
        fileUrl="/test.pdf"
        data-testid="pdf-viewer-root"
        className="custom-root"
        style={{ backgroundColor: "rgb(255, 0, 0)" }}
      />,
    );

    const root = screen.getByTestId("pdf-viewer-root");
    expect(root).toHaveClass("pdf-viewer-container", "custom-root");
    expect(root).toHaveStyle({
      width: "100%",
      height: "100%",
      backgroundColor: "rgb(255, 0, 0)",
    });
  });

  it("style 中显式传入的宽高继续覆盖默认尺寸", () => {
    render(
      <PdfViewer
        fileUrl="/test.pdf"
        data-testid="pdf-viewer-root"
        style={{ width: "320px", height: "480px" }}
      />,
    );

    expect(screen.getByTestId("pdf-viewer-root")).toHaveStyle({
      width: "320px",
      height: "480px",
    });
  });

  it("fileUrl 缺失时直接抛出明确错误，避免静默空白", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() => render(<PdfViewer fileUrl={""} />)).toThrowError(
        '[PdfViewer] Missing required "fileUrl" prop. Pass a PDF URL, base64 string, or project-relative path.',
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("启用 selection.text 时向插件层传入文本选择配置", () => {
    render(<PdfViewer fileUrl="/test.pdf" selection={{ text: {} }} />);

    expect(mockState.usePdfViewerPlugins).toHaveBeenCalledWith(
      expect.objectContaining({
        textSelection: true,
        textSelectionPluginProps: expect.objectContaining({
          renderHighlightTarget: expect.any(Function),
        }),
      }),
    );
  });

  it("根据 capability 开关装配 header slots", () => {
    render(
      <PdfViewer
        fileUrl="/test.pdf"
        controls={{
          download: true,
          pageNavigation: true,
          zoom: true,
          thumbnails: { visible: true },
        }}
        selection={{ region: {} }}
      />,
    );

    expect(screen.getByRole("button", { name: "收起侧边栏" })).toBeInTheDocument();
    expect(screen.getByTestId("pdf-current-page-input")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-number-of-pages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "区域截图" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "缩放级别" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载 PDF" })).toBeInTheDocument();
  });

  it("未启用对应 capability 时不渲染 header slots", () => {
    render(<PdfViewer fileUrl="/test.pdf" />);

    expect(screen.queryByRole("button", { name: "展开侧边栏" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "区域截图" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "缩放级别" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下载 PDF" })).not.toBeInTheDocument();
  });

  it("继续通过 ref 暴露 scrollToHighlight 并返回正确结果", async () => {
    mockState.jumpToPosition.mockResolvedValue(true);
    const ref = createRef<PdfViewerRef>();

    render(<PdfViewer ref={ref} fileUrl="/test.pdf" highlighting={{ items: HIGHLIGHTS }} />);

    expect(ref.current).not.toBeNull();

    await expect(ref.current!.scrollToHighlight("valid")).resolves.toBe(true);
    await expect(ref.current!.scrollToHighlight("missing")).resolves.toBe(false);
    await expect(ref.current!.scrollToHighlight("invalid")).resolves.toBe(false);

    expect(mockState.jumpToPosition).toHaveBeenCalledTimes(1);
    expect(mockState.jumpToPosition).toHaveBeenCalledWith(HIGHLIGHTS[0]!.positions[0]!);
  });

  it("无关 props 变化时继续复用同一个 plugins 引用", () => {
    const { rerender } = render(
      <PdfViewer fileUrl="/test.pdf" controls={{ zoom: true }} themeColor="#111111" />,
    );

    const firstPlugins = mockState.Viewer.mock.calls[0]?.[0].plugins;

    rerender(<PdfViewer fileUrl="/test.pdf" controls={{ zoom: true }} themeColor="#F97316" />);

    expect(mockState.Viewer.mock.calls.at(-1)?.[0].plugins).toBe(firstPlugins);
  });

  it("缩略图侧栏在非受控模式下支持 defaultOpen 和切换", async () => {
    const user = userEvent.setup();

    render(
      <PdfViewer
        fileUrl="/test.pdf"
        controls={{
          thumbnails: {
            visible: true,
            defaultOpen: false,
          },
        }}
      />,
    );

    expect(screen.queryByTestId("pdf-thumbnails")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "展开侧边栏" }));

    expect(screen.getByTestId("pdf-thumbnails")).toBeInTheDocument();
  });

  it("缩略图侧栏在受控模式下只通过 open prop 驱动显示", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <PdfViewer
        fileUrl="/test.pdf"
        controls={{
          thumbnails: {
            visible: true,
            open: true,
            onOpenChange,
          },
        }}
      />,
    );

    expect(screen.getByTestId("pdf-thumbnails")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "收起侧边栏" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId("pdf-thumbnails")).toBeInTheDocument();

    rerender(
      <PdfViewer
        fileUrl="/test.pdf"
        controls={{
          thumbnails: {
            visible: true,
            open: false,
            onOpenChange,
          },
        }}
      />,
    );

    expect(screen.queryByTestId("pdf-thumbnails")).not.toBeInTheDocument();
  });
});
