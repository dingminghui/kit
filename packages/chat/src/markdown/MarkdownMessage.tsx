import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, {
  defaultSchema,
  type Options as RehypeSanitizeOptions,
} from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { ChatIcon, type ChatIconKey } from "../icons";
import { type Citation, parseCitations, stripTrailingIncompleteCitationBlock } from "./citations";
import { rehypeStreamingInlineCaret } from "./rehypeStreamingInlineCaret";
import { analyzeStreamingMarkdown, type PendingHint, type PendingHintKind } from "./streamingHints";
import { StreamingImage } from "./StreamingImage";
import { StreamLoadingIndicator } from "./StreamLoadingIndicator";

import "./MarkdownMessage.css";

export type MarkdownStreamState = "idle" | "streaming" | "done";

export interface MarkdownMessageProps {
  content: string;
  className?: string;
  streamState?: MarkdownStreamState;
  streamLoadingFallback?: ReactNode;
  onSourceClick?: (fileId: string, chunkId: string) => void;
}

type MarkdownViewMode = "loading" | "content" | "contentWithHints";
type PendingHintTone = "streaming" | "incomplete";

const pendingTextMap: Record<PendingHintKind, { streaming: string; done: string }> = {
  pendingImage: {
    streaming: "图片加载中...",
    done: "图片格式不完整",
  },
  pendingTable: {
    streaming: "表格生成中...",
    done: "表格格式不完整",
  },
  pendingCodeBlock: {
    streaming: "代码块生成中...",
    done: "代码块格式不完整",
  },
};

const mergeClassName = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(" ");

const PENDING_KIND_ICON: Record<PendingHintKind, ChatIconKey> = {
  pendingCodeBlock: "content.code",
  pendingTable: "content.table",
  pendingImage: "content.image",
};

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="kit-chat-markdown__h1">{children}</h1>,
  h2: ({ children }) => <h2 className="kit-chat-markdown__h2">{children}</h2>,
  h3: ({ children }) => <h3 className="kit-chat-markdown__h3">{children}</h3>,
  h4: ({ children }) => <h4 className="kit-chat-markdown__h4">{children}</h4>,
  h5: ({ children }) => <h5 className="kit-chat-markdown__h5">{children}</h5>,
  h6: ({ children }) => <h6 className="kit-chat-markdown__h6">{children}</h6>,
  p: ({ children }) => <p className="kit-chat-markdown__p">{children}</p>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="kit-chat-markdown__a">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="kit-chat-markdown__strong">{children}</strong>,
  em: ({ children }) => <em className="kit-chat-markdown__em">{children}</em>,
  del: ({ children }) => <del className="kit-chat-markdown__del">{children}</del>,
  ul: ({ children, className }) => (
    <ul className={mergeClassName("kit-chat-markdown__ul", className)}>{children}</ul>
  ),
  ol: ({ children, className }) => (
    <ol className={mergeClassName("kit-chat-markdown__ol", className)}>{children}</ol>
  ),
  li: ({ children, className }) => (
    <li className={mergeClassName("kit-chat-markdown__li", className)}>{children}</li>
  ),
  input: ({ type, checked, disabled }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled ?? true}
          readOnly
          className="kit-chat-markdown__checkbox"
        />
      );
    }
    return <input type={type} checked={checked} disabled={disabled} readOnly />;
  },
  pre: ({ children }) => <>{children}</>,
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return <code className="kit-chat-markdown__inline-code">{children}</code>;
    }

    const language = className.replace("language-", "").trim();
    return (
      <div className="kit-chat-markdown__code-block">
        <div className="kit-chat-markdown__code-lang">{language || "text"}</div>
        <pre className="kit-chat-markdown__pre">
          <code className="kit-chat-markdown__code-content">{children}</code>
        </pre>
      </div>
    );
  },
  table: ({ children }) => (
    <div className="kit-chat-markdown__table-wrapper">
      <table className="kit-chat-markdown__table">{children}</table>
    </div>
  ),
  img: ({ src, alt, title }) => <StreamingImage src={src ?? ""} alt={alt ?? ""} title={title} />,
  th: ({ children }) => <th className="kit-chat-markdown__th">{children}</th>,
  td: ({ children }) => <td className="kit-chat-markdown__td">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="kit-chat-markdown__blockquote">{children}</blockquote>
  ),
  hr: () => <hr className="kit-chat-markdown__hr" />,
};

const MARKDOWN_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  ...defaultSchema,
  tagNames: Array.from(new Set([...(defaultSchema.tagNames ?? []), "cite"])),
  attributes: {
    ...defaultSchema.attributes,
    cite: ["data*"],
  },
};

const REMARK_PLUGINS: ComponentProps<typeof ReactMarkdown>["remarkPlugins"] = [remarkGfm];

const DEFAULT_STREAM_LOADING = <StreamLoadingIndicator />;

function getCitationIndex(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value) && value.length > 0) {
    return getCitationIndex(value[0]);
  }

  return null;
}

function getCitationByIndex(citations: readonly Citation[], index: number): Citation | null {
  return citations.find((citation) => citation.index === index) ?? null;
}

