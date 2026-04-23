import { render, screen } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { PdfViewerContext } from "../../../../pdf-viewer/src/PdfViewerContext";
import { highlightPlugin } from "../../../../pdf-viewer/src/plugins/highlightPlugin";
import type { PdfHighlightItem } from "../../../../pdf-viewer/src/types";

const HIGHLIGHTS: PdfHighlightItem[] = [
  {
    chunk_id: "chunk-1",
    positions: [{ page_number: 1, x1: 10, y1: 20, x2: 30, y2: 40 }],
  },
  {
    chunk_id: "chunk-2",
    positions: [{ page_number: 2, x1: 15, y1: 25, x2: 35, y2: 45 }],
  },
];

describe("highlightPlugin", () => {
  it("根据当前上下文在对应页面渲染可见高亮块", () => {
    const { plugin } = highlightPlugin();
    const pageLayerElement = plugin.renderPageLayer?.({
      canvasLayerRef: createRef<HTMLCanvasElement>() as MutableRefObject<HTMLCanvasElement>,
      canvasLayerRendered: true,
      doc: {} as never,
      height: 200,
      pageIndex: 0,
      rotation: 0,
      scale: 2,
      textLayerRef: createRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>,
      textLayerRendered: true,
      width: 100,
    });

    render(
      <PdfViewerContext.Provider
        value={{
          themeColor: "#f97316",
          highlights: HIGHLIGHTS,
          activeHighlightId: "chunk-1",
        }}
      >
        {pageLayerElement ?? null}
      </PdfViewerContext.Provider>,
    );

    expect(screen.getByTestId("pdf-viewer-highlight-chunk-1-0")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.queryByTestId("pdf-viewer-highlight-chunk-2-0")).not.toBeInTheDocument();
  });
});
