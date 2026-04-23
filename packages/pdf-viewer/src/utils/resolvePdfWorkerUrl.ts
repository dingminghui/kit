export const DEFAULT_PDF_WORKER_URL =
  "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";

export function resolvePdfWorkerUrl(workerUrl?: string): string {
  return workerUrl ?? DEFAULT_PDF_WORKER_URL;
}
