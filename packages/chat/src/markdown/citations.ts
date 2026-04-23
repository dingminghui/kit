const CITATION_PATTERN = /\{\{\[([^\]]+)\]\[([^\]]+)\]\}\}/g;

export interface Citation {
  index: number;
  fileId: string;
  chunkId: string;
}

export interface ParseCitationsResult {
  content: string;
  citations: Citation[];
}

type CitationBlockParse = "complete" | "incomplete" | "notOurs";

export function stripTrailingIncompleteCitationBlock(content: string): string {
  const start = content.lastIndexOf("{{[");
  if (start === -1) {
    return content;
  }
  const tail = content.slice(start);
  const parseResult = parseSourceCitationBlock(tail);
  if (parseResult === "incomplete") {
    return content.slice(0, start);
  }
  return content;
}

function parseSourceCitationBlock(s: string): CitationBlockParse {
  if (!s.startsWith("{{[") || s.length < 3) {
    return "notOurs";
  }
  if (s[0] !== "{" || s[1] !== "{" || s[2] !== "[") {
    return "notOurs";
  }

  let i = 3;
  const fileStart = i;
  while (i < s.length && s[i] !== "]") {
    if (s[i] === "\n" || s[i] === "\r") {
      return "notOurs";
    }
    i += 1;
  }
  if (i === fileStart) {
    return "incomplete";
  }
  if (i >= s.length) {
    return "incomplete";
  }
  if (s[i] !== "]") {
    return "notOurs";
  }
  i += 1;
  if (i >= s.length) {
    return "incomplete";
  }
  if (s[i] !== "[") {
    return "notOurs";
  }
  i += 1;
  const chunkStart = i;
  while (i < s.length && s[i] !== "]") {
    if (s[i] === "\n" || s[i] === "\r") {
      return "notOurs";
    }
    i += 1;
  }
  if (i === chunkStart) {
    return "incomplete";
  }
  if (i >= s.length) {
    return "incomplete";
  }
  if (s[i] !== "]") {
    return "notOurs";
  }
  i += 1;
  if (i + 1 >= s.length) {
    return "incomplete";
  }
  if (s[i] === "}" && s[i + 1] === "}") {
    return i + 2 === s.length ? "complete" : "notOurs";
  }
  return "incomplete";
}

export function parseCitations(
  content: string,
  options?: { stripIncompleteTail?: boolean },
): ParseCitationsResult {
  const prepared =
    options?.stripIncompleteTail === true ? stripTrailingIncompleteCitationBlock(content) : content;

  const citations: Citation[] = [];
  const nextContent = prepared.replace(
    CITATION_PATTERN,
    (_match: string, fileId: string, chunkId: string) => {
      const index = citations.length + 1;
      citations.push({ index, fileId, chunkId });
      return `<cite data-citation-index="${index}"></cite>`;
    },
  );

  return {
    content: nextContent,
    citations,
  };
}
