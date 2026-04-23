import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { useTextSelection } from "../../../../pdf-viewer/src/hooks/useTextSelection";
import type { PdfViewerTextSelectionOptions } from "../../../../pdf-viewer/src/types";

interface RenderHighlightTargetProps {
  highlightAreas: Array<{
    height: number;
    left: number;
    pageIndex: number;
    top: number;
    width: number;
  }>;
  previewImage: string;
  selectedText: string;
  selectionRegion: {
    height: number;
    left: number;
    pageIndex: number;
    top: number;
    width: number;
  };
  selectionData?: {
    divTexts: string[];
    selectedText: string;
    startPageIndex: number;
    endPageIndex: number;
    startOffset: number;
    startDivIndex: number;
    endOffset: number;
    endDivIndex: number;
  };
  cancel: () => void;
  toggle: () => void;
}

interface RenderTextSelectionTargetProps {
  textSelection?: PdfViewerTextSelectionOptions;
  targetProps: RenderHighlightTargetProps;
}

function RenderTextSelectionTarget({
  textSelection,
  targetProps,
}: RenderTextSelectionTargetProps): ReactElement | null {
  const { textSelectionPluginProps } = useTextSelection(textSelection ? { textSelection } : {});

  return textSelectionPluginProps?.renderHighlightTarget?.(targetProps as never) ?? null;
}

function createRenderHighlightTargetProps(
  overrides?: Partial<RenderHighlightTargetProps>,
): RenderHighlightTargetProps {
  return {
    highlightAreas: [
      {
        height: 2,
        left: 10,
        pageIndex: 0,
        top: 10,
        width: 20,
      },
    ],
    previewImage: "",
    selectedText: "测试文本",
    selectionRegion: {
      height: 2,
      left: 10,
      pageIndex: 0,
      top: 10,
      width: 20,
    },
    selectionData: {
      divTexts: [],
      selectedText: "测试文本",
      startPageIndex: 0,
      endPageIndex: 0,
      startOffset: 0,
      startDivIndex: 0,
      endOffset: 2,
      endDivIndex: 0,
    },
    cancel: vi.fn(),
    toggle: vi.fn(),
    ...overrides,
  };
}

describe("useTextSelection", () => {
  it("点击复制时写入剪贴板、触发回调并取消选区", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const targetProps = createRenderHighlightTargetProps();

    render(
      <RenderTextSelectionTarget
        textSelection={{
          onCopy,
        }}
        targetProps={targetProps}
      />,
    );

    await user.click(screen.getByRole("button", { name: "复制" }));

    expect(writeText).toHaveBeenCalledWith("测试文本");
    expect(onCopy).toHaveBeenCalledWith(
      "测试文本",
      expect.objectContaining({
        selectedText: "测试文本",
        selectionRegion: targetProps.selectionRegion,
        highlightAreas: targetProps.highlightAreas,
      }),
    );
    expect(targetProps.cancel).toHaveBeenCalledTimes(1);
  });

  it("copyToClipboard=false 时不写剪贴板，但仍触发 onCopy", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const targetProps = createRenderHighlightTargetProps();

    render(
      <RenderTextSelectionTarget
        textSelection={{
          copyToClipboard: false,
          onCopy,
        }}
        targetProps={targetProps}
      />,
    );

    await user.click(screen.getByRole("button", { name: "复制" }));

    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(targetProps.cancel).toHaveBeenCalledTimes(1);
  });

  it("点击引用时触发 onSelectionExport 并取消选区", async () => {
    const user = userEvent.setup();
    const onSelectionExport = vi.fn();
    const targetProps = createRenderHighlightTargetProps();

    render(
      <RenderTextSelectionTarget
        textSelection={{
          onSelectionExport,
        }}
        targetProps={targetProps}
      />,
    );

    await user.click(screen.getByRole("button", { name: "引用" }));

    expect(onSelectionExport).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedText: "测试文本",
        selectionData: targetProps.selectionData,
      }),
    );
    expect(targetProps.cancel).toHaveBeenCalledTimes(1);
  });

  it("选中文本为空白时不渲染浮层", () => {
    const targetProps = createRenderHighlightTargetProps({
      selectedText: "   ",
    });

    render(
      <RenderTextSelectionTarget
        textSelection={{
          onSelectionExport: vi.fn(),
        }}
        targetProps={targetProps}
      />,
    );

    expect(screen.queryByRole("button", { name: "复制" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "引用" })).not.toBeInTheDocument();
  });
});
