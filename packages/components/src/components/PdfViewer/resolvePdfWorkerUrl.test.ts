import { describe, expect, it } from "vitest";

import {
  DEFAULT_PDF_WORKER_URL,
  resolvePdfWorkerUrl,
} from "../../../../pdf-viewer/src/utils/resolvePdfWorkerUrl";

describe("resolvePdfWorkerUrl", () => {
  it("优先使用自定义 workerUrl，否则回退到默认值", () => {
    expect(resolvePdfWorkerUrl("/custom-worker.js")).toBe("/custom-worker.js");
    expect(resolvePdfWorkerUrl()).toBe(DEFAULT_PDF_WORKER_URL);
  });
});
