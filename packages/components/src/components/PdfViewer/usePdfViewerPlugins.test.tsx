import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => {
  let sequence = 0;

  const createPluginInstance = (name: string) => ({
    name,
    id: `${name}-${sequence += 1}`,
  });

  return {
    createPluginInstance,
    getFilePlugin: vi.fn(() => createPluginInstance("get-file")),
    highlightPlugin: vi.fn(() => ({
      plugin: createPluginInstance("highlight"),
      jumpToPosition: vi.fn(),
    })),
    pageNavigationPlugin: vi.fn(() => createPluginInstance("page-navigation")),
    regionCapturePlugin: vi.fn(() => ({
      plugin: createPluginInstance("region-capture"),
      pageCanvasStore: new Map(),
    })),
    textSelectionHighlightPlugin: vi.fn(() => createPluginInstance("text-selection")),
    thumbnailPlugin: vi.fn(() => createPluginInstance("thumbnail")),
    zoomPlugin: vi.fn(() => createPluginInstance("zoom")),
  };
});

vi.mock("@react-pdf-viewer/get-file", () => ({
  getFilePlugin: mockState.getFilePlugin,
}));

vi.mock("@react-pdf-viewer/highlight", () => ({
  highlightPlugin: mockState.textSelectionHighlightPlugin,
  Trigger: {
    TextSelection: "TextSelection",
  },
}));

vi.mock("@react-pdf-viewer/page-navigation", () => ({
  pageNavigationPlugin: mockState.pageNavigationPlugin,
}));

vi.mock("@react-pdf-viewer/thumbnail", () => ({
  thumbnailPlugin: mockState.thumbnailPlugin,
}));

vi.mock("@react-pdf-viewer/zoom", () => ({
  zoomPlugin: mockState.zoomPlugin,
}));

vi.mock("../../../../pdf-viewer/src/plugins/highlightPlugin", () => ({
  highlightPlugin: mockState.highlightPlugin,
}));

vi.mock("../../../../pdf-viewer/src/plugins/regionCapturePlugin", () => ({
  regionCapturePlugin: mockState.regionCapturePlugin,
}));

const { usePdfViewerPlugins } = await import("../../../../pdf-viewer/src/hooks/usePdfViewerPlugins");

describe("usePdfViewerPlugins", () => {
  it("在无关 rerender 时复用第三方插件实例", () => {
    const renderHighlightTarget = vi.fn();

    const { result, rerender } = renderHook(
      ({ marker }) => {
        void marker;

        return usePdfViewerPlugins({
          download: true,
          thumbnail: true,
          pageNavigation: true,
          zoom: true,
          regionCapture: true,
          highlight: true,
          textSelection: true,
          textSelectionPluginProps: {
            renderHighlightTarget,
          },
        });
      },
      { initialProps: { marker: "first" } },
    );

    const firstZoomPluginInstance = result.current.zoomPluginInstance;
    const firstThumbnailPluginInstance = result.current.thumbnailPluginInstance;
    const firstTextSelectionPluginInstance = result.current.textSelectionPluginInstance;
    const firstAllPlugins = result.current.allPlugins;

    rerender({ marker: "second" });

    expect(result.current.zoomPluginInstance).toBe(firstZoomPluginInstance);
    expect(result.current.thumbnailPluginInstance).toBe(firstThumbnailPluginInstance);
    expect(result.current.textSelectionPluginInstance).toBe(firstTextSelectionPluginInstance);
    expect(result.current.allPlugins).toBe(firstAllPlugins);
  });

  it("在 textSelection 配置变化时只刷新文本选择插件实例", () => {
    const firstRenderHighlightTarget = vi.fn();
    const secondRenderHighlightTarget = vi.fn();

    const { result, rerender } = renderHook(
      ({ renderHighlightTarget }) =>
        usePdfViewerPlugins({
          download: false,
          thumbnail: false,
          pageNavigation: false,
          zoom: true,
          regionCapture: false,
          highlight: false,
          textSelection: true,
          textSelectionPluginProps: {
            renderHighlightTarget,
          },
        }),
      { initialProps: { renderHighlightTarget: firstRenderHighlightTarget } },
    );

    const firstZoomPluginInstance = result.current.zoomPluginInstance;
    const firstTextSelectionPluginInstance = result.current.textSelectionPluginInstance;

    rerender({ renderHighlightTarget: secondRenderHighlightTarget });

    expect(result.current.zoomPluginInstance).toBe(firstZoomPluginInstance);
    expect(result.current.textSelectionPluginInstance).not.toBe(firstTextSelectionPluginInstance);
  });
});
