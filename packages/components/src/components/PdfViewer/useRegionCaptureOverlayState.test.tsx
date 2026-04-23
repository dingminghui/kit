import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

interface Crop {
  unit: "px";
  x: number;
  y: number;
  width: number;
  height: number;
}

type PixelCrop = Crop;

const { useRegionCaptureOverlayState } = await import(
  "../../../../pdf-viewer/src/components/RegionCaptureOverlay/useRegionCaptureOverlayState"
);

const DRAFT_CROP: Crop = {
  unit: "px",
  x: 12,
  y: 16,
  width: 120,
  height: 80,
};

const COMMITTED_CROP: PixelCrop = {
  unit: "px",
  x: 12,
  y: 16,
  width: 120,
  height: 80,
};

describe("useRegionCaptureOverlayState", () => {
  it("只有形成可提交选区后才允许执行复制", async () => {
    const onCopy = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useRegionCaptureOverlayState({
        mediaSize: { width: 640, height: 480 },
        onCopy,
      }),
    );

    act(() => {
      result.current.setDraftCrop(DRAFT_CROP);
    });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(result.current.visibleCrop).toEqual(DRAFT_CROP);
    expect(result.current.canSubmit).toBe(false);
    expect(onCopy).not.toHaveBeenCalled();

    act(() => {
      result.current.setCommittedCrop(COMMITTED_CROP);
    });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(result.current.canSubmit).toBe(true);
    expect(onCopy).toHaveBeenCalledWith(COMMITTED_CROP);
  });

  it("导出失败时保留当前已提交选区，避免意外重置", async () => {
    const onCopy = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useRegionCaptureOverlayState({
        mediaSize: { width: 640, height: 480 },
        onCopy,
      }),
    );

    act(() => {
      result.current.setDraftCrop(DRAFT_CROP);
      result.current.setCommittedCrop(COMMITTED_CROP);
    });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(onCopy).toHaveBeenCalledWith(COMMITTED_CROP);
    expect(result.current.draftCrop).toEqual(DRAFT_CROP);
    expect(result.current.committedCrop).toEqual(COMMITTED_CROP);
    expect(result.current.canSubmit).toBe(true);
  });

  it("引用动作与复制动作共享相同的可提交选区门槛", async () => {
    const onQuote = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useRegionCaptureOverlayState({
        mediaSize: { width: 640, height: 480 },
        onCopy: vi.fn().mockResolvedValue(true),
        onQuote,
      }),
    );

    await act(async () => {
      await result.current.handleQuote();
    });

    expect(onQuote).not.toHaveBeenCalled();

    act(() => {
      result.current.setCommittedCrop(COMMITTED_CROP);
    });

    await act(async () => {
      await result.current.handleQuote();
    });

    expect(onQuote).toHaveBeenCalledWith(COMMITTED_CROP);
  });
});
