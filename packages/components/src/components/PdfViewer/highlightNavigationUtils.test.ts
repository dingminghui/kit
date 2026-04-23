import { describe, expect, it } from "vitest";

import { toHighlightDestination } from "../../../../pdf-viewer/src/utils/highlightNavigationUtils";

describe("toHighlightDestination", () => {
  it("将有效高亮点位转换为 react-pdf-viewer 目标结构", () => {
    expect(
      toHighlightDestination({
        page_number: 2,
        x1: 40,
        y1: 120,
        x2: 10,
        y2: 80,
      }),
    ).toEqual({
      pageIndex: 1,
      leftOffset: 10,
      bottomOffset: 120,
    });
  });

  it("忽略非法高亮点位", () => {
    expect(
      toHighlightDestination({
        page_number: 0,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      }),
    ).toBeNull();
  });
});
