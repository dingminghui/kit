export function throttleVoid(fn: () => void, waitMs: number): () => void {
  let lastTime = 0;
  let trailingId: ReturnType<typeof setTimeout> | null = null;
  return () => {
    const now = Date.now();
    if (now - lastTime >= waitMs) {
      if (trailingId) {
        clearTimeout(trailingId);
        trailingId = null;
      }
      lastTime = Date.now();
      fn();
      return;
    }
    if (!trailingId) {
      trailingId = setTimeout(
        () => {
          trailingId = null;
          lastTime = Date.now();
          fn();
        },
        waitMs - (now - lastTime),
      );
    }
  };
}
