import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHighlightNavigation } from "../../../../pdf-viewer/src/hooks/useHighlightNavigation";
import type { PdfHighlightItem } from "../../../../pdf-viewer/src/types";

const VALID_HIGHLIGHTS: PdfHighlightItem[] = [
  {
    chunk_id: "chunk-1",
    positions: [{ page_number: 1, x1: 10, y1: 20, x2: 30, y2: 40 }],
  },
  {
    chunk_id: "chunk-2",
    positions: [{ page_number: 2, x1: 11, y1: 21, x2: 31, y2: 41 }],
  },
];

function createDeferred<T>() {
  let resolvePromise: ((value: T | PromiseLike<T>) => void) | undefined;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: (value: T) => resolvePromise?.(value),
  };
}

describe("useHighlightNavigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("在声明式高亮快速切换时只保留最后一次请求", async () => {
    const firstJump = createDeferred<boolean>();
    const jumpToPosition = vi
      .fn()
      .mockReturnValueOnce(firstJump.promise)
      .mockResolvedValueOnce(true);

    const { rerender } = renderHook(
      ({ activeHighlightId }) =>
        useHighlightNavigation({
          activeHighlightId,
          fileUrl: "/test.pdf",
          highlights: VALID_HIGHLIGHTS,
          jumpToPosition,
        }),
      { initialProps: { activeHighlightId: "chunk-1" as string | null } },
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(jumpToPosition).toHaveBeenCalledTimes(1);

    rerender({ activeHighlightId: "chunk-2" });

    await act(async () => {
      await Promise.resolve();
    });
    expect(jumpToPosition).toHaveBeenCalledTimes(2);

    await act(async () => {
      firstJump.resolve(false);
      await firstJump.promise;
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(2_000);
      await Promise.resolve();
    });

    expect(jumpToPosition).toHaveBeenCalledTimes(2);
    expect(jumpToPosition).toHaveBeenNthCalledWith(1, VALID_HIGHLIGHTS[0]!.positions[0]!);
    expect(jumpToPosition).toHaveBeenNthCalledWith(2, VALID_HIGHLIGHTS[1]!.positions[0]!);
  });

  it("命令式滚动在命中、未命中和无效点位时返回正确结果", async () => {
    const jumpToPosition = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useHighlightNavigation({
        fileUrl: "/test.pdf",
        activeHighlightId: null,
        highlights: [
          ...VALID_HIGHLIGHTS,
          {
            chunk_id: "invalid",
            positions: [{ page_number: 0, x1: 0, y1: 0, x2: 0, y2: 0 }],
          },
        ],
        jumpToPosition,
      }),
    );

    await expect(result.current.scrollToHighlight("chunk-1")).resolves.toBe(true);
    await expect(result.current.scrollToHighlight("missing")).resolves.toBe(false);
    await expect(result.current.scrollToHighlight("invalid")).resolves.toBe(false);

    expect(jumpToPosition).toHaveBeenCalledTimes(1);
    expect(jumpToPosition).toHaveBeenCalledWith(VALID_HIGHLIGHTS[0]!.positions[0]!);
  });

  it("在 fileUrl 切换时取消未完成的滚动请求", async () => {
    const pendingJump = createDeferred<boolean>();
    const jumpToPosition = vi.fn().mockReturnValue(pendingJump.promise);

    const { result, rerender } = renderHook(
      ({ fileUrl }) =>
        useHighlightNavigation({
          fileUrl,
          activeHighlightId: null,
          highlights: VALID_HIGHLIGHTS,
          jumpToPosition,
        }),
      { initialProps: { fileUrl: "/first.pdf" } },
    );

    const scrollPromise = result.current.scrollToHighlight("chunk-1");

    rerender({ fileUrl: "/second.pdf" });

    await expect(scrollPromise).resolves.toBe(false);

    await act(async () => {
      pendingJump.resolve(true);
      await pendingJump.promise;
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(2_000);
      await Promise.resolve();
    });

    expect(jumpToPosition).toHaveBeenCalledTimes(1);
  });
});