function createMarkdownComponents(
  citations: readonly Citation[],
  onSourceClick: ((fileId: string, chunkId: string) => void) | undefined,
): Components {
  return {
    ...MARKDOWN_COMPONENTS,
    cite: ({ node }) => {
      const citationIndex = getCitationIndex(
        node?.properties?.["data-citation-index"] ?? node?.properties?.["dataCitationIndex"],
      );
      if (citationIndex === null) {
        return null;
      }

      const citation = getCitationByIndex(citations, citationIndex);
      if (!citation) {
        return null;
      }

      if (onSourceClick) {
        return (
          <button
            type="button"
            className="kit-chat-markdown__citation"
            aria-label={`来源 ${citationIndex}`}
            onClick={() => onSourceClick(citation.fileId, citation.chunkId)}
          >
            {citationIndex}
          </button>
        );
      }

      return (
        <span
          className="kit-chat-markdown__citation kit-chat-markdown__citation--static"
          aria-label={`来源 ${citationIndex}`}
        >
          {citationIndex}
        </span>
      );
    },
  };
}

function resolveMarkdownViewMode(
  streamState: MarkdownStreamState,
  content: string,
  pendingHintCount: number,
): MarkdownViewMode {
  if (streamState === "streaming" && content.trim().length === 0) {
    return "loading";
  }

  if ((streamState === "streaming" || streamState === "done") && pendingHintCount > 0) {
    return "contentWithHints";
  }

  return "content";
}

function resolvePendingHintTone(streamState: MarkdownStreamState): PendingHintTone {
  return streamState === "done" ? "incomplete" : "streaming";
}

type MarkdownBodyProps = {
  content: string;
  citations: readonly Citation[];
  onSourceClick?: (fileId: string, chunkId: string) => void;
  inlineStreamingCaret: boolean;
};

function MarkdownBody({ content, citations, onSourceClick, inlineStreamingCaret }: MarkdownBodyProps) {
  const components = useMemo(
    () => createMarkdownComponents(citations, onSourceClick),
    [citations, onSourceClick],
  );

  const rehypePlugins = useMemo(
    (): ComponentProps<typeof ReactMarkdown>["rehypePlugins"] => [
      rehypeRaw,
      [rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA],
      [rehypeStreamingInlineCaret, { enabled: inlineStreamingCaret }],
    ],
    [inlineStreamingCaret],
  );

  return (
    <div className="kit-chat-markdown__body">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function PendingHintItem({ hint, tone }: { hint: PendingHint; tone: PendingHintTone }) {
  const description =
    tone === "incomplete" ? pendingTextMap[hint.kind].done : pendingTextMap[hint.kind].streaming;
  const className = [
    "kit-chat-markdown__pending",
    tone === "incomplete"
      ? "kit-chat-markdown__pending--incomplete"
      : "kit-chat-markdown__pending--streaming",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <ChatIcon
        name={PENDING_KIND_ICON[hint.kind]}
        className="kit-chat-markdown__pending-lead-icon"
      />
      <span className="kit-chat-markdown__pending-text">{description}</span>
    </div>
  );
}

function PendingHintList({ hints, tone }: { hints: PendingHint[]; tone: PendingHintTone }) {
  return (
    <div className="kit-chat-markdown__pending-group">
      {hints.map((hint) => (
        <PendingHintItem key={`${hint.kind}:${hint.start}`} hint={hint} tone={tone} />
      ))}
    </div>
  );
}

export const MarkdownMessage = ({
  content,
  className,
  streamState = "idle",
  streamLoadingFallback,
  onSourceClick,
}: MarkdownMessageProps) => {
  const rootClassName = mergeClassName("kit-chat-markdown", className);
  const streamLoading =
    streamLoadingFallback !== undefined ? streamLoadingFallback : DEFAULT_STREAM_LOADING;
  const contentForStreamProcessing = useMemo(() => {
    if (streamState !== "streaming") {
      return content;
    }
    return stripTrailingIncompleteCitationBlock(content);
  }, [content, streamState]);

  const analysis = useMemo(
    () => analyzeStreamingMarkdown(contentForStreamProcessing),
    [contentForStreamProcessing],
  );
  const viewMode = resolveMarkdownViewMode(streamState, content, analysis.pendingHints.length);
  const markdownContent =
    viewMode === "contentWithHints" ? analysis.stableContent : contentForStreamProcessing;
  const pendingTone = resolvePendingHintTone(streamState);
  const parsedContent = useMemo(
    () => parseCitations(markdownContent, { stripIncompleteTail: streamState === "streaming" }),
    [markdownContent, streamState],
  );

  const inlineStreamingCaret =
    streamState === "streaming" && viewMode !== "loading" && viewMode !== "contentWithHints";

  return (
    <div className={rootClassName}>
      {viewMode === "loading" ? (
        streamLoading
      ) : (
        <div
          className="kit-chat-markdown__stream"
          {...(inlineStreamingCaret ? { "aria-busy": true as const } : {})}
        >
          <MarkdownBody
            content={parsedContent.content}
            citations={parsedContent.citations}
            inlineStreamingCaret={inlineStreamingCaret}
            {...(onSourceClick ? { onSourceClick } : {})}
          />
          {viewMode === "contentWithHints" ? (
            <PendingHintList hints={analysis.pendingHints} tone={pendingTone} />
          ) : null}
        </div>
      )}
    </div>
  );
};

MarkdownMessage.displayName = "MarkdownMessage";
