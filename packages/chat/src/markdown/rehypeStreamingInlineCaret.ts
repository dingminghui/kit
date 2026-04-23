/** Narrow hast shapes used by the inline caret plugin (avoids a direct `hast` dependency). */
type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastChild[];
};

type HastChild = HastElement | { type: string; [key: string]: unknown };

type HastRoot = {
  type: "root";
  children: HastChild[];
};

export type RehypeStreamingInlineCaretOptions = {
  enabled?: boolean;
};

function isElement(node: HastChild): node is HastElement {
  return typeof node === "object" && node !== null && node.type === "element" && "tagName" in node;
}

function isCaretHost(el: HastElement): boolean {
  const { tagName } = el;
  if (
    tagName === "p" ||
    tagName === "td" ||
    tagName === "th" ||
    tagName === "pre" ||
    tagName === "li"
  ) {
    return true;
  }
  return /^h[1-6]$/.test(tagName);
}

function findLastCaretHost(root: HastRoot): HastElement | null {
  let last: HastElement | null = null;

  const walk = (node: HastChild) => {
    if (!isElement(node)) {
      return;
    }
    if (isCaretHost(node)) {
      last = node;
    }
    for (const child of node.children) {
      walk(child);
    }
  };

  for (const child of root.children) {
    walk(child);
  }

  return last;
}

/**
 * Injects an inline caret span at the end of the last text-bearing block so it
 * stays on the same line as narrative text (see MarkdownMessage plan).
 * Runs after sanitize; only mutates the tree when `enabled` is true.
 */
export function rehypeStreamingInlineCaret(options: RehypeStreamingInlineCaretOptions = {}) {
  return (tree: HastRoot) => {
    if (!options.enabled) {
      return;
    }

    const host = findLastCaretHost(tree);
    if (!host) {
      return;
    }

    const caret: HastElement = {
      type: "element",
      tagName: "span",
      properties: {
        className: ["kit-chat-markdown__inline-caret"],
        ariaHidden: "true",
      },
      children: [],
    };

    host.children.push(caret);
  };
}
