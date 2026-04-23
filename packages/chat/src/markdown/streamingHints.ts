export type PendingHintKind = "pendingImage" | "pendingTable" | "pendingCodeBlock";

export interface PendingHint {
  kind: PendingHintKind;
  start: number;
  raw: string;
}

export interface AnalyzeStreamingMarkdownResult {
  stableContent: string;
  pendingHints: PendingHint[];
}

function detectPendingCodeBlock(content: string): PendingHint | null {
  const fenceMatches = [...content.matchAll(/```/g)];
  if (fenceMatches.length % 2 === 0) {
    return null;
  }

  const lastFence = fenceMatches.at(-1);
  const start = lastFence?.index;
  if (start === undefined) {
    return null;
  }

  return {
    kind: "pendingCodeBlock",
    start,
    raw: content.slice(start),
  };
}

function detectPendingImage(content: string): PendingHint | null {
  const starts = [...content.matchAll(/!\[/g)]
    .map((match) => match.index)
    .filter((index) => index !== undefined);
  if (starts.length === 0) {
    return null;
  }

  const completeImageStarts = new Set<number>();
  for (const match of content.matchAll(/!\[[^\]]*]\([^)]+\)/g)) {
    if (match.index !== undefined) {
      completeImageStarts.add(match.index);
    }
  }

  const lastStart = starts.at(-1);
  if (lastStart === undefined || completeImageStarts.has(lastStart)) {
    return null;
  }

  return {
    kind: "pendingImage",
    start: lastStart,
    raw: content.slice(lastStart),
  };
}

function detectPendingTable(content: string): PendingHint | null {
  const trailingBlockStart = content.lastIndexOf("\n\n");
  const startIndex = trailingBlockStart === -1 ? 0 : trailingBlockStart + 2;
  const trailing = content.slice(startIndex);
  if (!trailing.trim()) {
    return null;
  }

  const lines = trailing.split("\n");
  const lineOffsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  }

  const nonEmptyLineIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ index }) => index);
  if (nonEmptyLineIndexes.length === 0) {
    return null;
  }

  const lastNonEmptyLineIndex = nonEmptyLineIndexes.at(-1);
  if (lastNonEmptyLineIndex === undefined) {
    return null;
  }

  const lastLine = lines[lastNonEmptyLineIndex]?.trim() ?? "";
  if (!lastLine.includes("|")) {
    return null;
  }

  const firstPipeLineIndex = nonEmptyLineIndexes.find((index) =>
    (lines[index] ?? "").includes("|"),
  );
  if (firstPipeLineIndex === undefined) {
    return null;
  }

  const tableLines = nonEmptyLineIndexes
    .map((index) => lines[index] ?? "")
    .filter((line) => line.includes("|"));
  if (tableLines.length === 0) {
    return null;
  }

  const separatorRowRegExp = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;
  const hasSeparator = tableLines.some((line) => separatorRowRegExp.test(line));
  if (hasSeparator) {
    return null;
  }

  const start = startIndex + (lineOffsets[firstPipeLineIndex] ?? 0);
  return {
    kind: "pendingTable",
    start,
    raw: content.slice(start),
  };
}

export function analyzeStreamingMarkdown(content: string): AnalyzeStreamingMarkdownResult {
  const pendingCandidates = [
    detectPendingCodeBlock(content),
    detectPendingImage(content),
    detectPendingTable(content),
  ].filter((hint): hint is PendingHint => hint !== null);

  if (pendingCandidates.length === 0) {
    return {
      stableContent: content,
      pendingHints: [],
    };
  }

  const cutAt = Math.min(...pendingCandidates.map((hint) => hint.start));
  const stableContent = content.slice(0, cutAt).trimEnd();
  const pendingHints = pendingCandidates.filter((hint) => hint.start >= cutAt);

  return {
    stableContent,
    pendingHints,
  };
}
