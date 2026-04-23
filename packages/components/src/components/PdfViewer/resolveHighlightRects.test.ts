import { describe, expect, it } from "vitest";

import type { PdfHighlightItem } from "../../../../pdf-viewer/src/types";
import { resolveHighlightRects } from "../../../../pdf-viewer/src/utils/resolveHighlightRects";

const HIGHLIGHTS: PdfHighlightItem[] = [
  {
    chunk_id: "chunk-1",
    positions: [
      { page_number: 1, x1: 10, y1: 20, x2: 30, y2: 40 },
      { page_number: 2, x1: 1, y1: 1, x2: 2, y2: 2 },
    ],
  },
  {
    chunk_id: "invalid",
    positions: [{ page_number: 0, x1: 0, y1: 0, x2: 0, y2: 0 }],
  },
];

describe("resolveHighlightRects", () => {
  it("只为当前页生成有效矩形，并按页面坐标完成换算", () => {
    expect(
      resolveHighlightRects({
        pageIndex: 0,
        pageHeight: 200,
        scale: 2,
        highlights: HIGHLIGHTS,
      }),
    ).toEqual([
      {
        chunkId: "chunk-1",
        height: 40,
        left: 20,
        top: 120,
        width: 40,
      },
    ]);
  });
});
