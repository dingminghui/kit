import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  useElementSize: vi.fn(),
  useEscapeKey: vi.fn(),
  useOverlayPortal: vi.fn(),
  useRegionCaptureOverlayState: vi.fn(),
  useThemeColor: vi.fn(),
}));

vi.mock("../../../../pdf-viewer/src/hooks/useElementSize", () => ({
  useElementSize: mockState.useElementSize,
}));

vi.mock("../../../../pdf-viewer/src/hooks/useEscapeKey", () => ({
  useEscapeKey: mockState.useEscapeKey,
}));

vi.mock("../../../../pdf-viewer/src/hooks/useOverlayPortal", () => ({
  useOverlayPortal: mockState.useOverlayPortal,
}));

vi.mock("../../../../pdf-viewer/src/PdfViewerContext", async () => {
  const actual = await vi.importActual("../../../../pdf-viewer/src/PdfViewerContext");
  return {
    ...actual,
    useThemeColor: mockState.useThemeColor,
  };
});

vi.mock("../../../../pdf-viewer/src/components/RegionCaptureOverlay/useRegionCaptureOverlayState", () => ({
  useRegionCaptureOverlayState: mockState.useRegionCaptureOverlayState,
}));

const { RegionCaptureOverlay } = await import(
  "../../../../pdf-viewer/src/components/RegionCaptureOverlay"
);

describe("RegionCaptureOverlay", () => {
  beforeEach(() => {
    mockState.useElementSize.mockReset();
    mockState.useEscapeKey.mockReset();
    mockState.useOverlayPortal.mockReset();
    mockState.useRegionCaptureOverlayState.mockReset();
    mockState.useThemeColor.mockReset();

    mockState.useThemeColor.mockReturnValue("#F97316");
    mockState.useOverlayPortal.mockReturnValue({
      portalTarget: document.body,
      portalReady: true,
    });
    mockState.useElementSize.mockReturnValue({ width: 640, height: 480 });
    mockState.useRegionCaptureOverlayState.mockReturnValue({
      draftCrop: { unit: "px", x: 10, y: 12, width: 60, height: 40 },
      committedCrop: { unit: "px", x: 10, y: 12, width: 60, height: 40 },
      visibleCrop: { unit: "px", x: 10, y: 12, width: 60, height: 40 },
      canSubmit: true,
      setDraftCrop: vi.fn(),
      setCommittedCrop: vi.fn(),
      resetSelection: vi.fn(),
      handleCopy: vi.fn(),
      handleQuote: vi.fn(),
    });
  });

  it("portal 未就绪时不渲染 overlay", () => {
    mockState.useOverlayPortal.mockReturnValue({
      portalTarget: null,
      portalReady: false,
    });

    const { container } = render(
      <RegionCaptureOverlay
        onCopy={vi.fn().mockResolvedValue(true)}
        onCancel={vi.fn()}
        scrollContainerRef={createRef<HTMLDivElement>()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("将遮罩与裁剪舞台装配到 portal 中并保留提交能力", () => {
    render(
      <RegionCaptureOverlay
        onCopy={vi.fn().mockResolvedValue(true)}
        onQuote={vi.fn().mockResolvedValue(true)}
        onCancel={vi.fn()}
        scrollContainerRef={createRef<HTMLDivElement>()}
      />,
    );

    expect(document.body.querySelector(".ReactCrop")).not.toBeNull();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "引用" })).toBeEnabled();

    const maskHole = document.body.querySelector<SVGRectElement>(
      '.region-capture-overlay-mask rect[fill="black"]',
    );
    expect(maskHole).not.toBeNull();
    expect(maskHole).toHaveAttribute("x", "10");
    expect(maskHole).toHaveAttribute("y", "12");
    expect(maskHole).toHaveAttribute("width", "60");
    expect(maskHole).toHaveAttribute("height", "40");
  });
});
